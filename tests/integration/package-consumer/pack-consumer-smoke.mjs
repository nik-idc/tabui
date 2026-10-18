import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const workspace = await mkdtemp(path.join(tmpdir(), "tabui-pack-smoke-"));

async function cleanup(steps, failures) {
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) {
    throw failures[0];
  }
  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      "Packed consumer check or cleanup failed"
    );
  }
}

async function run(command, args, options = {}) {
  try {
    return await execFileAsync(command, args, {
      cwd: workspace,
      maxBuffer: 1024 * 1024 * 10,
      ...options,
    });
  } catch (error) {
    const stdout = error.stdout ? `\nstdout:\n${error.stdout}` : "";
    const stderr = error.stderr ? `\nstderr:\n${error.stderr}` : "";
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}${stdout}${stderr}`,
      { cause: error }
    );
  }
}

async function checkPackedEditor() {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const filename = pathname === "/" ? "index.html" : pathname.slice(1);
    try {
      const contents = await readFile(path.join(workspace, "dist", filename));
      const contentTypes = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
      };
      response.setHeader(
        "Content-Type",
        contentTypes[path.extname(filename)] ?? "application/octet-stream"
      );
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  let browser;
  const failures = [];
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert(address !== null && typeof address !== "string");
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
    });
    page.setDefaultTimeout(30_000);
    const imageRequests = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.resourceType() === "image") {
        imageRequests.push(request.url());
      }
    });

    const firstIcons = [];
    for (const variant of ["light", "dark"]) {
      imageRequests.length = 0;
      await page.goto(`http://127.0.0.1:${address.port}/?variant=${variant}`);
      await page.waitForFunction(() => document.body.dataset.initialTrack);
      const state = await page.evaluate(() => ({ ...document.body.dataset }));
      assert.equal(state.initialTrack, "Packed consumer track");
      assert.equal(state.restoredTrack, "Packed consumer track");
      assert.equal(state.hasInitialCursor, "true");
      assert.equal(state.scoreVersion, "1");
      assert.equal(state.scoreDuration, "quarter");
      assert.equal(state.noteValue, "C");
      assert.equal(
        await page
          .locator("#tabui-editor")
          .evaluate((root) => getComputedStyle(root).display),
        "grid",
        "Exported stylesheet must style the mounted editor"
      );
      const exportedIconUrl = await page
        .locator("#exported-icon")
        .evaluate(async (image) => {
          await image.decode();
          if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
            throw new Error("Exported SVG must have image dimensions");
          }
          return image.src;
        });
      assert.equal(
        new URL(exportedIconUrl).origin,
        `http://127.0.0.1:${address.port}`
      );
      await page
        .getByRole("button", { name: "New track", exact: true })
        .click();
      const result = await page
        .locator("#tabui-editor")
        .evaluate(async (root) => {
          const urls = [
            ...Array.from(root.querySelectorAll("img"), (v) => v.src),
            ...Array.from(
              root.querySelectorAll("svg image"),
              (v) =>
                v.getAttribute("href") ??
                v.getAttributeNS("http://www.w3.org/1999/xlink", "href")
            ),
          ];
          const htmlIcons = root.querySelectorAll("img").length;
          const svgIcons = root.querySelectorAll("svg image").length;
          for (const url of new Set(urls)) {
            if (url === null || !url.startsWith("data:image/svg+xml")) {
              throw new Error(`Expected bundled SVG data URL, got ${url}`);
            }
            await new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () =>
                image.naturalWidth > 0
                  ? resolve()
                  : reject(new Error("Bundled icon has no image dimensions"));
              image.onerror = () =>
                reject(new Error("Bundled icon failed to load"));
              image.src = url;
            });
          }
          return { htmlIcons, svgIcons, firstIcon: urls[0] };
        });
      assert(result.htmlIcons > 0, "Packed editor must display HTML icons");
      assert(
        result.svgIcons > 0,
        "Packed editor must display notation SVG icons"
      );
      firstIcons.push(result.firstIcon);
      await page
        .getByRole("textbox", { name: "Track name", exact: true })
        .fill("Added by consumer");
      await page.getByRole("button", { name: "Confirm", exact: true }).click();
      await page.waitForFunction(
        () => document.body.dataset.activeTrack === "Added by consumer"
      );
      assert.equal(
        await page.locator("body").getAttribute("data-editor-error"),
        null
      );
      await page
        .getByRole("button", { name: "Dispose packed editor", exact: true })
        .click();
      assert.equal(
        await page
          .locator("#tabui-editor")
          .evaluate((root) => root.childElementCount),
        0
      );
      assert.deepEqual(
        imageRequests,
        [exportedIconUrl],
        "Only the explicitly imported SVG may make an HTTP image request"
      );
    }
    assert.notEqual(
      firstIcons[0],
      firstIcons[1],
      "Icon variant must change the bundled image"
    );
    assert.deepEqual(
      errors,
      [],
      "Packed editor must initialize without browser errors"
    );
  } catch (error) {
    failures.push(error);
  } finally {
    await cleanup(
      [
        () => browser?.close(),
        () =>
          server.listening &&
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
          ),
      ],
      failures
    );
  }
}

