# Embedding TabUI

This guide is for developers who embed the TabUI editor in a web app. For using
the editor itself, see [Keyboard shortcuts and controls](keyboard-shortcuts.md). For every
configuration option, see `TabUIConfig` in the
[API reference](https://nik-idc.github.io/tabui/api/).

## Package usage

Import supported classes, functions, and types from `@atikincode/tabui`.

```ts
import {
  Score,
  TabUIEditor,
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
    unrestrictedModeWidthThreshold: 560,
  },
});

editor.init();

const unsubscribe = editor.subscribe((event) => {
  if (event.type === "change") {
    console.log(event.state.activeTrack, event.state.playback);
  } else if (event.type === "edit") {
    console.log("The score changed");
  } else if (event.type === "error") {
    console.error(event.error.code, event.error.message);
  }
});
```

Keep the editor mounted while the host uses it. When the host removes it, run:

```ts
unsubscribe();
editor.dispose();
```

## Scores

### Load a saved score

Use `deserializeScore()` to load a score that TabUI saved before, then pass it to
`TabUIEditor`:

```ts
import {
  Score,
  ScoreSerializationError,
  TabUIEditor,
  deserializeScore,
} from "@atikincode/tabui";

let score = new Score();
const stored = localStorage.getItem("score");
if (stored !== null) {
  try {
    score = deserializeScore(JSON.parse(stored));
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      console.error(error.path, error.message);
    }
  }
}

const editor = new TabUIEditor(root, score);
editor.init();
```

A malformed document throws `ScoreSerializationError` with a JSONPath-like path,
such as `$.tracks[0].staves[0].bars`. `deserializeScore()` reads only TabUI score
documents, not Guitar Pro, MIDI, or plain-text tablature files. For MusicXML,
see [Import and export MusicXML](#import-and-export-musicxml). Newer TabUI
versions keep reading scores saved by older versions.

To show a different score, dispose the current editor and create a new one with
that score.

### Save a score

Use `serializeScore()`, then `JSON.stringify()`. Do not stringify model objects
directly.

```ts
import { serializeScore } from "@atikincode/tabui";

const document = serializeScore(editor.score);
localStorage.setItem("score", JSON.stringify(document));
```

The document keeps tracks, instruments and mix state, master bars, voices,
rests, tuplets, notes, and techniques. Runtime UUIDs and timing are rebuilt when
the score is loaded.

For autosave or an unsaved-changes indicator, listen for `"edit"` events, not
`"change"` events. Dragging a volume or pan slider sends one edit event per
step, so debounce autosave:

```ts
let saveTimer: ReturnType<typeof setTimeout> | undefined;
editor.subscribe((event) => {
  if (event.type !== "edit") {
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem("score", JSON.stringify(serializeScore(editor.score)));
  }, 500);
});
```

### Import and export MusicXML

TabUI can import and export scores in MusicXML. You can use this to move
scores between TabUI and other notation software, such as Guitar Pro. TabUI
reads and writes uncompressed MusicXML files (`.musicxml` or `.xml`):

```ts
import {
  MusicXmlImportError,
  TabUIEditor,
  exportMusicXml,
  importMusicXml,
} from "@atikincode/tabui";

const xml = exportMusicXml(editor.score);

try {
  const { score, warnings } = importMusicXml(await file.text());
  console.log(warnings);
  editor.dispose();
  editor = new TabUIEditor(root, score);
  editor.init();
} catch (error) {
  if (error instanceof MusicXmlImportError) {
    console.error(error.message);
  }
}
```

Import has these limits:

- Only parts with a tab staff are imported. A tab staff has a `TAB` clef or a
  staff tuning, and its notes have string and fret numbers. Other parts are
  skipped, and `warnings` says which ones. If no part has a tab staff,
  `importMusicXml()` throws `MusicXmlImportError`.
- Up to four voices per staff are kept.
- Techniques that TabUI can't place, such as a slide into an open string, are
  skipped and counted in `warnings`.
- Compressed `.mxl` files aren't supported yet. An `.mxl` file is a zip
  archive, so you can extract the `.musicxml` file from it.
- Import needs `DOMParser`, which browsers provide.

Export writes every staff as a tab staff. TabUI writes palm mutes, pinch harmonics,
and bends the way Guitar Pro does. Let ring has no MusicXML element, so other apps
may ignore it. MusicXML volume can't go above 0 dB, so boosted tracks are written at
0 dB. Stroke timing, the master volume, and empty Let Ring slots aren't written.

Guitar Pro 7 doesn't write let ring, vibrato, or strokes to MusicXML, so files
from Guitar Pro come in without them.

### Build a score in code

`new Score()` creates one guitar track, one staff, and one empty 4/4 bar. This
function fills that bar with four quarter notes on the first string:

```ts
import { Beat, GuitarNote, NoteDuration, Score } from "@atikincode/tabui";

function createExampleScore(): Score {
  const score = new Score();
  const bar = score.tracks[0].staves[0].bars[0];
  const voiceBar = bar.ensureVoiceBar(1);

  const beats = [0, 2, 3, 5].map((fret) => {
    const beat = new Beat(
      voiceBar,
      voiceBar.trackContext,
      [],
      NoteDuration.Quarter
    );
    const note = beat.notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw new Error("Expected a guitar note");
    }
    note.fret = fret;
    return beat;
  });

  voiceBar.replaceBeats(beats);
  return score;
}
```

A beat has a note slot for each string. Use `null` as the beat's notes argument
to create a rest. Build the score before you create the editor. See the
[domain model](domain.md#score-structure) and the
[shared fixtures](https://github.com/nik-idc/tabui/blob/master/fixtures/README.md)
for larger examples.

## Styles and icons

The package is framework-agnostic. Import its styles from
`@atikincode/tabui/styles.css`. Fine-grained CSS customization isn't
supported yet.

### Editor size

The editor fills its parent's height, and the notation scrolls inside it. Give
the parent a height, or set one on the host element. TabUI adds the
`.tu-editor` class to the host, so a host rule needs both selectors:

```css
#tabui-editor.tu-editor {
  height: 80vh;
}
```

If neither has a height, the editor grows to fit the score and the page
scrolls.

### Bundled icons

Default SVG icons are bundled as data URLs, so no public asset folder or external
hosting is needed. Use `assets.variant: "dark"` for the dark icons; the default is
`"light"`.

**All default icons are 100% made by me in Inkscape.**

### Custom and hosted icons

To use externally hosted or custom icons, set `assets.baseUrl` to their public
folder URL. That folder must contain the matching
`img` and `img-dark` subfolders. An omitted or empty base URL uses bundled icons.
The original SVG files are still exported under `@atikincode/tabui/assets/*`
for optional self-hosting or direct imports. Apps with a Content Security Policy
must allow `data:` in `img-src` to display bundled icons, or use a permitted
external icon base URL instead.

## Playback and audio samples

The package does not include audio samples. Playback uses synthesized tones by
default; provide sample URLs through `playback.samples` for sample-based audio.

Samples are keyed by instrument tone. The key must match the tone of the track's
instrument. The default guitar uses `ElectricGuitarTone.Clean`:

```ts
import { ElectricGuitarTone, NoteValue, TabUIConfig } from "@atikincode/tabui";

const config: TabUIConfig = {
  playback: {
    samples: {
      [ElectricGuitarTone.Clean]: {
        url: "/audio/clean-guitar-c3.wav",
        rootNote: { noteValue: NoteValue.C, octave: 3 },
      },
    },
  },
};
```

Pass this configuration as the third argument to `TabUIEditor` and serve your
sample at the given URL. `rootNote` is the pitch recorded in the file; TabUI uses
it to transpose the recording to each played note. If omitted, it defaults to
E2. Set it explicitly when your recording has a different pitch. Tones without
a configured sample use synthesized audio.

The [raw demo source](https://github.com/nik-idc/tabui/blob/master/demo/raw/demo-app.ts) includes configurations for several
guitar and bass tones.

Set `playback.preloadAudio` to `true` to prepare configured `playback.samples` in the
background during initialization. It does not block `init()` or resume audio;
the first Play action still satisfies browser user-gesture requirements.

The metronome and playback pitch shift are editor controls. They change only
the audio and are not saved with the score.

## Editor lifecycle

Pass a dedicated empty root to `TabUIEditor`. The host owns that root and TabUI
owns its contents while mounted. `init()` is synchronous and may be called once.
`dispose()` is idempotent and terminal. Replace a score by disposing the editor
and creating a new one.

Configuration is resolved when the editor is constructed. To change settings
such as the theme, icons, or layout mode, dispose the old editor and create a
fresh instance with the same score and the new configuration. Treat
`editor.config` as resolved settings, not a live update API. Recreation resets
editor UI state, including selection and undo history.

After a host-controlled layout change, call `editor.refreshLayout()` if needed;
automatic host resizing is described under [responsive layout](#responsive-layout).
Call `subscribe()`, `getState()`, and `refreshLayout()` only after `init()` and
before disposal.

## Framework integration

The host owns the root element; TabUI owns its children while mounted.
Create the editor after the root is attached to the DOM, and dispose it when
the component unmounts.

For React, see the [runnable demo and lifecycle guide](https://github.com/nik-idc/tabui/blob/master/demo/react/README.md)
and its [wrapper component](https://github.com/nik-idc/tabui/blob/master/demo/react/tabui.tsx). The wrapper creates a fresh
editor in each effect setup, then unsubscribes and disposes it in cleanup. This
also handles development Strict Mode's setup → cleanup → setup cycle. The parent
keeps callbacks stable with `useCallback` to avoid unnecessary recreation; theme
changes intentionally recreate the editor while preserving the score.

The [Angular demo and lifecycle guide](https://github.com/nik-idc/tabui/blob/master/demo/angular/README.md) shows the same
host/editor boundary using Angular components and forms. The
[Vue demo and lifecycle guide](https://github.com/nik-idc/tabui/blob/master/demo/vue/README.md) uses Composition API lifecycle
hooks, `v-model`, and `shallowRef`/`markRaw` to keep library objects out of deep
reactivity.

All four examples—[raw JavaScript/TypeScript](https://github.com/nik-idc/tabui/blob/master/demo/raw/README.md), React,
Angular, and Vue—are tested using a locally built npm package, as a separate app
would install it.

## State and events

`getState()` exposes the active track, playback state, selection, and rendered
layout size. Its identity is stable between change events. `subscribe()` is
editor-instance scoped and returns an idempotent unsubscribe function. Playback
failures arrive as structured `"error"` events.

A `"change"` event is a broad editor-state notification: selection, playback,
layout, or score edits can trigger it. It is not a document-dirty event.

An `"edit"` event follows the `"change"` event of each user action that changed
the saved score: notes and bars, techniques, the score name and details, tracks
and their instruments, and mix settings such as volume, pan, mute, and solo.
Undo and redo are edits too. One action sends one event, even when it changes
many beats.
Changes that the host makes directly to the model do not send edit events. Read
`editor.getState()` after initialization for the initial state; subscribing does
not immediately call the listener. State snapshots describe the editor and refer
to model objects; they are not serialized score documents or deep score copies.

## Score ownership and host updates

The host owns the `Score` passed to `TabUIEditor`. TabUI edits that same object,
available as `editor.score`; it does not create a separate working copy. To save
it, see [Save a score](#save-a-score).

Direct model mutations are not a supported live-update mechanism for a mounted
editor. They do not automatically refresh all editor state or enter its undo
history. `refreshLayout()` refreshes geometry; it is not a general score-update
method. For host-driven content changes, dispose the editor, update or replace
the score, and mount a fresh editor. Prepare programmatic scores before mounting.

## Editing and view-only modes

`interaction.mode` accepts `TabUIEditorMode.Edit` (the default) or
`TabUIEditorMode.ViewOnly`. View-only mode permits playback, seeking, scrolling,
copying, and active-track selection. It removes editing controls and prevents
score mutations at the controller level.

## Themes and fonts

You can configure UI and notation colours
through `theme.ui.colors` and `theme.notation.colors`. Choose contrasting text,
background, selection, and cursor colours, and pair dark backgrounds with
`assets.variant: "dark"` so icons remain visible.

UI fonts use `theme.ui.fonts.default.family` and `.size` for the body and
controls. `theme.ui.fonts.scoreName.family` falls back to the default family;
its `.size` falls back to the default size, or `2.25rem` when no default size is
set. The body defaults to Segoe UI at `1rem`.

## Layout and panels

### Responsive layout

Editors without `layout.width` observe their notation host and reflow when it
changes. The responsive policy uses the editor's width without its padding,
including the side panel:

| Width                                                                                            | Behavior                                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Below `viewOnlyModeWidthThreshold` (default `500`)                                               | TabUI shows a size message and blocks interaction. |
| At or above `viewOnlyModeWidthThreshold`, below `unrestrictedModeWidthThreshold` (default `560`) | TabUI forces compact view-only mode.               |
| At or above `unrestrictedModeWidthThreshold`                                                     | TabUI uses the configured interaction mode.        |

Override either threshold through `layout`. The resolved thresholds must be
finite, non-negative, and ascending. `layout.width` is an opt-in fixed notation
width. It must be finite and at least the view-only threshold. A host narrower
than that fixed width shows the same size message; otherwise TabUI renders at
exactly the configured width and respects the configured interaction mode.

### Wrapped and single-line layouts

`layout.mode` accepts `TabUILayoutMode.Wrapped` (the default) or
`TabUILayoutMode.SingleLine`. Single-line mode keeps all master bars on one
horizontally scrollable line and materializes only the visible bar range plus
overscan. Configure the mode when you construct the editor.

### Panel placement and visibility

The score panel can be placed above or below notation. In edit mode, the side
panel can be placed left or right, hidden, or collapsible. View-only mode always
omits the side panel.

## Compatibility

TabUI is pre-`1.0.0`. Public APIs can still change before the first stable
major release. Saved scores stay readable: newer TabUI versions keep reading
scores saved by older versions.
