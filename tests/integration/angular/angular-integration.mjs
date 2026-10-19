import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { createConsumerProject } from "../consumer-project.mjs";

const fixture = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../demo/angular"
);
const angular = "21.2.25";
const project = await createConsumerProject(
  fixture,
  "angular",
  {
    "@angular/common": angular,
    "@angular/compiler": angular,
    "@angular/core": angular,
    "@angular/forms": angular,
    "@angular/platform-browser": angular,
    rxjs: "7.8.2",
    tslib: "2.8.1",
    "zone.js": "0.16.0",
  },
  {
    tools: [],
    devDependencies: {
      "@angular/build": "21.2.27",
      "@angular/cli": "21.2.27",
      "@angular/compiler-cli": angular,
      typescript: "5.9.3",
      // npm 10 otherwise crashes while resolving the builder's optional Vitest peers.
      vitest: "4.0.8",
    },
    scripts: { dev: "ng serve", build: "ng build", typecheck: "ngc --noEmit" },
    timeout: 300_000,
  }
);
const ng = path.join(project.directory, "node_modules/@angular/cli/bin/ng.js");
const environment = {
  ...process.env,
  NG_CLI_ANALYTICS: "false",
  NG_BUILD_MAX_WORKERS: "2",
};

/** Stops the CLI and waits for its children before deleting the installation. */
async function stopCLI(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
  try {
    await exited;
  } finally {
    clearTimeout(timer);
  }
}

/** Uses Angular's native AOT development server with a bounded startup wait. */
async function startDevelopment(port) {
  const child = spawn(
    process.execPath,
    [ng, "serve", "--port", String(port), "--host", "127.0.0.1", "--hmr=false"],
    {
      cwd: project.directory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  let output = "";
  try {
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Angular startup timed out:\n${output}`)),
        180_000
      );
      const collect = (chunk) => {
        output += chunk.toString().replace(/\u001b\[[0-9;]*m/g, "");
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      };
      child.stdout.on("data", collect);
      child.stderr.on("data", collect);
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Angular exited (${code}):\n${output}`));
      });
    });
    return { origin, close: () => stopCLI(child) };
  } catch (error) {
    await stopCLI(child);
    throw error;
  }
}

/** Serves only Angular's production output, without development transforms. */
async function startProduction() {
  const directory = path.join(project.directory, "dist/demo/browser");
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".map": "application/json",
  };
  const server = createServer(async (request, response) => {
    const name = new URL(request.url, "http://localhost").pathname;
    const file = path.resolve(
      directory,
      `.${name === "/" ? "/index.html" : name}`
    );
    try {
      assert(file.startsWith(`${directory}${path.sep}`));
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      ),
  };
}

/** Decodes both HTML controls and notation images from bundled data URLs. */
async function checkIcons(root) {
  return root.evaluate(async (element) => {
    const html = [...element.querySelectorAll("img")];
    const svg = [...element.querySelectorAll("svg image")];
    if (!html.length || !svg.length)
      throw new Error("Missing control or notation icons");
    const urls = [
      ...html.map((v) => v.src),
      ...svg.map(
        (v) =>
          v.getAttribute("href") ??
          v.getAttributeNS("http://www.w3.org/1999/xlink", "href")
      ),
    ];
    for (const url of new Set(urls)) {
      if (!url?.startsWith("data:image/svg+xml"))
        throw new Error("Icon is not bundled");
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth) throw new Error("Empty icon");
    }
    return urls[0];
  });
}

/** Verifies visible UI and notation colours as well as stylesheet loading. */
async function checkTheme(root, dark) {
  const colors = await root.evaluate((element) => {
    const text = element.querySelector(".tu-root-svg text");
    if (!text) throw new Error("Missing notation text");
    return [
      getComputedStyle(element).backgroundColor,
      getComputedStyle(element).color,
      getComputedStyle(text).fill,
    ];
  });
  assert.deepEqual(
    colors,
    dark
      ? ["rgb(15, 23, 42)", "rgb(229, 238, 251)", "rgb(229, 238, 251)"]
      : ["rgb(241, 245, 249)", "rgb(17, 24, 39)", "rgb(17, 24, 39)"]
  );
}

