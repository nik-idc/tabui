# TabUI

TabUI is a guitar tablature editing engine.

## Demo

[GitHub Pages Demo](https://nik-idc.github.io/tabui/)

## Features

- **Interactive Editor:** GUI + keyboard shortcut based editing
- **Techniques** Support for techniques such as vibrato, palm mute,
  harmonics, hammer-on/pull-off, slides, and bends.
- **Playback:** Live playback of the current score state.
- **Multi-track Scores:** Multiple tracks can exist within the same score.
- **Performance**. Large 50MB+ scores are just as usable as lighter, smaller scores.

## Status

TabUI is still pre-`1.0.0` and under active development.
Current goal is to finish and deploy version `0.5.0` - the first version
that will be marked as ready for use but still maintainng pre-`1.0.0.`
permission to change and break virtually anything.

WARNING: Below is **mostly AI slop**. It should still be informative but
the final README will be 100% human-written.

## Package Usage

```ts
import {
  Score,
  TabUIEditor,
  TabUIEditorMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";

const root = document.getElementById("tabui-editor") as HTMLDivElement;
const editor = new TabUIEditor(root, new Score(), {
  assets: { baseUrl: "/tabui-assets" },
  panels: {
    score: { placement: TabUIScorePanelPlacement.Top },
    side: {
      placement: TabUISidePanelPlacement.Left,
      collapsible: true,
    },
  },
  layout: {
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
`@atikincode/tabui/styles.css`. Runtime icons are published under
`@atikincode/tabui/assets/*`; serve them from your application and provide their
public base URL with `assets.baseUrl`.

Pass a dedicated empty root to `TabUIEditor`. The host owns that root and TabUI
owns its contents while mounted. `init()` is synchronous and may be called once.
`dispose()` is idempotent and terminal. Replace a score by disposing the editor
and creating a new one.

`getState()` exposes the active track, playback state, selection, and rendered
layout size. Its identity is stable between change events. `subscribe()` is
editor-instance scoped and returns an idempotent unsubscribe function. Playback
failures arrive as structured `"error"` events.

## Interaction And Responsive Behavior

`interaction.mode` accepts `TabUIEditorMode.Edit` (the default) or
`TabUIEditorMode.ViewOnly`. View-only mode permits playback, seeking, scrolling,
copying, and active-track selection. It removes editing controls and prevents
score mutations at the controller boundary.

Notation selection uses Pointer Events for mouse, touch, and pen input. Desktop
drag selection remains a single-pointer interaction. Full phone editing and
two-handle touch selection are not currently supported.

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

The score panel can be placed above or below notation. In edit mode, the side
panel can be placed left or right, hidden, or collapsible. View-only mode always
omits the side panel.

## Score Persistence

Use the versioned score serialization API for persistence:

Model-level JSON methods and types have been removed. Use
`JSON.stringify(serializeScore(score))` rather than stringifying model instances
directly.

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

## CI And Deployment

Pull requests targeting `master` and pushes to `master` run the deterministic
CI gate through `npm run verify`: tests, package build, packed-consumer validation,
and demo build. The timing benchmark remains a deliberate local/release check
rather than a shared-runner CI gate.

Tags matching `v*` run the same gate and upload `demo/dist` through GitHub's
official Pages artifact workflow. Deployment occurs only after verification
passes. The repository's GitHub Pages source must be set to **GitHub Actions**.
Creating and pushing a release tag remains a maintainer action. Protect the
`github-pages` environment with a required maintainer reviewer when deployment
approval is desired.

Workflow actions are pinned to immutable commits. Dependabot checks GitHub
Actions and npm dependencies monthly; npm minor and patch updates are grouped,
while major updates remain individually reviewable.

## Roadmap

See `PHASE-6-ROADMAP.md` for the current stabilization work and release scope.
