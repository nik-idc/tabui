import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/** Installs a packed TabUI build and isolated tools for a consumer fixture. */
export async function createConsumerProject(fixture, name, dependencies = {}) {
  const workspace = await mkdtemp(path.join(tmpdir(), `tabui-${name}-`));
  const directory = path.join(workspace, "consumer");

  /** Runs a bounded consumer command with captured failure output. */
  async function run(command, args, options = {}) {
    try {
      return await execFileAsync(command, args, {
        cwd: directory,
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        ...options,
      });
    } catch (cause) {
      const stdout = cause.stdout ? `\nstdout:\n${cause.stdout}` : "";
      const stderr = cause.stderr ? `\nstderr:\n${cause.stderr}` : "";
      throw new Error(
        `Command failed: ${command} ${args.join(" ")}${stdout}${stderr}`,
        { cause }
      );
    }
  }

  try {
    await cp(fixture, directory, { recursive: true });
    const packed = await run(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", workspace],
      {
        cwd: rootDir,
        env: { ...process.env, HUSKY: "0" },
      }
    );
    const jsonStart = packed.stdout.indexOf("[");
    assert(jsonStart !== -1, `npm pack did not return JSON:\n${packed.stdout}`);
    const [info] = JSON.parse(packed.stdout.slice(jsonStart));
    const versions = {};
    for (const tool of ["vite", "typescript"]) {
      const manifest = JSON.parse(
        await readFile(
          path.join(rootDir, "node_modules", tool, "package.json"),
          "utf8"
        )
      );
      versions[tool] = manifest.version;
    }
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify(
        {
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            typecheck: "tsc --noEmit",
          },
          dependencies: {
            ...dependencies,
            "@atikincode/tabui": path.join(workspace, info.filename),
          },
          devDependencies: versions,
        },
        null,
        2
      )
    );
    await run("npm", [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ]);
    const packageRoot = path.join(directory, "node_modules/@atikincode/tabui");
    const packagedFiles = [
      "dist/index.mjs",
      "dist/index.d.ts",
      "dist/styles.css",
      "assets/img/ui/play.svg",
    ];
    for (const file of packagedFiles) {
      await stat(path.join(packageRoot, file));
    }
    return {
      directory,
      run,
      dispose: () => rm(workspace, { force: true, recursive: true }),
    };
  } catch (error) {
    await rm(workspace, { force: true, recursive: true });
    throw error;
  }
}
