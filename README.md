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
import { EditorLayoutDimensions, Score, TabUIEditor } from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";

EditorLayoutDimensions.configure({
  width: 1200,
  noteTextSize: 12,
  timeSigTextSize: 48,
  tempoTextSize: 24,
  durationsHeight: 30,
});

const root = document.getElementById("tabui-editor") as HTMLDivElement;
const editor = new TabUIEditor(root, new Score(), {
  assets: { baseUrl: "/tabui-assets" },
});

editor.init();
```

The root export is the supported framework-agnostic API. Styles are available
from `@atikincode/tabui/styles.css`. Runtime icons are packaged under
`@atikincode/tabui/assets/*`; serve those files from your app and pass the public
base URL through `assets.baseUrl`. Playback samples are host-provided through the
`playback` config and fall back to oscillator playback when omitted.

The refactor and optimization work from `tu-69-refactor-and-optimization` has
been merged into `master` and now serves as the current development baseline.

Any and all compatibility is allowed to break before version `1.0.0`. Version
`0.5.0` is a viable checkpoint where a demo-able MVP is possible via
integration of TabUI into a web client, with the planned React.js client as the
first target integration.

## Current Focus

- Introduce a tick-based timing model across the project.
- Strengthen the model and element layers with focused automated tests.
- Improve performance for large-score layout and rendering updates.
- Expand notation support beyond tablature, with non-tablature notation viewing
  as the minimum target for `0.5.0`.
- Improve playback quality and multi-track playback behavior.

## Roadmap

See `ROADMAP.md` for the current plan toward `0.5.0` and beyond.
