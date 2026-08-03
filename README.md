# TabUI

TabUI is a music notation and tablature editor library focused primarily on
guitar-oriented workflows.

## Demo

[GitHub Pages Demo](https://nik-idc.github.io/tabui/)

## Features

- **Interactive Editor:** Graphical editing workflow for tablature-based scores.
- **Note Effects:** Support for techniques such as vibrato, palm mute,
  harmonics, hammer-on/pull-off, slides, and bends.
- **Playback:** Live playback of the current score state.
- **Multi-track Scores:** Multiple tracks can exist within the same score.
- **Measure Controls:** Per-measure tempo and time signature editing.

## Status

TabUI is still pre-`1.0.0` and under active development.

## Package Usage

```ts
import { PlaybackErrorCode, Score, TabUIEditor } from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";

const root = document.getElementById("tabui-editor") as HTMLDivElement;
const editor = new TabUIEditor(root, new Score(), {
  assets: { baseUrl: "/tabui-assets" },
  layout: {
    width: 1200,
    noteTextSize: 12,
    timeSigTextSize: 48,
    tempoTextSize: 24,
    durationsHeight: 30,
  },
});

editor.init();

const unsubscribe = editor.subscribe((event) => {
  if (event.type === "change") {
    console.log(event.state.activeTrack, event.state.playback);
  } else {
    if (event.error.code === PlaybackErrorCode.ContextStart) {
      console.error("Browser audio could not start", event.error.cause);
    }
  }
});

// Re-measure the notation host after an explicit container layout change.
editor.refreshLayout();

// Stop playback, release listeners, and clear editor-owned root contents.
window.addEventListener(
  "beforeunload",
  () => {
    unsubscribe();
    editor.dispose();
  },
  { once: true }
);
```

The root export is the supported framework-agnostic API. Styles are available
from `@atikincode/tabui/styles.css`. Runtime icons are packaged under
`@atikincode/tabui/assets/*`; serve those files from your app and pass the public
base URL through `assets.baseUrl`. Playback samples are host-provided through the
`playback` config and fall back to oscillator playback when omitted.

Pass a dedicated empty root element to `TabUIEditor`. The host owns the root;
TabUI owns its contents while mounted. `init()` is synchronous and may be called
once. `dispose()` is idempotent, but a disposed editor is terminal. To replace a
score, dispose the editor and construct a new instance.

`getState()` returns a `TabUIEditorStateSnapshot` containing the current active
track, playback flags, model-level selection, and rendered layout size. Its
identity remains stable until a `"change"` notification, so it can be used with
external-store adapters.
`subscribe()` is editor-instance scoped and returns an idempotent unsubscribe
function. Asynchronous playback failures arrive as `"error"` events with a
`PlaybackErrorCode`, message, and original cause. `refreshLayout(width?)` is the
explicit host hook for container changes; automatic responsive observation is
not yet provided.

## Score Persistence

Use the versioned score serialization API rather than the legacy model-level
`toJSON()` methods:

```ts
import {
  ScoreSerializationError,
  deserializeScore,
  serializeScore,
} from "@atikincode/tabui";

const document = serializeScore(score);
localStorage.setItem("score", JSON.stringify(document));

const stored = localStorage.getItem("score");
if (stored !== null) {
  try {
    const restoredScore = deserializeScore(JSON.parse(stored));
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      console.error(error.path, error.message);
    }
  }
}
```

The current `tabui-score` V1 document covers guitar/tablature score metadata,
master bars, track mix and instruments, staves, sparse voices, rests, tuplets,
notes, techniques, and bends. Runtime UUIDs and derived timing/beaming state are
regenerated. Deserialization validates all persisted values it consumes and
reports an exact property path through `ScoreSerializationError`. Empty non-null
voice bars are rejected until rendering semantics for them are defined. The
`format` field identifies a JSON object as a TabUI score before its version is
dispatched.
Error paths use a JSONPath-like rooted form such as
`$.tracks[0].staves[0].bars`.

The refactor and optimization work from `tu-69-refactor-and-optimization` has
been merged into `master` and now serves as the current development baseline.

Any and all compatibility is allowed to break before version `1.0.0`. Version
`0.5.0` is a viable checkpoint where a demo-able MVP is possible via
integration of TabUI into a web client, with the planned React.js client as the
first target integration.

## Current Focus

- Fix required notation/layout correctness, then implement persistence,
  embedding, responsive behavior, and release-candidate validation.
- Keep `0.5.0` focused on a dependable tablature editor. Sheet and drum notation
  are explicitly deferred.

## Roadmap

See `ROADMAP-TO-v0.5.0.md` for the project roadmap and
`PHASE-6-ROADMAP.md` for the current stabilization status and next task.
