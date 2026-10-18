# Using TabUI

TabUI is a guitar tablature editing engine.

For installation and a minimal example, see the [README](../README.md).

## Demo

[GitHub Pages Demo](https://nik-idc.github.io/tabui/)

## Package Usage

```ts
import {
  Score,
  TabUIEditor,
  TabUIEditorMode,
  TabUILayoutMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";

const root = document.getElementById("tabui-editor");
if (!(root instanceof HTMLDivElement)) {
  throw new Error("Missing editor root");
}

const editor = new TabUIEditor(root, new Score(), {
  panels: {
    score: { placement: TabUIScorePanelPlacement.Top },
    side: {
      placement: TabUISidePanelPlacement.Left,
      collapsible: true,
    },
  },
  layout: {
    mode: TabUILayoutMode.SingleLine,
    viewOnlyModeWidthThreshold: 500,
    unrestrictedModeWidthThreshold: 1000,
  },
});

editor.init();

const unsubscribe = editor.subscribe((event) => {
  if (event.type === "change") {
    console.log(event.state.activeTrack, event.state.playback);
  } else if (event.type === "error") {
    console.error(event.error.code, event.error.message);
  }
});

// Optional after a host-controlled layout change.
editor.refreshLayout();

unsubscribe();
editor.dispose();
```

The package is framework-agnostic. Import its styles from
`@atikincode/tabui/styles.css`. Default SVG icons are bundled as data URLs, so no
public asset folder or external hosting is needed. Use `assets.variant: "dark"`
for the dark icons; the default is `"light"`.

To use externally hosted or custom icons, set `assets.baseUrl` to their public
folder URL (for example, `/tabui-assets`). That folder must contain the matching
`img` and `img-dark` subfolders. An omitted or empty base URL uses bundled icons.
The original SVG files are still exported under `@atikincode/tabui/assets/*`
for optional self-hosting or direct imports. Apps with a Content Security Policy
must allow `data:` in `img-src` to display bundled icons, or use a permitted
external icon base URL instead.

The package does not include audio samples. Playback uses synthesized tones by
default; provide sample URLs through `playback.samples` for sample-based audio.

Set `playback.preloadAudio` to `true` to prepare configured `playback.samples` in the
background during initialization. It does not block `init()` or resume audio;
the first Play action still satisfies browser user-gesture requirements.

Pass a dedicated empty root to `TabUIEditor`. The host owns that root and TabUI
owns its contents while mounted. `init()` is synchronous and may be called once.
`dispose()` is idempotent and terminal. Replace a score by disposing the editor
and creating a new one.

`getState()` exposes the active track, playback state, selection, and rendered
layout size. Its identity is stable between change events. `subscribe()` is
editor-instance scoped and returns an idempotent unsubscribe function. Playback
failures arrive as structured `"error"` events.

Import supported classes, functions, and types from `@atikincode/tabui`.

## Interaction And Responsive Behavior

`interaction.mode` accepts `TabUIEditorMode.Edit` (the default) or
`TabUIEditorMode.ViewOnly`. View-only mode permits playback, seeking, scrolling,
copying, and active-track selection. It removes editing controls and prevents
score mutations at the controller boundary.

Notation selection uses Pointer Events for mouse, touch, and pen input. Desktop
drag selection remains a single-pointer interaction. Full phone editing and
two-handle touch selection are not currently supported.

### Editing with no selection

The shortcuts for rests and adding or removing beats and bars need a selected
note slot or beat range.

When you paste copied beats over a selected range, the editor can clear the
selection. If you then press Shift+X, A, Shift+A, Delete, I, Shift+I, or
Shift+Delete, the shortcut can cause an error instead of being ignored.

This is a known limitation. Click a note slot to select it before editing again.

### Responsive layout

Editors without `layout.width` observe their notation host and reflow when it
changes. The responsive policy uses notation width without the editing panel:

| Width                                                                                             | Behavior                                           |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Below `viewOnlyModeWidthThreshold` (default `500`)                                                | TabUI shows a size message and blocks interaction. |
| At or above `viewOnlyModeWidthThreshold`, below `unrestrictedModeWidthThreshold` (default `1000`) | TabUI forces compact view-only mode.               |
| At or above `unrestrictedModeWidthThreshold`                                                      | TabUI uses the configured interaction mode.        |

Override either threshold through `layout`. The resolved thresholds must be
finite, non-negative, and ascending. `layout.width` is an opt-in fixed notation
width. It must be finite and at least the view-only threshold. A host narrower
than that fixed width shows the same size message; otherwise TabUI renders at
exactly the configured width and respects the configured interaction mode.

`layout.mode` accepts `TabUILayoutMode.Wrapped` (the default) or
`TabUILayoutMode.SingleLine`. Single-line mode keeps all master bars on one
horizontally scrollable line and materializes only the visible bar range plus
overscan. Configure the mode when you construct the editor.

The score panel can be placed above or below notation. In edit mode, the side
panel can be placed left or right, hidden, or collapsible. View-only mode always
omits the side panel.

## Score Persistence

Use the versioned score serialization API for persistence.
Call `JSON.stringify(serializeScore(score))` rather than stringifying model
instances directly.

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

The `tabui-score` V1 document preserves guitar tablature metadata, master bars,
tracks, instruments and mix state, sparse voices, rests, tuplets, notes,
techniques, and bends. Runtime UUIDs and derived timing state are regenerated.
Malformed documents throw `ScoreSerializationError` with a JSONPath-like path,
such as `$.tracks[0].staves[0].bars`.

## Compatibility

TabUI is pre-`1.0.0`. Public APIs and serialized formats are documented where
they exist, but breaking changes remain possible before the first stable major
release.
