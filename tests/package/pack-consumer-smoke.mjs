import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const workspace = await mkdtemp(path.join(tmpdir(), "tabui-pack-smoke-"));

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
      `Command failed: ${command} ${args.join(" ")}${stdout}${stderr}`
    );
  }
}

try {
  const { stdout } = await execFileAsync("npm", ["pack", "--json"], {
    cwd: rootDir,
    maxBuffer: 1024 * 1024 * 10,
  });
  const [packInfo] = JSON.parse(stdout);
  const tarballPath = path.join(rootDir, packInfo.filename);

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
    '<div id="tabui-editor"></div><script type="module" src="/src/main.ts"></script>\n'
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
const serializedScore: SerializedScoreV1 = serializeScore(score);
const restoredScore = deserializeScore(
  JSON.parse(JSON.stringify(serializedScore)) as unknown
);
const config: TabUIConfig = {
  assets: { baseUrl: "/tabui-assets" },
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

const editor = new TabUIEditor(rootDiv, score, config);
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
window.addEventListener("beforeunload", unsubscribe, { once: true });

document.body.dataset.playIconUrl = playIconUrl;
document.body.dataset.noteValue = NoteValue.C;
document.body.dataset.initialTrack = initialState.activeTrack.name;
document.body.dataset.hasInitialCursor = String(initialCursor !== null);
document.body.dataset.scoreVersion = String(SCORE_SERIALIZATION_VERSION);
document.body.dataset.scoreDuration = SerializedNoteDuration.Quarter;
document.body.dataset.restoredTrack = restoredScore.tracks[0].name;
`
  );

  await run("npm", ["install", "--ignore-scripts"]);

  const packageRoot = path.join(workspace, "node_modules/@atikincode/tabui");
  await stat(path.join(packageRoot, "dist/index.mjs"));
  await stat(path.join(packageRoot, "dist/index.d.ts"));
  await stat(path.join(packageRoot, "dist/styles.css"));
  await stat(path.join(packageRoot, "assets/img/ui/play.svg"));

  const packageJson = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.exports["./styles.css"] !== "./dist/styles.css") {
    throw new Error("Package styles export does not point at dist/styles.css");
  }

  await run(path.join(rootDir, "node_modules/.bin/tsc"), ["--noEmit"]);
  await run(path.join(rootDir, "node_modules/.bin/vite"), ["build"]);

  await rm(tarballPath, { force: true });
  console.log(`Pack consumer smoke passed in ${workspace}`);
} finally {
  await rm(workspace, { force: true, recursive: true });
}
