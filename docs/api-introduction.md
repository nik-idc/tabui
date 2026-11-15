# TabUI API reference

TabUI is a guitar tablature editor for the browser. This reference describes
the public API exported by `@atikincode/tabui`.

This reference is updated with each release. If you use an older version,
check your installed package's declarations and comments.

## Start here

- [Embedding guide](/embedding): installation, configuration, lifecycle,
  events, and saving scores.
- [Framework examples](/embedding#framework-integration): React, Angular, and
  Vue integration.
- [Keyboard shortcuts](/keyboard-shortcuts).
- [Try the demo](/demo).

## Main APIs

- {@link TabUIEditor}: attach an editor to a page, handle events, and dispose it.
- {@link TabUIConfig}: configure the editor's appearance and behavior.
- {@link Score}: create and inspect a score and its tracks.
- {@link ScoreEditor}: prepare or change scores without a mounted editor.
- {@link serializeScore} and {@link deserializeScore}: save and load score data.

Use the editor's controls and shortcuts for interactive changes. Prepare scores
with the public `ScoreEditor` before mounting when needed. Direct model changes
do not automatically provide undo, redraw, or host events. See the embedding guide
for lifecycle and editing rules.
