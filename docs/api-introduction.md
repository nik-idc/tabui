# TabUI API reference

TabUI is a guitar tablature editor for the browser. This reference describes
the public API exported by `@atikincode/tabui`.

The version shown in the page heading is the package version used to build this
reference. The hosted reference is updated with each release deployment. If you
use an older version, check your installed package's declarations and comments.

## Start here

- [Usage guide](https://github.com/nik-idc/tabui/blob/master/docs/usage.md):
  installation, configuration, lifecycle, events, and saving scores.
- [Framework examples](https://github.com/nik-idc/tabui/blob/master/docs/usage.md#framework-integration):
  React, Angular, and Vue integration.
- [Keyboard shortcuts](https://github.com/nik-idc/tabui/blob/master/docs/keyboard-shortcuts.md).
- [Try the demo](https://nik-idc.github.io/tabui/).

The guides above follow the repository's current `master` branch.

## Main APIs

- {@link TabUIEditor}: attach an editor to a page, handle events, and dispose it.
- {@link TabUIConfig}: configure the editor's appearance and behavior.
- {@link Score}: create and inspect a score and its tracks.
- {@link ScoreEditor}: prepare or change scores without a mounted editor.
- {@link serializeScore} and {@link deserializeScore}: save and load score data.

Use the mounted editor's editing API for interactive changes. Direct model
changes do not automatically provide undo, redraw, or host events. See the
usage guide for lifecycle and editing rules.