/** Exercises Angular forms, public editor events, input changes and lifecycle cleanup. */
async function checkAngular(page) {
  const output = (name) => page.getByRole("status", { name, exact: true });
  const root = page.locator("#tabui-editor");
  const button = (name) => page.getByRole("button", { name, exact: true });
  const selectTrack = async (name) =>
    root
      .getByRole("button", { name: `Select track: ${name}`, exact: true })
      .click();
  await expect(output("Effect setups")).toHaveText("1");
  await expect(output("Effect cleanups")).toHaveText("0");
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await expect(output("Active track")).toHaveText("Track 1");
  const lightIcon = await checkIcons(root);
  await checkTheme(root, false);
  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await selectTrack("Second track");
  await expect(output("Change events")).toHaveText("1");
  await root.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("7");
  await expect(root.locator('[id^="note-text-"]')).toHaveText("7");
  await expect(root.locator("#tu-selection rect").first()).toBeVisible();
  const beforeForm = Number(await output("Change events").textContent());

  const form = page.getByRole("form", { name: "Practice session" });
  const title = form.getByRole("textbox", { name: "Session title" });
  const notes = form.getByRole("textbox", { name: "Practice notes" });
  const preview = form.getByRole("status", { name: "Session preview" });
  const saved = page.getByRole("list", { name: "Saved sessions" });
  const notation = await root.locator(".tu-root-svg").elementHandle();
  const selection = await root.locator("#tu-selection").innerHTML();
  const selectionDescription = await root.getByRole("status").textContent();
  await title.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("Enter a session title.");
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await title.pressSequentially("Riff 24");
  await expect(title).toBeFocused();
  await notes.pressSequentially("Practice a slow riff.");
  await form
    .getByRole("combobox", { name: "Practice pace" })
    .selectOption("Slow");
  await expect(preview).toHaveText("Riff 24 · Slow · Second track");
  const include = form.getByRole("checkbox", {
    name: "Include practice notes",
  });
  await include.uncheck();
  await expect(notes).toHaveCount(0);
  await include.check();
  await expect(notes).toHaveValue("Practice a slow riff.");
  await title.press("Enter");
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  await expect(saved).toContainText("Practice a slow riff.");
  await title.fill("Warmup");
  await button("Save session").click();
  await expect(saved.getByRole("listitem")).toHaveCount(2);
  const retainedSession = await saved
    .getByRole("listitem")
    .nth(1)
    .elementHandle();
  await button("Remove session Riff 24").click();
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  assert(
    await retainedSession.evaluate((v) => v.isConnected),
    "Keyed list must retain the remaining session DOM"
  );
  await retainedSession.dispose();
  await expect(output("Change events")).toHaveText(String(beforeForm));
  await expect(output("Active track")).toHaveText("Second track");
  await expect(output("Effect setups")).toHaveText("1");
  assert(
    await notation.evaluate((v) => v.isConnected),
    "Form changes must retain notation DOM"
  );
  assert.equal(
    await root.locator("#tu-selection").innerHTML(),
    selection,
    "Form keystrokes must retain the editor selection"
  );
  await expect(root.getByRole("status")).toHaveText(selectionDescription);
  await notation.dispose();
  await selectTrack("Track 1");
  await expect(preview).toHaveText("Warmup · Slow · Track 1");
  await expect(title).toHaveValue("Warmup");
  await button("Resize editor").click();
  await expect(output("Layout width")).toHaveText("1100");
  await expect(output("Change events")).toHaveText(String(beforeForm + 2));
  const detached = await root.elementHandle();
  await button("Unmount editor").click();
  await expect(root).toHaveCount(0);
  await expect(output("Active track")).toHaveText("Unmounted");
  await expect(output("Effect cleanups")).toHaveText("1");
  assert.equal(await detached.evaluate((v) => v.childElementCount), 0);
  await detached.dispose();
  await expect(page.locator("#host-sibling")).toHaveText(
    "Angular-owned content stays mounted."
  );
  await button("Mount editor").click();
  await expect(output("Effect setups")).toHaveText("2");
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await selectTrack("Second track");
  await expect(output("Change events")).toHaveText(String(beforeForm + 3));
  await expect(root.locator('[id^="note-text-"]')).toHaveText("7");

  // Rename through TabUI to prove that the same score survives theme rebuilds.
  const trackName = root.getByRole("textbox", {
    name: "Second track name",
    exact: true,
  });
  await trackName.fill("Practice guitar");
  await trackName.press("Tab");
  // Theme replacement is checked with both lifecycle counters and DOM identity.
  for (const [variant, setups] of [
    ["dark", 3],
    ["light", 4],
  ]) {
    const oldNotation = await root.locator(".tu-root-svg").elementHandle();
    await button(`Use ${variant} theme`).click();
    await expect(output("Effect setups")).toHaveText(String(setups));
    await expect(output("Effect cleanups")).toHaveText(String(setups - 1));
    await expect(root.locator(".tu-root-svg")).toHaveCount(1);
    assert.equal(await oldNotation.evaluate((v) => v.isConnected), false);
    await oldNotation.dispose();
    await checkTheme(root, variant === "dark");
    await root.getByRole("button", { name: "Tracks", exact: true }).click();
    await expect(
      root.getByRole("button", {
        name: "Select track: Practice guitar",
        exact: true,
      })
    ).toBeVisible();
    await selectTrack("Practice guitar");
    await expect(root.locator('[id^="note-text-"]')).toHaveText("7");
    const icon = await checkIcons(root);
    if (variant === "dark") assert.notEqual(icon, lightIcon);
    else assert.equal(icon, lightIcon);
  }
  await expect(title).toHaveValue("Warmup");
  await expect(notes).toHaveValue("Practice a slow riff.");
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  await button("Unmount editor").click();
  await expect(output("Effect cleanups")).toHaveText("4");
  await expect(page.getByRole("alert")).toHaveCount(0);
}

