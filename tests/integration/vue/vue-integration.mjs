import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { createServer, preview } from "vite";
import { createConsumerProject } from "../consumer-project.mjs";

const fixture = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../demo/vue"
);
const project = await createConsumerProject(fixture, "vue", {
  vue: "3.5.44",
  "vue-tsc": "3.3.13",
  "@vitejs/plugin-vue": "5.2.4",
});
const configFile = path.join(project.directory, "vite.config.mjs");

/** Checks HTML and SVG notation icons by decoding their bundled data URLs. */
async function checkIcons(page) {
  return page.locator("#tabui-editor").evaluate(async (root) => {
    const html = [...root.querySelectorAll("img")];
    const svg = [...root.querySelectorAll("svg image")];
    if (html.length === 0 || svg.length === 0) {
      throw new Error("Vue consumer must display HTML and notation icons");
    }
    const urls = [
      ...html.map((v) => v.src),
      ...svg.map(
        (v) =>
          v.getAttribute("href") ??
          v.getAttributeNS("http://www.w3.org/1999/xlink", "href")
      ),
    ];
    for (const url of new Set(urls)) {
      if (url === null || !url.startsWith("data:image/svg+xml")) {
        throw new Error("Vue consumer icon is not bundled");
      }
      await new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(
          () => reject(new Error("Vue icon decode timed out")),
          5000
        );
        image.onload = () => {
          clearTimeout(timer);
          image.naturalWidth > 0
            ? resolve()
            : reject(new Error("Empty Vue icon"));
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Vue icon failed to decode"));
        };
        image.src = url;
      });
    }
    return urls[0];
  });
}

/** Checks visible UI and notation colours, independently of the icon URLs. */
async function checkTheme(page, dark) {
  const colors = await page.locator("#tabui-editor").evaluate((root) => {
    const text = root.querySelector(".tu-root-svg text");
    if (text === null) throw new Error("Missing notation text");
    return {
      background: getComputedStyle(root).backgroundColor,
      text: getComputedStyle(root).color,
      notation: getComputedStyle(text).fill,
    };
  });
  assert.deepEqual(
    colors,
    dark
      ? {
          background: "rgb(15, 23, 42)",
          text: "rgb(229, 238, 251)",
          notation: "rgb(229, 238, 251)",
        }
      : {
          background: "rgb(241, 245, 249)",
          text: "rgb(17, 24, 39)",
          notation: "rgb(17, 24, 39)",
        },
    "Theme must update editor backgrounds, controls, and notation together"
  );
}

/** Exercises Vue forms while retaining the same notation DOM and selection. */
async function checkHostForm(page, root) {
  const form = page.getByRole("form", { name: "Practice session" });
  const title = form.getByRole("textbox", { name: "Session title" });
  const notes = form.getByRole("textbox", { name: "Practice notes" });
  const preview = form.getByRole("status", { name: "Session preview" });
  const saved = page.getByRole("list", { name: "Saved sessions" });
  const notation = await root.locator(".tu-root-svg").elementHandle();
  assert(notation !== null);
  const selection = root.locator("#tu-selection");
  await expect(selection.locator("rect").first()).toBeVisible();
  const selected = await selection.innerHTML();
  const announcement = await root
    .locator(".tu-announcement-host")
    .textContent();
  const events = await page
    .getByRole("status", { name: "Change events", exact: true })
    .textContent();

  await title.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("Enter a session title.");
  await expect(title).toHaveAttribute("aria-invalid", "true");
  // Real keystrokes include TabUI shortcuts and digits. They belong to the form.
  await title.pressSequentially("Riff 24");
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "false");
  await notes.pressSequentially("Practice a slow riff.");
  await form
    .getByRole("combobox", { name: "Practice pace" })
    .selectOption("Slow");
  await expect(preview).toHaveText("Riff 24 · Slow · Second track");
  const includeNotes = form.getByRole("checkbox", {
    name: "Include practice notes",
  });
  await includeNotes.uncheck();
  await expect(notes).toHaveCount(0);
  await includeNotes.check();
  await expect(notes).toHaveValue("Practice a slow riff.");
  await title.press("Enter");
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  await expect(saved).toContainText("Riff 24");
  await expect(saved).toContainText("Practice a slow riff.");
  await title.fill("Warmup");
  await includeNotes.uncheck();
  await form.getByRole("button", { name: "Save session", exact: true }).click();
  await expect(saved.getByRole("listitem")).toHaveCount(2);
  await saved.getByRole("button", { name: "Remove session Riff 24" }).click();
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  await expect(saved).toContainText("Warmup");
  await expect(saved).not.toContainText("Practice a slow riff.");
  await expect(
    page.getByRole("status", { name: "Change events", exact: true })
  ).toHaveText(events);
  await expect(
    page.getByRole("status", { name: "Lifecycle setups", exact: true })
  ).toHaveText("1");
  assert(await notation.evaluate((v) => v.isConnected));
  assert.equal(
    await selection.innerHTML(),
    selected,
    "Host updates retain selection"
  );
  assert.equal(
    await root.locator(".tu-announcement-host").textContent(),
    announcement
  );
  await expect(root.locator('[id^="note-text-"]')).toHaveText("7");
  await notation.dispose();

  await root
    .getByRole("button", { name: "Select track: Track 1", exact: true })
    .click();
  await expect(preview).toHaveText("Warmup · Slow · Track 1");
  await expect(title).toHaveValue("Warmup");
  await includeNotes.check();
  await expect(notes).toHaveValue("Practice a slow riff.");
}

