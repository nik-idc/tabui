import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { createConsumerProject } from "./consumer-project.mjs";

const exec = promisify(execFile);
process.env.npm_config_offline = "true";

/** Makes deterministic local npm packages; no registry is needed by these tests. */
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "tabui-setup-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = path.join(root, "fixture");
  await mkdir(app);
  await writeFile(path.join(app, "index.html"), "fixture");
  async function pack(name, value, extra = {}) {
    const source = await mkdtemp(path.join(root, "package-"));
    await writeFile(
      path.join(source, "package.json"),
      JSON.stringify({ name, version: "1.0.0", ...extra })
    );
    for (const file of [
      "dist/index.mjs",
      "dist/index.d.ts",
      "dist/styles.css",
      "assets/img/ui/play.svg",
    ]) {
      await mkdir(path.dirname(path.join(source, file)), { recursive: true });
      await writeFile(path.join(source, file), value);
    }
    await writeFile(
      path.join(source, "tool.cjs"),
      `#!/usr/bin/env node\nconsole.log(${JSON.stringify(value)})\n`
    );
    await chmod(path.join(source, "tool.cjs"), 0o755);
    const { stdout } = await exec(
      "npm",
      ["pack", "--json", "--ignore-scripts"],
      { cwd: source }
    );
    return path.join(source, JSON.parse(stdout)[0].filename);
  }
  const tarball = await pack("@atikincode/tabui", "first");
  const tool = await pack("tiny-tool", "tool works", {
    bin: { "tiny-tool": "tool.cjs" },
  });
  const templateDirectory = path.join(root, "template");
  await mkdir(templateDirectory);
  await writeFile(
    path.join(templateDirectory, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      devDependencies: { "tiny-tool": `file:${tool}` },
    })
  );
  await exec(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    { cwd: templateDirectory }
  );
  const options = {
    templateDirectory,
    tarball,
  };
  async function setup(overrides = {}) {
    const project = await createConsumerProject(
      app,
      "test",
      {},
      { ...options, ...overrides }
    );
    t.after(() => project.dispose());
    return project;
  }
  return { root, app, pack, options, setup };
}

test("setup installs a supplied fresh package and rejects an invalid supplied path", async (t) => {
  const f = await fixture(t);
  const first = await f.setup();
  assert.equal(
    await readFile(
      path.join(
        first.directory,
        "node_modules/@atikincode/tabui/dist/index.mjs"
      ),
      "utf8"
    ),
    "first"
  );
  const second = await f.setup({
    tarball: await f.pack("@atikincode/tabui", "second"),
  });
  assert.equal(
    await readFile(
      path.join(
        second.directory,
        "node_modules/@atikincode/tabui/dist/index.mjs"
      ),
      "utf8"
    ),
    "second"
  );
  await assert.rejects(
    f.setup({ tarball: path.join(f.root, "missing.tgz") }),
    /ENOENT/
  );
  await first.dispose();
  await assert.rejects(readFile(path.join(first.directory, "package.json")), {
    code: "ENOENT",
  });
});

test("locked setup removes stale fixture tools before installing the consumer", async (t) => {
  const f = await fixture(t);
  const stale = path.join(f.app, "node_modules/stale-tool");
  await mkdir(stale, { recursive: true });
  await writeFile(path.join(stale, "stale.txt"), "not in the lockfile");
  const project = await f.setup();
  await assert.rejects(
    readFile(path.join(project.directory, "node_modules/stale-tool/stale.txt")),
    { code: "ENOENT" }
  );
});

test("locked setups isolate tools and retain executable bin links", async (t) => {
  const f = await fixture(t);
  const first = await f.setup();
  await writeFile(
    path.join(first.directory, "node_modules/tiny-tool/tool.cjs"),
    "changed"
  );
  const second = await f.setup();
  assert.notEqual(first.directory, second.directory);
  const result = await second.run(
    path.join(second.directory, "node_modules/.bin/tiny-tool"),
    []
  );
  assert.equal(result.stdout.trim(), "tool works");
  await writeFile(
    path.join(second.directory, "node_modules/tiny-tool/tool.cjs"),
    "also changed"
  );
  const third = await f.setup();
  assert.equal(
    (
      await third.run(
        path.join(third.directory, "node_modules/.bin/tiny-tool"),
        []
      )
    ).stdout.trim(),
    "tool works"
  );
});

test("concurrent setup callers get independent locked installations", async (t) => {
  const f = await fixture(t);
  const projects = await Promise.all([f.setup(), f.setup()]);
  assert.notEqual(projects[0].directory, projects[1].directory);
  for (const project of projects) {
    assert.equal(
      (
        await project.run(
          path.join(project.directory, "node_modules/.bin/tiny-tool"),
          []
        )
      ).stdout.trim(),
      "tool works"
    );
  }
});