/** Runs the same browser checks against native development and production builds. */
async function checkBrowser() {
  const browser = await chromium.launch({ timeout: 20_000 });
  try {
    for (const development of [true, false]) {
      const server = development
        ? await startDevelopment(0)
        : await startProduction();
      let page;
      try {
        page = await browser.newPage({
          viewport: { width: 1600, height: 1100 },
        });
        page.setDefaultTimeout(15_000);
        const errors = [];
        page.on("pageerror", (v) => errors.push(v.message));
        page.on("console", (v) => {
          if (v.type() === "error") errors.push(v.text());
        });
        page.on("requestfailed", (v) =>
          errors.push(`${v.url()}: ${v.failure()?.errorText}`)
        );
        page.on("response", (v) => {
          if (v.status() >= 400) errors.push(`HTTP ${v.status()}: ${v.url()}`);
        });
        await page.route("**/*", (route) => {
          const request = route.request();
          if (
            !request.url().startsWith(`${server.origin}/`) ||
            request.resourceType() === "image"
          ) {
            errors.push(`Unexpected network dependency: ${request.url()}`);
            return route.abort();
          }
          return route.continue();
        });
        await page.goto(server.origin);
        await checkAngular(page);
        assert.deepEqual(
          errors,
          [],
          "No browser, Angular, or network errors are allowed"
        );
        console.log(
          `Angular integration passed: ${development ? "native development AOT" : "production build"}`
        );
      } finally {
        await page?.close();
        await server.close();
      }
    }
  } finally {
    await browser.close();
  }
}

try {
  if (process.argv.includes("--demo")) {
    const server = await startDevelopment(5175);
    try {
      console.log(`Angular demo: ${server.origin}`);
      console.log(
        "Press Ctrl+C to stop and remove the temporary consumer installation."
      );
      await new Promise((resolve) => {
        const stop = () => {
          process.off("SIGINT", stop);
          process.off("SIGTERM", stop);
          resolve();
        };
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
      });
    } finally {
      await server.close();
    }
  } else {
    await project.run(process.execPath, [ng, "build"], { env: environment });
    await checkBrowser();
  }
} finally {
  await project.dispose();
}