/** Exercises public editor APIs, lifecycle cleanup, themes, and score retention. */
async function checkVue(page) {
  const output = (name) => page.getByRole("status", { name, exact: true });
  const root = page.locator("#tabui-editor");
  await expect(output("Lifecycle setups")).toHaveText("1");
  await expect(output("Lifecycle cleanups")).toHaveText("0");
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await expect(output("Active track")).toHaveText("Track 1");
  await checkTheme(page, false);
  const lightIcon = await checkIcons(page);

  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await root
    .getByRole("button", { name: "Select track: Second track", exact: true })
    .click();
  await expect(output("Active track")).toHaveText("Second track");
  await expect(output("Change events")).toHaveText("1");
  await root.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("7");
  await expect(root.locator('[id^="note-text-"]')).toHaveText("7");
  await checkHostForm(page, root);

  const beforeResize = Number(await output("Change events").textContent());
  await page
    .getByRole("button", { name: "Resize editor", exact: true })
    .click();
  await expect(output("Layout width")).toHaveText("1100");
  await expect(output("Change events")).toHaveText(String(beforeResize + 1));
  const detachedHost = await root.elementHandle();
  assert(detachedHost !== null);
  await page
    .getByRole("button", { name: "Unmount editor", exact: true })
    .click();
  await expect(root).toHaveCount(0);
  await expect(output("Active track")).toHaveText("Unmounted");
  await expect(output("Lifecycle cleanups")).toHaveText("1");
  assert.equal(await detachedHost.evaluate((v) => v.childElementCount), 0);
  await detachedHost.dispose();
  await expect(page.locator("#host-sibling")).toHaveText(
    "Vue-owned content stays mounted."
  );

  await page.getByRole("button", { name: "Mount editor", exact: true }).click();
  await expect(output("Lifecycle setups")).toHaveText("2");
  await expect(output("Lifecycle cleanups")).toHaveText("1");
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  const beforeTrack = Number(await output("Change events").textContent());
  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await root
    .getByRole("button", { name: "Select track: Second track", exact: true })
    .click();
  await expect(output("Active track")).toHaveText("Second track");
  await expect(output("Change events")).toHaveText(String(beforeTrack + 1));
  await expect(root.locator('[id^="note-text-"]')).toHaveText("7");

  for (const [index, dark] of [true, false].entries()) {
    const previousHost = await root.elementHandle();
    assert(previousHost !== null);
    await page
      .getByRole("button", {
        name: dark ? "Use dark theme" : "Use light theme",
        exact: true,
      })
      .click();
    await expect(output("Lifecycle setups")).toHaveText(String(3 + index));
    await expect(output("Lifecycle cleanups")).toHaveText(String(2 + index));
    assert.equal(await previousHost.evaluate((v) => v.isConnected), false);
    assert.equal(await previousHost.evaluate((v) => v.childElementCount), 0);
    await previousHost.dispose();
    await expect(root.locator(".tu-root-svg")).toHaveCount(1);
    await checkTheme(page, dark);
    const icon = await checkIcons(page);
    if (dark) assert.notEqual(icon, lightIcon);
    else assert.equal(icon, lightIcon);
    await root.getByRole("button", { name: "Tracks", exact: true }).click();
    await root
      .getByRole("button", { name: "Select track: Second track", exact: true })
      .click();
    await expect(root.locator('[id^="note-text-"]')).toHaveText("7");
  }
  await expect(
    page.getByRole("textbox", { name: "Session title" })
  ).toHaveValue("Warmup");
  await expect(
    page.getByRole("list", { name: "Saved sessions" }).getByRole("listitem")
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Unmount editor", exact: true })
    .click();
  await expect(output("Lifecycle cleanups")).toHaveText("4");
  await expect(page.getByRole("alert")).toHaveCount(0);
}

/** Runs the SFC fixture against both the development server and production build. */
async function checkBrowser() {
  const browser = await chromium.launch({ timeout: 20_000 });
  try {
    for (const development of [true, false]) {
      const server = development
        ? await createServer({
            root: project.directory,
            configFile,
            // Vite 6 treats port 0 as its default; allow another concurrent fixture.
            server: { host: "127.0.0.1", port: 0, strictPort: false },
          })
        : await preview({
            root: project.directory,
            configFile,
            preview: { host: "127.0.0.1", port: 0, strictPort: true },
          });
      let page;
      try {
        if (development) await server.listen();
        const address = server.httpServer.address();
        assert(address !== null && typeof address !== "string");
        const origin = `http://127.0.0.1:${address.port}`;
        page = await browser.newPage({
          viewport: { width: 1600, height: 1100 },
        });
        page.setDefaultTimeout(10_000);
        const errors = [];
        page.on("pageerror", (v) => errors.push(v.message));
        page.on("console", (v) => {
          if (v.type() === "error" || v.type() === "warning")
            errors.push(v.text());
        });
        page.on("requestfailed", (v) =>
          errors.push(`${v.url()}: ${v.failure()?.errorText}`)
        );
        page.on("response", (v) => {
          if (v.status() >= 400) errors.push(`HTTP ${v.status()}: ${v.url()}`);
        });
        await page.route("**/*", (route) => {
          const request = route.request();
          const isExternal = !request.url().startsWith(`${origin}/`);
          const isImage = request.resourceType() === "image";
          if (isExternal || isImage) {
            errors.push(`Unexpected network dependency: ${request.url()}`);
            return route.abort();
          }
          return route.continue();
        });
        await page.goto(origin, { timeout: 15_000 });
        await checkVue(page);
        assert.deepEqual(
          errors,
          [],
          "Vue consumer must have no browser, framework, or network errors"
        );
        console.log(
          `Vue integration passed: ${development ? "development SFCs" : "production build"}`
        );
      } finally {
        try {
          await page?.close();
        } finally {
          if (development) await server.close();
          else
            await new Promise((resolve, reject) =>
              server.httpServer.close((v) => (v ? reject(v) : resolve()))
            );
        }
      }
    }
  } finally {
    await browser.close();
  }
}

/** Serves the same Vue fixture until interrupted, then removes its temporary install. */
async function runDemo() {
  const server = await createServer({
    root: project.directory,
    configFile,
    // Keep dependency scanning from outliving a Ctrl+C during initial page load.
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { host: "127.0.0.1", port: 5176, strictPort: true },
  });
  try {
    await server.listen();
    console.log("Vue demo: http://127.0.0.1:5176");
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
    // Ctrl+C also stops esbuild. Bound shutdown so temporary files still get removed.
    let timer;
    try {
      await Promise.race([
        server.close(),
        new Promise((resolve) => {
          timer = setTimeout(resolve, 5000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}

try {
  await project.run(path.join(project.directory, "node_modules/.bin/vue-tsc"), [
    "--noEmit",
  ]);
  await project.run(path.join(project.directory, "node_modules/.bin/vite"), [
    "build",
  ]);
  if (process.argv.includes("--demo")) await runDemo();
  else await checkBrowser();
} finally {
  await project.dispose();
}
