import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { createServer, preview } from "vite";
import { createConsumerProject } from "../consumer-project.mjs";

const fixture = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../demo/react"
);
const project = await createConsumerProject(fixture, "react", {
  react: "19.3.1",
  "react-dom": "19.3.1",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
});

/** Checks that rendered HTML and notation icons decode without hosted assets. */
async function checkIcons(page) {
  return page.locator("#tabui-editor").evaluate(async (root) => {
    const html = [...root.querySelectorAll("img")];
    const svg = [...root.querySelectorAll("svg image")];
    if (html.length === 0 || svg.length === 0) {
      throw new Error("React consumer must display HTML and notation icons");
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
        throw new Error("React consumer icon is not bundled");
      }
      await new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(
          () => reject(new Error("React icon decode timed out")),
          5000
        );
        image.onload = () => {
          clearTimeout(timer);
          image.naturalWidth > 0
            ? resolve()
            : reject(new Error("Empty React icon"));
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error("React icon failed to decode"));
        };
        image.src = url;
      });
    }
    return urls[0];
  });
}

/** Exercises controlled inputs, validation, conditional fields, and keyed React lists. */
async function checkHostForm(page, root, initialSetups) {
  const form = page.getByRole("form", { name: "Practice session" });
  const title = form.getByRole("textbox", { name: "Session title" });
  const notes = form.getByRole("textbox", { name: "Practice notes" });
  const preview = form.getByRole("status", { name: "Session preview" });
  const saved = page.getByRole("list", { name: "Saved sessions" });
  const notation = await root.locator(".tu-root-svg").elementHandle();
  assert(notation !== null);

  await title.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("Enter a session title.");
  // Real keystrokes include TabUI shortcuts and digits. They belong to the form.
  await title.pressSequentially("Riff 24");
  await expect(title).toBeFocused();
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
  await form.getByRole("button", { name: "Save session", exact: true }).click();
  await expect(saved.getByRole("listitem")).toHaveCount(2);
  await saved
    .getByRole("button", { name: "Remove session Riff 24", exact: true })
    .click();
  await expect(saved.getByRole("listitem")).toHaveCount(1);
  await expect(saved).toContainText("Warmup");
  await expect(
    page.getByRole("status", { name: "Change events", exact: true })
  ).toHaveText("1");
  await expect(
    page.getByRole("status", { name: "Effect setups", exact: true })
  ).toHaveText(String(initialSetups));
  assert(
    await notation.evaluate((v) => v.isConnected),
    "Form rerenders must retain the notation DOM"
  );
  await notation.dispose();

  await root
    .getByRole("button", { name: "Select track: Track 1", exact: true })
    .click();
  await expect(preview).toHaveText("Warmup · Slow · Track 1");
  await expect(title).toHaveValue("Warmup");
  await expect(notes).toHaveValue("Practice a slow riff.");
  await expect(saved.getByRole("listitem")).toHaveCount(1);
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

/** Exercises React-owned state, public editor events, and cleanup through the UI. */
async function checkReact(page, development) {
  const output = (name) => page.getByRole("status", { name, exact: true });
  const root = page.locator("#tabui-editor");
  const initialSetups = development ? 2 : 1;
  await expect(output("Effect setups")).toHaveText(String(initialSetups));
  await expect(output("Effect cleanups")).toHaveText(String(initialSetups - 1));
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await expect(output("Active track")).toHaveText("Track 1");
  const background = await root.evaluate(
    (v) => getComputedStyle(v).backgroundColor
  );
  assert.notEqual(
    background,
    "rgba(0, 0, 0, 0)",
    "React consumer must load TabUI CSS"
  );
  const lightIcon = await checkIcons(page);
  await checkTheme(page, false);

  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await root
    .getByRole("button", { name: "Select track: Second track", exact: true })
    .click();
  await expect(output("Active track")).toHaveText("Second track");
  await expect(output("Change events")).toHaveText("1");
  await checkHostForm(page, root, initialSetups);
  await expect(output("Active track")).toHaveText("Track 1");
  await expect(output("Change events")).toHaveText("2");

  await page
    .getByRole("button", { name: "Resize editor", exact: true })
    .click();
  await expect(output("Layout width")).toHaveText("1100");
  await expect(output("Change events")).toHaveText("3");
  const detachedHost = await root.elementHandle();
  assert(detachedHost !== null);
  await page
    .getByRole("button", { name: "Unmount editor", exact: true })
    .click();
  await expect(root).toHaveCount(0);
  await expect(output("Active track")).toHaveText("Unmounted");
  await expect(output("Effect cleanups")).toHaveText(String(initialSetups));
  assert.equal(
    await detachedHost.evaluate((v) => v.childElementCount),
    0,
    "Effect cleanup must dispose the detached editor contents"
  );
  await detachedHost.dispose();
  await expect(page.locator("#host-sibling")).toHaveText(
    "React-owned content stays mounted."
  );

  await page.getByRole("button", { name: "Mount editor", exact: true }).click();
  const remountSetups = initialSetups * 2;
  await expect(output("Effect setups")).toHaveText(String(remountSetups));
  await expect(output("Effect cleanups")).toHaveText(String(remountSetups - 1));
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await root
    .getByRole("button", { name: "Select track: Second track", exact: true })
    .click();
  await expect(output("Active track")).toHaveText("Second track");
  await expect(output("Change events")).toHaveText("4");

  await page
    .getByRole("button", { name: "Use dark theme", exact: true })
    .click();
  await expect(output("Effect setups")).toHaveText(String(remountSetups + 1));
  await expect(output("Effect cleanups")).toHaveText(String(remountSetups));
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await checkTheme(page, true);
  assert.notEqual(
    await checkIcons(page),
    lightIcon,
    "React prop change must select dark icons"
  );
  await page
    .getByRole("button", { name: "Use light theme", exact: true })
    .click();
  await expect(output("Effect setups")).toHaveText(String(remountSetups + 2));
  await expect(output("Effect cleanups")).toHaveText(String(remountSetups + 1));
  await checkTheme(page, false);
  assert.equal(
    await checkIcons(page),
    lightIcon,
    "Switching back must restore light-theme icons"
  );
  await expect(
    page.getByRole("textbox", { name: "Session title" })
  ).toHaveValue("Warmup");
  await expect(
    page.getByRole("list", { name: "Saved sessions" }).getByRole("listitem")
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Unmount editor", exact: true })
    .click();
  await expect(output("Effect cleanups")).toHaveText(String(remountSetups + 2));
  await expect(page.getByRole("alert")).toHaveCount(0);
}

/** Tests both development Strict Mode effects and the production consumer build. */
async function checkBrowser() {
  const browser = await chromium.launch({ timeout: 20_000 });
  try {
    for (const development of [true, false]) {
      const server = development
        ? await createServer({
            root: project.directory,
            configFile: false,
            // Vite 6 treats port 0 as its default; allow a running raw demo.
            server: { host: "127.0.0.1", port: 0, strictPort: false },
          })
        : await preview({
            root: project.directory,
            configFile: false,
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
          const isExternal = !request.url().startsWith(`${origin}/`);
          const isImage = request.resourceType() === "image";
          if (isExternal || isImage) {
            errors.push(`Unexpected network dependency: ${request.url()}`);
            return route.abort();
          }
          return route.continue();
        });
        await page.goto(origin, { timeout: 15_000 });
        await checkReact(page, development);
        assert.deepEqual(
          errors,
          [],
          "React consumer must have no browser, React, or network errors"
        );
        console.log(
          `React integration passed: ${development ? "development Strict Mode" : "production build"}`
        );
      } finally {
        try {
          await page?.close();
        } finally {
          if (development) {
            await server.close();
          } else {
            await new Promise((resolve, reject) =>
              server.httpServer.close((v) => (v ? reject(v) : resolve()))
            );
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
}

/** Runs the same fixture as a manual demo until interrupted, then removes its install. */
async function runDemo() {
  const server = await createServer({
    root: project.directory,
    configFile: false,
    server: { host: "127.0.0.1", port: 5174, strictPort: true },
  });
  try {
    await server.listen();
    console.log("React demo (Strict Mode enabled): http://127.0.0.1:5174");
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
    // Ctrl+C also stops Vite's esbuild child. Do not let an unfinished transform
    // prevent the outer finally block from removing the consumer installation.
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
  await project.run(path.join(project.directory, "node_modules/.bin/tsc"), [
    "--noEmit",
  ]);
  if (process.argv.includes("--demo")) {
    await runDemo();
  } else {
    await project.run(path.join(project.directory, "node_modules/.bin/vite"), [
      "build",
    ]);
    await checkBrowser();
  }
} finally {
  await project.dispose();
}
