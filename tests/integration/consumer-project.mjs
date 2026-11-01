import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installFlags, prepareToolchain } from "./consumer-toolchain.mjs";
import { packCurrentPackage } from "./pack-package.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/**
 * Installs locked external tools, then installs a fresh packed TabUI through npm.
 * Template, tarball, and package root paths can be overridden by setup callers.
 */
export async function createConsumerProject(
  fixture,
  name,
  dependencies = {},
  options = {}
) {
  const workspace = await mkdtemp(path.join(tmpdir(), `tabui-${name}-`));
  const directory = path.join(workspace, "consumer");
  /** Commands use separate groups so npm/build descendants cannot outlive disposal. */
  const children = new Set();
  /** Browsers and in-process servers must close before interrupted installs disappear. */
  const cleanups = new Set();
  let cancelled = false;
  let disposing;

  /** Includes a long-running native server in consumer cleanup. */
  function trackChild(child) {
    children.add(child);
    child.once("close", () => children.delete(child));
  }

  /** Registers a resource at its acquisition boundary; returns its normal-path release. */
  function addCleanup(cleanup) {
    cleanups.add(cleanup);
    return () => cleanups.delete(cleanup);
  }

  /** Sends a signal to the whole command group, including npm's children. */
  function kill(child, signal) {
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
  }
  /** Fails setup between asynchronous operations after an interrupt. */
  function checkCancelled() {
    if (cancelled) {
      throw new Error("Consumer interrupted");
    }
  }
  /** Runs a bounded consumer command, retaining useful output on failure. */
  async function run(command, args, commandOptions = {}) {
    checkCancelled();
    const child = spawn(command, args, {
      cwd: directory,
      ...commandOptions,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.add(child);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (v) => {
      stdout += v;
    });
    child.stderr.on("data", (v) => {
      stderr += v;
    });
    const timer = setTimeout(
      () => kill(child, "SIGKILL"),
      commandOptions.timeout ?? options.timeout ?? 120_000
    );
    try {
      const code = await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", resolve);
      });
      if (code !== 0) {
        throw new Error(
          `Command failed: ${command} ${args.join(" ")}\nstdout:\n${stdout}\nstderr:\n${stderr}`
        );
      }
      checkCancelled();
      return { stdout, stderr };
    } finally {
      clearTimeout(timer);
      kill(child, "SIGKILL");
      children.delete(child);
    }
  }
  /** Cleans commands first, then the private consumer; safe to call more than once. */
  function dispose() {
    disposing ??= (async () => {
      let timer;
      try {
        await Promise.race([
          Promise.allSettled([...cleanups].map((v) => v())),
          new Promise((resolve) => {
            timer = setTimeout(resolve, 5000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
        cleanups.clear();
      }
      for (const child of children) {
        kill(child, "SIGKILL");
      }
      await Promise.all(
        [...children].map(
          (v) =>
            new Promise((resolve) =>
              v.exitCode !== null || v.signalCode !== null
                ? resolve()
                : v.once("close", resolve)
            )
        )
      );
      await rm(workspace, { recursive: true, force: true });
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", terminate);
    })();
    return disposing;
  }
  let settingUp = true;
  /** During demos the entrypoint's listener closes its server and calls dispose. */
  function stop(signal) {
    if (
      !settingUp &&
      process.argv.includes("--demo") &&
      process.listenerCount(signal) > 1
    ) {
      return;
    }
    cancelled = true;
    for (const child of children) {
      kill(child, "SIGKILL");
    }
    if (!settingUp) {
      void dispose().then(() => process.exit(signal === "SIGINT" ? 130 : 143));
    }
  }
  const interrupt = () => stop("SIGINT");
  const terminate = () => stop("SIGTERM");
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", terminate);

  try {
    await cp(fixture, directory, { recursive: true });
    await mkdir(path.join(directory, "public"), { recursive: true });
    await cp(
      path.join(rootDir, "assets/tabber-favicon.svg"),
      path.join(directory, "public/tabber-favicon.svg")
    );
    const supplied = options.tarball ?? process.env.TABUI_INTEGRATION_TARBALL;
    const tarball =
      supplied ??
      (await packCurrentPackage(
        options.packageRoot ?? rootDir,
        workspace,
        trackChild
      ));
    await stat(tarball);
    await cp(tarball, path.join(directory, "tabui-current.tgz"));
    checkCancelled();
    const toolchain = await prepareToolchain(
      options.templateDirectory ??
        path.join(rootDir, "tests/integration/toolchains", name),
      directory,
      run
    );
    const manifest = {
      ...toolchain.manifest,
      scripts: options.scripts ?? {
        dev: "vite",
        build: "vite build",
        typecheck: "tsc --noEmit",
      },
      dependencies: {
        ...toolchain.manifest.dependencies,
        ...dependencies,
        "@atikincode/tabui": "file:./tabui-current.tgz",
      },
      devDependencies: {
        ...toolchain.manifest.devDependencies,
        ...options.devDependencies,
      },
    };
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify(manifest, null, 2)
    );
    // Normal resolution is intentional: new runtime dependencies and peer conflicts
    // must behave like a real npm consumer, rather than an extracted package copy.
    const installStarted = performance.now();
    await run("npm", ["install", ...installFlags]);
    const installMs = performance.now() - installStarted;
    console.log(
      `${name} setup: locked tools install ${(toolchain.totalMs / 1000).toFixed(2)}s, fresh package install ${(installMs / 1000).toFixed(2)}s`
    );
    for (const file of [
      "dist/index.mjs",
      "dist/index.d.ts",
      "dist/styles.css",
      "assets/img/ui/play.svg",
    ]) {
      await stat(path.join(directory, "node_modules/@atikincode/tabui", file));
    }
    checkCancelled();
    settingUp = false;
    return {
      directory,
      run,
      dispose,
      trackChild,
      addCleanup,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}
