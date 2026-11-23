import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";

/** Packs the current build once; the caller owns the destination's lifetime. */
export async function packCurrentPackage(
  root,
  destination,
  started = () => {}
) {
  const child = spawn(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", destination],
    {
      cwd: root,
      detached: true,
      env: { ...process.env, HUSKY: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  started(child);
  const timer = setTimeout(() => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      /* Already stopped. */
    }
  }, 120_000);
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (v) => {
    stdout += v;
  });
  child.stderr.on("data", (v) => {
    stderr += v;
  });
  let code;
  try {
    code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
  } finally {
    clearTimeout(timer);
  }
  assert.equal(code, 0, `npm pack failed: ${stderr}`);
  const start = stdout.indexOf("[");
  assert(start !== -1, `npm pack did not return JSON: ${stdout}`);
  return path.join(destination, JSON.parse(stdout.slice(start))[0].filename);
}
