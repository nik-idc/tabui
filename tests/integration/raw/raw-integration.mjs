import assert from "node:assert/strict";
import { cp, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { preview } from "vite";
import { createConsumerProject } from "../consumer-project.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const project = await createConsumerProject(
  path.join(directory, "fixture"),
  "raw"
);
const consumer = project.directory;
const rootDir = path.resolve(directory, "../../..");

/** Checks the unchanged public showcase against the installed package at a Pages-like base. */
async function checkShowcase(page, origin) {
  await page.goto(`${origin}/tabui/showcase/`, { timeout: 15_000 });
  const root = page.locator("#tabui-editor");
  await expect(
    page.getByRole("heading", { name: "TabUI Demo", exact: true })
  ).toBeVisible();
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await expect(page.locator("#fixture-select")).toHaveValue("feature_showcase");
  await expect(page.locator("#theme-select")).toHaveValue("obsidian");
  await expect(root).toHaveCSS("background-color", "rgb(26, 26, 26)");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(26, 26, 26)"
  );
  const darkIcon = await root.locator("img").first().getAttribute("src");
  await page.locator("#theme-select").selectOption("paper");
  await expect(root).toHaveCSS("background-color", "rgb(244, 239, 230)");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 239, 230)"
  );
  assert.notEqual(
    await root.locator("img").first().getAttribute("src"),
    darkIcon
  );

  const downloadEvent = page.waitForEvent("download");
  await page.locator("#serialize-score").click();
  const download = await downloadEvent;
  assert.equal(
    download.suggestedFilename(),
    "feature-showcase-score.tabui.json"
  );
  const filename = await download.path();
  assert(filename !== null);
  const contents = await readFile(filename, "utf8");
  const document = JSON.parse(contents);
  assert.equal(document.name, "Feature Showcase Score");
  assert(
    document.tracks.length > 1,
    "Showcase must retain its multiple tracks"
  );

  await page.locator("#fixture-select").selectOption("empty");
  await expect(page.locator("#fixture-select")).toHaveValue("empty");
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await page.locator("#score-file").setInputFiles({
    name: "showcase.tabui.json",
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
  await expect(page.locator("#score-persistence-status")).toHaveText(
    "Mounted score from showcase.tabui.json."
  );
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await page.locator("#layout-mode-select").selectOption("single-line");
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await expect(page).toHaveURL(/layoutMode=single-line/);
  await page.locator("#reset-demo-settings").click();
  await expect(page.locator("#fixture-select")).toHaveValue("feature_showcase");
  await expect(page.locator("#theme-select")).toHaveValue("obsidian");

  // Samples remain demo-owned files, outside the npm package. Check all six real
  // WAVs at the same base URL used by the unchanged playback configuration.
  const samples = [
    "Alesis-Fusion-Clean-Guitar-C3.wav",
    "Roland-SC-88-Overdriven-Guitar-C3.wav",
    "Roland-SC-88-Distorted-Guitar-C3.wav",
    "Alesis-S4-Plus-FatSynSlap-C2.wav",
    "Alesis-Fusion-Nylon-String-Guitar-C4.wav",
    "Alesis-Fusion-Steel-String-Guitar-C4.wav",
  ];
  for (const sample of samples) {
    const response = await page.request.get(
      `${origin}/tabui/showcase/samples/${sample}`
    );
    assert.equal(response.status(), 200);
    const bytes = await response.body();
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
  }
  console.log(
    "  showcase: themes, fixture selection, save/load, layout, reset, sample files passed"
  );
}

/** Decodes the real default icons and the icon imported through the asset export. */
async function checkIcons(page) {
  const result = await page.locator("#tabui-editor").evaluate(async (root) => {
    const htmlIcons = [...root.querySelectorAll("img")];
    const svgIcons = [...root.querySelectorAll("svg image")];
    const urls = [
      ...htmlIcons.map((v) => v.src),
      ...svgIcons.map(
        (v) =>
          v.getAttribute("href") ??
          v.getAttributeNS("http://www.w3.org/1999/xlink", "href")
      ),
    ];
    if (urls.some((v) => v === null || !v.startsWith("data:image/svg+xml"))) {
      throw new Error("Default editor icons must use bundled SVG data URLs");
    }
    const exportedIcon = document.body.dataset.playIconUrl;
    if (!exportedIcon) {
      throw new Error("Missing public asset import");
    }
    for (const url of new Set([...urls, exportedIcon])) {
      await new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(
          () => reject(new Error("Icon decode timed out")),
          5000
        );
        image.onload = () => {
          clearTimeout(timer);
          if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            resolve();
          } else {
            reject(new Error("Icon has no image dimensions"));
          }
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error(`Icon failed to load: ${url.slice(0, 100)}`));
        };
        image.src = url;
      });
    }
    return {
      htmlIcons: htmlIcons.length,
      svgIcons: svgIcons.length,
      firstIcon: urls[0],
      exportedIcon: new URL(exportedIcon, location.href).href,
      loadedHtmlIcons: htmlIcons.every((v) => v.complete && v.naturalWidth > 0),
    };
  });
  assert(result.htmlIcons > 0, "Consumer must display HTML icons");
  assert(result.svgIcons > 0, "Consumer must display notation SVG icons");
  assert(result.loadedHtmlIcons, "Rendered HTML icons must load successfully");
  return result;
}

