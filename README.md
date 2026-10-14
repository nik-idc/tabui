# TabUI

A framework-agnostic guitar tablature editor for the browser, written in
TypeScript.

[Try the demo](https://nik-idc.github.io/tabui/) ·
[Usage guide](docs/usage.md) · [Roadmap](ROADMAP.md)

## Features

- Mouse, touch, and keyboard interaction, with undo and redo.
- Multi-track scores, up to four voices per staff, rests, and tuplets.
- Guitar techniques, including bends, slides, harmonics, and palm mute.
- Multi-track playback with volume, pan, mute, solo, and looping.
- Wrapped and single-line layouts, view-only mode, and configurable themes.
- Screen reader compatibility (NVDA, Orca).

## Quick start

```sh
npm install @atikincode/tabui
```

Default icons are bundled with the library; no asset setup is needed.

```html
<div id="tabui-editor"></div>
```

```ts
import { Score, TabUIEditor } from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";

const root = document.getElementById("tabui-editor");
if (!(root instanceof HTMLDivElement)) {
  throw new Error("Missing editor root");
}

const editor = new TabUIEditor(root, new Score());
editor.init();

// When your app removes the editor:
// editor.dispose();
```

See the [usage guide](docs/usage.md) for configuration, events, persistence,
and lifecycle details.

## Status and limits

TabUI is under active development toward v0.5.0. APIs and saved-score formats
may change before v1.0.0.

Tablature is supported; standard and drum notation are not yet implemented.
One track is displayed at a time, while playback includes all tracks. Playback
uses synthesized tones unless you provide audio samples.

The interface is designed for desktop and larger screens. By default, notation
widths below 1000px use view-only mode, and widths below 500px block interaction.
Full phone editing is not yet supported. Screen-reader support includes keyboard
navigation, labeled controls, and selection announcements.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and checks. Report bugs and
request features through [GitHub Issues](https://github.com/nik-idc/tabui/issues).

## License

[MIT](LICENSE).
