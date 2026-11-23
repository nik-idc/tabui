import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { packCurrentPackage } from "./pack-package.mjs";

const rootFlag = process.argv.indexOf("--root");
const root =
  rootFlag === -1
    ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
    : path.resolve(process.argv[rootFlag + 1]);
const workspace = await mkdtemp(path.join(tmpdir(), "tabui-integrations-"));
/** Active consumers retain ownership of the shared package until they exit. */
const active = new Set();
let interrupted = false;
let failed = false;

/** Interrupt consumers together; their own cleanup handles npm/build groups. */
function stop(signal) {
  interrupted = true;
  process.exitCode = signal === "SIGINT" ? 130 : 143;
  for (const child of active) {
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* Already stopped. */
      }
    }, 8000);
    child.once("close", () => clearTimeout(timer));
  }
}
const interrupt = () => stop("SIGINT");
const terminate = () => stop("SIGTERM");
process.on("SIGINT", interrupt);
process.on("SIGTERM", terminate);

try {
  const tarball = await packCurrentPackage(root, workspace, (child) =>
    active.add(child)
  );
  active.clear();
  const queue = ["angular", "raw", "react", "vue"];
  /** Runs a fixed consumer queue without stopping on ordinary test failures. */
  async function worker() {
    while (queue.length && !interrupted) {
      const name = queue.shift();
      const child = spawn(
        process.execPath,
        [path.join(root, "tests/integration", name, `${name}-integration.mjs`)],
        {
          cwd: root,
          detached: true,
          env: { ...process.env, TABUI_INTEGRATION_TARBALL: tarball },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
      active.add(child);
      console.log(`[${name}] started`);
      for (const [stream, output] of [
        [child.stdout, process.stdout],
        [child.stderr, process.stderr],
      ]) {
        createInterface({ input: stream }).on("line", (line) => {
          output.write(`[${name}] ${line}\n`);
        });
      }
      const code = await new Promise((resolve) => {
        child.once("error", (error) => {
          console.error(`[${name}] ${error.message}`);
          resolve(1);
        });
        child.once("close", resolve);
      });
      active.delete(child);
      failed ||= code !== 0;
      console.log(`[${name}] exited ${code}`);
    }
  }
  await Promise.all([worker(), worker()]);
  if (failed && !interrupted) {
    process.exitCode = 1;
  }
} finally {
  process.off("SIGINT", interrupt);
  process.off("SIGTERM", terminate);
  await rm(workspace, { recursive: true, force: true });
}