/** Checks the public consumer boundary in the built app, without framework adapters. */
async function checkConsumer(page, variant) {
  const root = page.locator("#tabui-editor");
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await expect(
    root.getByRole("button", { name: "New track", exact: true })
  ).toBeVisible();
  const values = await page.locator("body").evaluate((v) => ({ ...v.dataset }));
  assert.equal(values.initialTrack, "Track 1");
  assert.equal(values.noteValue, "C");
  assert.equal(values.scoreVersion, "1");
  assert.equal(values.scoreDuration, "quarter");
  assert.equal(values.serializedTrackCount, "2");
  assert.equal(values.restoredTrackCount, "2");
  assert.equal(values.restoredTrack, "Track 1");
  assert.equal(values.hasInitialCursor, "true");

  const background = await root.evaluate(
    (v) => getComputedStyle(v).backgroundColor
  );
  assert.notEqual(
    background,
    "rgba(0, 0, 0, 0)",
    "Imported CSS must style the editor"
  );
  const icons = await checkIcons(page);

  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  const tracks = root.locator(".tu-track-select-button");
  await expect(tracks).toHaveCount(2);
  await tracks.nth(1).click();
  await expect(tracks.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveAttribute(
    "data-active-track",
    "Second track"
  );

  const beforeResize = Number(
    await page.locator("body").getAttribute("data-change-count")
  );
  await page
    .getByRole("button", { name: "Resize editor", exact: true })
    .click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-layout-width",
    "1100"
  );
  const afterResize = Number(
    await page.locator("body").getAttribute("data-change-count")
  );
  assert(
    afterResize > beforeResize,
    "Host API call must publish a layout change"
  );

  await page
    .getByRole("button", { name: "Stop observing", exact: true })
    .click();
  await tracks.nth(0).click();
  await expect(tracks.nth(0)).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Resize editor", exact: true })
    .click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-layout-width",
    "1200"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-change-count",
    String(afterResize)
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-active-track",
    "Second track"
  );

  await page
    .getByRole("button", { name: "Dispose editor", exact: true })
    .click();
  await expect(root).toBeEmpty();
  await expect(page.locator("#host-sibling")).toHaveText("Host content");
  await page
    .getByRole("button", { name: "Remount editor", exact: true })
    .click();
  await expect(root.locator(".tu-root-svg")).toHaveCount(1);
  await expect(root.locator(".tu-root-svg")).toBeVisible();
  await root.getByRole("button", { name: "Tracks", exact: true }).click();
  await tracks.nth(1).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-active-track",
    "Second track"
  );
  await expect(page.locator("body")).toHaveAttribute("data-change-count", "1");
  await page
    .getByRole("button", { name: "Dispose editor", exact: true })
    .click();
  await expect(root).toBeEmpty();
  console.log(
    `  ${variant}: rendering, assets, events, host API, unsubscribe, remount passed`
  );
  return icons;
}

