import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Keeps install policy explicit rather than inheriting production-only npm defaults. */
export const installFlags = [
  "--include=dev",
  "--include=optional",
  "--ignore-scripts",
  "--no-audit",
  "--no-fund",
];

/** Installs locked external tools in the private consumer, using npm's download cache. */
export async function prepareToolchain(template, directory, run) {
  const started = performance.now();
  const manifest = await readFile(path.join(template, "package.json"), "utf8");
  const lock = await readFile(path.join(template, "package-lock.json"), "utf8");
  await writeFile(path.join(directory, "package.json"), manifest);
  await writeFile(path.join(directory, "package-lock.json"), lock);
  await run("npm", ["ci", ...installFlags]);
  return {
    manifest: JSON.parse(manifest),
    totalMs: performance.now() - started,
  };
}
