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