/** Serves only built consumer files and closes browser and server on every exit path. */
async function checkBrowser() {
  const server = await preview({
    root: consumer,
    configFile: false,
    base: "/tabui/",
    preview: { host: "127.0.0.1", port: 0, strictPort: true },
  });
  let browser;
  try {
    const address = server.httpServer.address();
    assert(address !== null && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ timeout: 20_000 });
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
    });
    page.setDefaultTimeout(10_000);
    const errors = [];
    const imageRequests = [];
    page.on("pageerror", (v) => errors.push(v.message));
    page.on("requestfailed", (v) =>
      errors.push(`${v.url()}: ${v.failure()?.errorText}`)
    );
    page.on("response", (v) => {
      if (v.status() >= 400) errors.push(`HTTP ${v.status()}: ${v.url()}`);
    });
    await page.route("**/*", (route) => {
      const request = route.request();
      // The showcase retains its existing Google Fonts links. Keep this check
      // deterministic offline without changing the deployed demo's font setup.
      if (new URL(request.url()).hostname === "fonts.googleapis.com") {
        return route.fulfill({ contentType: "text/css", body: "" });
      }
      if (!request.url().startsWith(`${origin}/`)) {
        errors.push(`Unexpected external request: ${request.url()}`);
        return route.abort();
      }
      if (request.resourceType() === "image") imageRequests.push(request.url());
      return route.continue();
    });
    const variants = [];
    for (const variant of ["light", "dark"]) {
      await page.goto(`${origin}/tabui/?variant=${variant}`, {
        timeout: 15_000,
      });
      variants.push(await checkConsumer(page, variant));
    }
    assert.notEqual(
      variants[0].firstIcon,
      variants[1].firstIcon,
      "Light and dark icons must differ"
    );
    const exportedIcons = new Set(variants.map((v) => v.exportedIcon));
    assert.deepEqual(
      imageRequests.filter((v) => !exportedIcons.has(v)),
      [],
      "Default icons must not make HTTP requests"
    );
    await checkShowcase(page, origin);
    assert.deepEqual(
      imageRequests.filter((v) => !exportedIcons.has(v)),
      [],
      "Showcase default icons must also remain bundled"
    );
    assert.deepEqual(
      errors,
      [],
      "Consumer must have no browser or network errors"
    );
  } finally {
    try {
      await browser?.close();
    } finally {
      await new Promise((resolve, reject) =>
        server.httpServer.close((v) => (v ? reject(v) : resolve()))
      );
    }
  }
}

try {
  const showcase = path.join(consumer, "demo/raw");
  await cp(path.join(rootDir, "demo/raw"), showcase, { recursive: true });
  // Preserve shared fixture imports without copying library source into the consumer.
  await cp(path.join(rootDir, "fixtures"), path.join(consumer, "fixtures"), {
    recursive: true,
  });
  await cp(
    path.join(rootDir, "assets/samples"),
    path.join(showcase, "public/samples"),
    { recursive: true }
  );
  await project.run(path.join(consumer, "node_modules/.bin/tsc"), ["--noEmit"]);
  await project.run(path.join(consumer, "node_modules/.bin/tsc"), [
    "--project",
    "demo/raw/tsconfig.json",
    "--noEmit",
  ]);
  await project.run(path.join(consumer, "node_modules/.bin/vite"), [
    "build",
    "--base",
    "/tabui/",
  ]);
  await project.run(path.join(consumer, "node_modules/.bin/vite"), [
    "build",
    "demo/raw",
    "--base",
    "/tabui/showcase/",
    "--outDir",
    "../../dist/showcase",
    "--emptyOutDir",
  ]);
  await checkBrowser();
  console.log(
    "Raw integration passed (installed npm tarball, consumer type-check and production build)"
  );
} finally {
  await project.dispose();
}
