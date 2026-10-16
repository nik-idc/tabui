import {
  NoteValue,
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
} from "@atikincode/tabui";
import type {
  SelectionCursorSnapshot,
  SerializedScoreV1,
  TabUIConfig,
  TabUIEditorEvent,
  TabUIEditorStateSnapshot,
} from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";
import playIconUrl from "@atikincode/tabui/assets/img/ui/play.svg?url";

const root = document.querySelector<HTMLDivElement>("#tabui-editor");
if (root === null) {
  throw new Error("Missing consumer editor root");
}
const score = new Score();
score.addTrack(score.tracks[0].context.instrument, "Second track");
const serialized: SerializedScoreV1 = serializeScore(score);
const restored = deserializeScore(
  JSON.parse(JSON.stringify(serialized)) as unknown
);
const config: TabUIConfig = {
  assets: {
    variant:
      new URLSearchParams(location.search).get("variant") === "dark"
        ? "dark"
        : "light",
  },
  interaction: { mode: TabUIEditorMode.Edit },
  layout: { mode: TabUILayoutMode.SingleLine, width: 1200 },
  panels: {
    score: { placement: TabUIScorePanelPlacement.Top },
    side: { placement: TabUISidePanelPlacement.Left, collapsible: true },
  },
};

let editor: TabUIEditor;
let changeCount = 0;
let unsubscribe = () => {};

/** Mounts an editor and connects its public events to host-owned state. */
function mount(): void {
  if (root === null) {
    throw new Error("Missing consumer editor root");
  }
  editor = new TabUIEditor(root, restored, config);
  editor.init();
  changeCount = 0;
  document.body.dataset.changeCount = "0";
  const initial: TabUIEditorStateSnapshot = editor.getState();
  const cursor: SelectionCursorSnapshot | null = initial.selection.cursor;
  document.body.dataset.initialTrack = initial.activeTrack.name;
  document.body.dataset.activeTrack = initial.activeTrack.name;
  document.body.dataset.hasInitialCursor = String(cursor !== null);
  unsubscribe = editor.subscribe((event: TabUIEditorEvent) => {
    if (event.type === "error") {
      throw new Error(`Consumer received editor error: ${event.error.code}`);
    }
    changeCount++;
    document.body.dataset.changeCount = String(changeCount);
    document.body.dataset.activeTrack = event.state.activeTrack.name;
  });
}

document.querySelector("#resize")?.addEventListener("click", () => {
  const width = editor.getState().layout.width === 1200 ? 1100 : 1200;
  editor.refreshLayout(width);
  document.body.dataset.layoutWidth = String(editor.getState().layout.width);
});
document
  .querySelector("#unsubscribe")
  ?.addEventListener("click", () => unsubscribe());
document
  .querySelector("#dispose")
  ?.addEventListener("click", () => editor.dispose());
document.querySelector("#remount")?.addEventListener("click", mount);
document.body.dataset.playIconUrl = playIconUrl;
document.body.dataset.noteValue = NoteValue.C;
document.body.dataset.scoreVersion = String(SCORE_SERIALIZATION_VERSION);
document.body.dataset.scoreDuration = SerializedNoteDuration.Quarter;
document.body.dataset.serializedTrackCount = String(serialized.tracks.length);
document.body.dataset.restoredTrackCount = String(restored.tracks.length);
document.body.dataset.restoredTrack = restored.tracks[0].name;
mount();