const failures = [];
try {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", workspace],
    {
      cwd: rootDir,
      env: { ...process.env, HUSKY: "0" },
      maxBuffer: 1024 * 1024 * 10,
    }
  );
  const jsonStart = stdout.indexOf("[");
  if (jsonStart === -1) {
    throw new Error(`npm pack did not return JSON:\n${stdout}`);
  }
  const [packInfo] = JSON.parse(stdout.slice(jsonStart));
  const tarballPath = path.join(workspace, packInfo.filename);

  await writeFile(
    path.join(workspace, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        scripts: {
          build: "vite build",
          typecheck: "tsc --noEmit",
        },
        dependencies: {
          "@atikincode/tabui": tarballPath,
        },
        devDependencies: {},
      },
      null,
      2
    )
  );
  await writeFile(
    path.join(workspace, "index.html"),
    '<div id="tabui-editor"></div><img id="exported-icon" alt="Exported play icon"><button id="dispose">Dispose packed editor</button><script type="module" src="/src/main.ts"></script>\n'
  );
  await writeFile(
    path.join(workspace, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          skipLibCheck: false,
        },
        include: ["src"],
      },
      null,
      2
    )
  );
  await mkdir(path.join(workspace, "src"));
  await writeFile(
    path.join(workspace, "src/vite-env.d.ts"),
    'declare module "*.css";\ndeclare module "*.svg?url" { const url: string; export default url; }\n'
  );
  await writeFile(
    path.join(workspace, "src/main.ts"),
    `import {
  NoteValue,
  PlaybackErrorCode,
  SCORE_SERIALIZATION_VERSION,
  Score,
  SerializedNoteDuration,
  TabUIEditor,
  TabUIEditorMode,
  TabUILayoutMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
  deserializeScore,
  serializeScore,
  type SelectionCursorSnapshot,
  type SerializedScoreV1,
  type TabUIConfig,
  type TabUIEditorEvent,
  type TabUIEditorStateSnapshot,
} from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";
import playIconUrl from "@atikincode/tabui/assets/img/ui/play.svg?url";

const rootDiv = document.getElementById("tabui-editor") as HTMLDivElement;
const score = new Score();
score.tracks[0].name = "Packed consumer track";
const serializedScore: SerializedScoreV1 = serializeScore(score);
const restoredScore = deserializeScore(
  JSON.parse(JSON.stringify(serializedScore)) as unknown
);
const config: TabUIConfig = {
  assets: {
    variant: new URLSearchParams(window.location.search).get("variant") === "dark"
      ? "dark"
      : "light",
  },
  interaction: { mode: TabUIEditorMode.Edit },
  layout: { mode: TabUILayoutMode.SingleLine },
  panels: {
    score: { placement: TabUIScorePanelPlacement.Top },
    side: {
      placement: TabUISidePanelPlacement.Left,
      collapsible: true,
    },
  },
  playback: {},
};

const editor = new TabUIEditor(rootDiv, restoredScore, config);
editor.init();
const initialState: TabUIEditorStateSnapshot = editor.getState();
const initialCursor: SelectionCursorSnapshot | null =
  initialState.selection.cursor;
const unsubscribe = editor.subscribe((event: TabUIEditorEvent) => {
  if (event.type === "change") {
    document.body.dataset.activeTrack = event.state.activeTrack.name;
  } else {
    document.body.dataset.editorError = event.error.code;
    document.body.dataset.contextError = String(
      event.error.code === PlaybackErrorCode.ContextStart
    );
  }
});
editor.refreshLayout(1200);
document.getElementById("dispose")!.addEventListener("click", () => {
  unsubscribe();
  editor.dispose();
});

(document.getElementById("exported-icon") as HTMLImageElement).src = playIconUrl;
document.body.dataset.noteValue = NoteValue.C;
document.body.dataset.initialTrack = initialState.activeTrack.name;
document.body.dataset.hasInitialCursor = String(initialCursor !== null);
document.body.dataset.scoreVersion = String(SCORE_SERIALIZATION_VERSION);
document.body.dataset.scoreDuration = SerializedNoteDuration.Quarter;
document.body.dataset.restoredTrack = restoredScore.tracks[0].name;
`
  );

  await run("npm", ["install", "--ignore-scripts"]);

  await run(path.join(rootDir, "node_modules/.bin/tsc"), ["--noEmit"]);
  await run(path.join(rootDir, "node_modules/.bin/vite"), [
    "build",
    "--assetsInlineLimit",
    "0",
  ]);
  await checkPackedEditor();
} catch (error) {
  failures.push(error);
} finally {
  await cleanup(
    [() => rm(workspace, { force: true, recursive: true })],
    failures
  );
}
console.log("Pack consumer smoke passed");
