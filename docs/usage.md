# Using TabUI

TabUI is a guitar tablature editing engine.

For installation and a minimal example, see the [README](../README.md).

## Contents

- [Demo](#demo)
- [Package usage](#package-usage)
- [Creating a populated score](#creating-a-populated-score)
- [Styles and icons](#styles-and-icons)
  - [Bundled icons](#bundled-icons)
  - [Custom and hosted icons](#custom-and-hosted-icons)
- [Playback and audio samples](#playback-and-audio-samples)
- [Editor lifecycle](#editor-lifecycle)
- [Framework integration](#framework-integration)
- [State and events](#state-and-events)
- [Score ownership and host updates](#score-ownership-and-host-updates)
- [Interaction](#interaction)
  - [Editing and view-only modes](#editing-and-view-only-modes)
  - [Mouse, touch, and pen input](#mouse-touch-and-pen-input)
  - [Editing with no selection](#editing-with-no-selection)
- [Accessibility](#accessibility)
  - [Keyboard navigation](#keyboard-navigation)
  - [Screen-reader feedback](#screen-reader-feedback)
  - [Visual accessibility](#visual-accessibility)
- [Layout and panels](#layout-and-panels)
  - [Responsive layout](#responsive-layout)
  - [Wrapped and single-line layouts](#wrapped-and-single-line-layouts)
  - [Panel placement and visibility](#panel-placement-and-visibility)
- [Score persistence](#score-persistence)
- [Compatibility](#compatibility)

## Demo

[GitHub Pages Demo](https://nik-idc.github.io/tabui/)

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
```

Keep the editor mounted while the host uses it. When the host removes it, run:

```ts
unsubscribe();
editor.dispose();
```

## Creating a populated score

`new Score()` creates one guitar track, one staff, and one empty 4/4 bar.
Build musical content before mounting the editor. This function fills that bar
with four quarter notes on the first (highest-pitched) string:

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

In the [package usage example](#package-usage), pass `createExampleScore()` instead
of `new Score()` to `TabUIEditor`. A beat contains a note slot for each string;
the other string slots stay empty in this example. Voice numbers run from 1 to 4.
Use `null` for the beat constructor's notes argument to create a rest.

See the [domain model](domain.md#score-structure) for the score structure and
the repository's [shared fixtures](../fixtures/README.md) for larger examples.
To restore a saved TabUI score, use [score persistence](#score-persistence).

## Styles and icons

The package is framework-agnostic. Import its styles from
`@atikincode/tabui/styles.css`.

### Bundled icons

Default SVG icons are bundled as data URLs, so no public asset folder or external
hosting is needed. Use `assets.variant: "dark"` for the dark icons; the default is
`"light"`.

### Custom and hosted icons

To use externally hosted or custom icons, set `assets.baseUrl` to their public
folder URL (for example, `/tabui-assets`). That folder must contain the matching
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

The [raw demo source](../demo/raw/main.ts) includes configurations for several
guitar and bass tones.

Set `playback.preloadAudio` to `true` to prepare configured `playback.samples` in the
background during initialization. It does not block `init()` or resume audio;
the first Play action still satisfies browser user-gesture requirements.

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

The host framework owns the root element; TabUI owns its children while mounted.
Create the editor after the root is attached to the DOM, and dispose it when
the component unmounts. Keep the score and setup dependencies stable so normal
framework updates do not recreate the editor.

For React, see the [runnable demo and lifecycle guide](../demo/react/README.md)
and its [wrapper component](../demo/react/tabui.tsx). The wrapper creates a fresh
editor in each effect setup, then unsubscribes and disposes it in cleanup. This
also handles development Strict Mode's setup → cleanup → setup cycle. The parent
keeps callbacks stable with `useCallback` to avoid unnecessary recreation; theme
changes intentionally recreate the editor while preserving the score.

The React example covers client rendering with Vite. It does not establish an
SSR or hydration integration; editor creation requires the browser DOM.

## State and events

`getState()` exposes the active track, playback state, selection, and rendered
layout size. Its identity is stable between change events. `subscribe()` is
editor-instance scoped and returns an idempotent unsubscribe function. Playback
failures arrive as structured `"error"` events.

A `"change"` event is a broad editor-state notification: selection, playback,
layout, or score edits can trigger it. It is not a document-dirty event. Read
`editor.getState()` after initialization for the initial state; subscribing does
not immediately call the listener. State snapshots describe the editor and refer
to model objects; they are not serialized score documents or deep score copies.

## Score ownership and host updates

The host owns the `Score` passed to `TabUIEditor`. TabUI edits that same object,
available as `editor.score`; it does not create a separate working copy. Save it
with `serializeScore(editor.score)`, as shown in [score persistence](#score-persistence).

Do not treat every `"change"` event as an unsaved score edit. For autosave or a
dirty indicator, compare serialized score content with the last saved content
at an appropriate point, such as a debounced change handler.

Direct model mutations are not a supported live-update mechanism for a mounted
editor. They do not automatically refresh all editor state or enter its undo
history. `refreshLayout()` refreshes geometry; it is not a general score-update
method. For host-driven content changes, dispose the editor, update or replace
the score, and mount a fresh editor. Prepare programmatic scores before mounting.

## Interaction

### Editing and view-only modes

`interaction.mode` accepts `TabUIEditorMode.Edit` (the default) or
`TabUIEditorMode.ViewOnly`. View-only mode permits playback, seeking, scrolling,
copying, and active-track selection. It removes editing controls and prevents
score mutations at the controller boundary.

### Mouse, touch, and pen input

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

## Accessibility

TabUI aims to make tablature navigation and editing usable by blind and
visually impaired people, as well as people who use a keyboard instead of a
mouse. It includes keyboard navigation, named controls, focus management, and
screen-reader announcements, with support for NVDA and Orca (MacOS screen readers
should work too - but hasn't been tested).

### Keyboard navigation

See the [full keyboard shortcut reference](keyboard-shortcuts.md) for all
navigation, editing, technique, and dialog shortcuts and their requirements.

Use Tab and Shift+Tab to move between editor controls and the notation area.
Activate the **Skip to notation** link to move directly to the **Notation editor**
area. Entering notation announces the current position, including the initial
position in an empty score.

While notation has focus, these keys provide basic navigation and editing:

| Key                                | Action                                         |
| ---------------------------------- | ---------------------------------------------- |
| Left / Right arrow                 | Move between beats.                            |
| Up / Down arrow                    | Move between strings.                          |
| Ctrl+Left / Ctrl+Right             | Move between bars.                             |
| Shift+Left / Shift+Right           | Extend the selected beat range.                |
| Ctrl+Shift+Left / Ctrl+Shift+Right | Extend the range by bar.                       |
| Shift+V                            | Cycle through the staff's four voices.         |
| Number keys                        | Enter a fret number on the selected note slot. |
| Space                              | Start or stop playback.                        |
| Ctrl+Z / Ctrl+Y                    | Undo or redo an edit.                          |

Editing shortcuts require edit mode; see [interaction modes](#editing-and-view-only-modes)
and the [no-selection limitation](#editing-with-no-selection). Notation shortcuts
apply while notation has focus, so typing in a host form or editor dialog does
not edit the score.

Buttons support normal keyboard activation. Open dialogs keep keyboard focus
within their controls; Escape closes a dialog and returns focus to its opener.

### Screen-reader feedback

The notation area is exposed as an application region named **Notation editor**.
If your screen reader intercepts navigation keys, use its focus or interaction
mode while working in this area.

TabUI publishes text announcements through live status regions. Depending on the
action, these describe:

- The active track, staff, voice, bar, time signature, and tempo.
- The selected beat, duration, string, fret or rest, and techniques.
- Changes to a selected beat range.
- Changes made through controls such as tempo, repeat count, and string tuning.

Toolbar buttons have accessible names. Toggle controls expose their pressed
state, and unavailable controls expose their disabled state. Dialogs have names
and labeled fields, so their purpose does not depend on seeing an icon.

Browser tests check focus, accessible names and states, and announcement text.
Actual speech also depends on the browser and screen-reader settings. If you
find an obstacle, [report it](https://github.com/nik-idc/tabui/issues) with the
browser, screen reader, and steps used.

### Visual accessibility

Controls provide visible keyboard-focus indicators, and icon tooltips appear on
both hover and keyboard focus. Applications can configure UI and notation colours
through `theme.ui.colors` and `theme.notation.colors`. Choose contrasting text,
background, selection, and cursor colours, and pair dark backgrounds with
`assets.variant: "dark"` so icons remain visible.

The [demo](#demo) includes light, dark, and **High Contrast** themes to try.
Browser zoom can reduce the available notation width; the
[responsive layout rules](#responsive-layout) still apply.

## Layout and panels

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

### Wrapped and single-line layouts

`layout.mode` accepts `TabUILayoutMode.Wrapped` (the default) or
`TabUILayoutMode.SingleLine`. Single-line mode keeps all master bars on one
horizontally scrollable line and materializes only the visible bar range plus
overscan. Configure the mode when you construct the editor.

### Panel placement and visibility

The score panel can be placed above or below notation. In edit mode, the side
panel can be placed left or right, hidden, or collapsible. View-only mode always
omits the side panel.

## Score persistence

Use the versioned score serialization API for persistence.
Call `JSON.stringify(serializeScore(score))` rather than stringifying model
instances directly.

```ts
import {
  ScoreSerializationError,
  deserializeScore,
  serializeScore,
} from "@atikincode/tabui";

// Use the score owned by the initialized editor.
const document = serializeScore(editor.score);
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

`deserializeScore()` expects a TabUI score document, not a Guitar Pro, MusicXML,
MIDI, or plain-text tablature file. Importers for those formats are not currently
provided. To display the restored score, dispose the current editor and pass
`restoredScore` to a new `TabUIEditor`, then call `init()` on that instance.

## Compatibility

TabUI is pre-`1.0.0`. Public APIs and serialized formats are documented where
they exist, but breaking changes remain possible before the first stable major
release.