test("interrupt during locked installation kills descendants, removes the consumer and permits retry", async (t) => {
  const f = await fixture(t);
  const realNpm = (await exec("which", ["npm"])).stdout.trim();
  const bin = path.join(f.root, "bin");
  await mkdir(bin);
  const sentinel = path.join(f.root, "descendant-survived");
  const ready = path.join(f.root, "ready");
  await writeFile(
    path.join(bin, "npm"),
    `#!/usr/bin/env node
    const { spawn, spawnSync } = require('node:child_process');
    if (process.argv[2] === 'ci') {
      spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'survived'), 1500)`)}], { stdio: 'ignore' });
      require('node:fs').writeFileSync(${JSON.stringify(ready)}, 'ready');
      setInterval(() => {}, 1000);
    } else {
      const result = spawnSync(${JSON.stringify(realNpm)}, process.argv.slice(2), { stdio: 'inherit' });
      process.exit(result.status ?? 1);
    }
  `
  );
  await chmod(path.join(bin, "npm"), 0o755);
  const module = pathToFileURL(
    path.resolve("tests/integration/consumer-project.mjs")
  ).href;
  const consumersBefore = (await readdir(tmpdir())).filter((v) =>
    v.startsWith("tabui-interrupt-test-")
  );
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { createConsumerProject } from ${JSON.stringify(module)};
    await createConsumerProject(${JSON.stringify(f.app)}, 'interrupt-test', {}, ${JSON.stringify(f.options)});
  `,
    ],
    {
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  t.after(() => child.kill("SIGKILL"));
  const exited = once(child, "exit");
  let output = "";
  child.stderr.resume();
  // A fixture-side signal puts the interrupt inside installation, not on a timer.
  child.stdout.on("data", (v) => {
    output += v;
  });
  const deadline = Date.now() + 5000;
  while (!(await readFile(ready, "utf8").catch(() => ""))) {
    assert(Date.now() < deadline, `Setup must reach installation: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  child.kill("SIGTERM");
  assert.notEqual((await exited)[0], 0);
  assert.deepEqual(
    (await readdir(tmpdir())).filter((v) =>
      v.startsWith("tabui-interrupt-test-")
    ),
    consumersBefore
  );
  await new Promise((resolve) => setTimeout(resolve, 1700));
  await assert.rejects(readFile(sentinel), { code: "ENOENT" });
  const retry = await f.setup();
  assert.equal(
    (
      await retry.run(
        path.join(retry.directory, "node_modules/.bin/tiny-tool"),
        []
      )
    ).stdout.trim(),
    "tool works"
  );
});

test("failed locked installation can be retried and npm resolves runtime dependencies and peers", async (t) => {
  const f = await fixture(t);
  const lockPath = path.join(f.options.templateDirectory, "package-lock.json");
  const original = await readFile(lockPath, "utf8");
  const lock = JSON.parse(original);
  delete lock.packages["node_modules/tiny-tool"];
  await writeFile(lockPath, JSON.stringify(lock));
  const before = (await readdir(tmpdir())).filter((v) =>
    v.startsWith("tabui-test-")
  );
  await assert.rejects(f.setup(), /npm ci|Missing/);
  assert.deepEqual(
    (await readdir(tmpdir())).filter((v) => v.startsWith("tabui-test-")),
    before
  );
  await writeFile(lockPath, original);
  const runtime = await f.pack("tiny-runtime", "runtime");
  const project = await f.setup({
    tarball: await f.pack("@atikincode/tabui", "with runtime", {
      dependencies: { "tiny-runtime": `file:${runtime}` },
    }),
  });
  assert.equal(
    await readFile(
      path.join(project.directory, "node_modules/tiny-runtime/dist/index.mjs"),
      "utf8"
    ),
    "runtime"
  );
  const conflict = await f.pack("@atikincode/tabui", "conflict", {
    peerDependencies: { "tiny-tool": "2.0.0" },
  });
  await assert.rejects(f.setup({ tarball: conflict }), /ERESOLVE/);
  await f.setup();
});

test("focused setup packs the current package when no shared tarball is supplied", async (t) => {
  const f = await fixture(t);
  const sourceTarball = await f.pack(
    "@atikincode/tabui",
    "focused current build"
  );
  const project = await f.setup({
    tarball: undefined,
    packageRoot: path.dirname(sourceTarball),
  });
  const value = await readFile(
    path.join(
      project.directory,
      "node_modules/@atikincode/tabui/dist/index.mjs"
    ),
    "utf8"
  );
  assert(
    value === "focused current build",
    "Focused setup must pack its current package root"
  );
});

test("consumer commands retain failure diagnostics and timeouts stop descendants", async (t) => {
  const f = await fixture(t);
  const project = await f.setup();
  await assert.rejects(
    project.run(process.execPath, [
      "-e",
      "console.log('command output'); console.error('command error'); process.exit(7)",
    ]),
    /stdout:\s+command output\s+stderr:\s+command error/
  );
  const sentinel = path.join(f.root, "command-descendant-survived");
  await assert.rejects(
    project.run(
      process.execPath,
      [
        "-e",
        `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'survived'), 1500)`)}], { stdio: 'ignore' }); setInterval(() => {}, 1000)`,
      ],
      { timeout: 300 }
    ),
    /Command failed/
  );
  await new Promise((resolve) => setTimeout(resolve, 1700));
  await assert.rejects(readFile(sentinel), { code: "ENOENT" });
  await project.dispose();
  await assert.rejects(readFile(path.join(project.directory, "package.json")), {
    code: "ENOENT",
  });
});

test("consumer disposal closes registered browser and server resources before removing files", async (t) => {
  const f = await fixture(t);
  const project = await f.setup();
  let closed = false;
  project.addCleanup(async () => {
    await readFile(path.join(project.directory, "package.json"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    closed = true;
  });
  await project.dispose();
  assert.equal(closed, true);
  await assert.rejects(readFile(path.join(project.directory, "package.json")), {
    code: "ENOENT",
  });
});
