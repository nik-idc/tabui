import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const exec = promisify(execFile);
const runner = path.resolve("tests/integration/run-integrations.mjs");

test("CLI packs once, starts Angular first, limits workers and continues after failure", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tabui-runner-test-"));
  try {
    const realNpm = (await exec("which", ["npm"])).stdout.trim();
    const bin = path.join(root, "bin");
    await mkdir(bin);
    await writeFile(
      path.join(bin, "npm"),
      `#!/usr/bin/env node
      require('node:fs').appendFileSync(${JSON.stringify(path.join(root, "npm-calls"))}, process.argv[2] + '\\n');
      const result = require('node:child_process').spawnSync(${JSON.stringify(realNpm)}, process.argv.slice(2), { stdio: 'inherit' });
      process.exit(result.status ?? 1);
    `
    );
    await chmod(path.join(bin, "npm"), 0o755);
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "runner-fixture", version: "1.0.0" })
    );
    for (const name of ["angular", "raw", "react", "vue"]) {
      const directory = path.join(root, "tests/integration", name);
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, `${name}-integration.mjs`),
        `
        import { appendFile, stat } from 'node:fs/promises';
        await stat(process.env.TABUI_INTEGRATION_TARBALL);
        await appendFile('events', JSON.stringify({ name: '${name}', event: 'start', tarball: process.env.TABUI_INTEGRATION_TARBALL }) + '\\n');
        await new Promise(r => setTimeout(r, ${name === "angular" ? 400 : 80}));
        await appendFile('events', JSON.stringify({ name: '${name}', event: 'end' }) + '\\n');
        process.exitCode = ${name === "raw" ? 1 : 0};
      `
      );
    }
    await assert.rejects(
      exec(process.execPath, [runner, "--root", root], {
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        },
      }),
      (error) => {
        assert.match(error.stdout, /\[vue\]/);
        assert.deepEqual(
          [...error.stdout.matchAll(/\[(\w+)\] started/g)].map((v) => v[1]),
          ["angular", "raw", "react", "vue"]
        );
        return error.code === 1;
      }
    );
    assert.equal(
      await readFile(path.join(root, "npm-calls"), "utf8"),
      "pack\n"
    );
    const events = (await readFile(path.join(root, "events"), "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.deepEqual(
      events
        .filter((v) => v.event === "start")
        .map((v) => v.name)
        .sort(),
      ["angular", "raw", "react", "vue"]
    );
    let active = 0;
    let maximum = 0;
    for (const event of events) {
      active += event.event === "start" ? 1 : -1;
      maximum = Math.max(maximum, active);
    }
    assert.equal(maximum, 2);
    const tarballs = new Set(
      events.filter((v) => v.tarball).map((v) => v.tarball)
    );
    assert.equal(tarballs.size, 1);
    await assert.rejects(readFile([...tarballs][0]), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("interrupt stops scheduling and retains the shared tarball until active consumers exit", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tabui-runner-signal-test-"));
  let child;
  try {
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "signal-fixture", version: "1.0.0" })
    );
    for (const name of ["angular", "raw", "react", "vue"]) {
      const directory = path.join(root, "tests/integration", name);
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, `${name}-integration.mjs`),
        `
        import { appendFile, stat } from 'node:fs/promises';
        process.on('SIGTERM', async () => {
          await new Promise(r => setTimeout(r, 100));
          await stat(process.env.TABUI_INTEGRATION_TARBALL);
          await appendFile('finished', '${name}\\n');
          process.exit(0);
        });
        await appendFile('started', '${name}\\n');
        setInterval(() => {}, 1000);
      `
      );
    }
    child = spawn(process.execPath, [runner, "--root", root], {
      stdio: "ignore",
    });
    const exited = once(child, "exit");
    const deadline = Date.now() + 5000;
    while (
      (await readFile(path.join(root, "started"), "utf8").catch(() => ""))
        .trim()
        .split("\n").length !== 2
    ) {
      assert(
        Date.now() < deadline,
        "Consumers must start within the bounded wait"
      );
      await delay(20);
    }
    child.kill("SIGTERM");
    assert.equal((await exited)[0], 143);
    assert.deepEqual(
      (await readFile(path.join(root, "finished"), "utf8"))
        .trim()
        .split("\n")
        .sort(),
      ["angular", "raw"]
    );
    assert.deepEqual(
      (await readFile(path.join(root, "started"), "utf8"))
        .trim()
        .split("\n")
        .sort(),
      ["angular", "raw"]
    );
  } finally {
    child?.kill("SIGKILL");
    await rm(root, { recursive: true, force: true });
  }
});
