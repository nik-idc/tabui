# TabUI

A framework-agnostic guitar tablature editor for the browser, written in
TypeScript.

[Website](https://nik-idc.github.io/tabui/) ·
[Try the demo](https://nik-idc.github.io/tabui/demo) ·
[API reference](https://nik-idc.github.io/tabui/api/) ·
[Embedding guide](docs/embedding.md) ·
[Keyboard shortcuts](docs/keyboard-shortcuts.md) ·
[Features](docs/features.md) ·
[Roadmap](ROADMAP.md)

## Features

- Mouse, touch, and keyboard interaction.
- Notation editing, with undo and redo.
- Multi-track scores, up to four voices per staff.
- Guitar techniques, including bends, slides, harmonics, palm mute, strokes,
  accents, and more.
- Multi-track playback with dynamics, volume, pan, mute, solo, and looping.
- Wrapped and single-line layouts, view-only mode, and configurable themes.
- Screen reader compatibility (NVDA, Orca), with keyboard navigation and selection
  announcements. See [accessibility](docs/keyboard-shortcuts.md#accessibility).

If you know Guitar Pro, you know most of TabUI: select notes, type frets, and
set durations and techniques from the side panel or with
[shortcuts](docs/keyboard-shortcuts.md).

## Why I built this

Before I describe what TabUI offers, I want to be upfront.

**I built this mainly for fun and for my own use.** I enjoy working on it, and I
plan on using it myself. So don't think TabUI solves some fundamental flaw that
all other tablature editors have.

With that said, along the way it got a few things I haven't seen elsewhere:

- A full editor you can embed into any web app. You don't have to write your own
  editing code: TabUI handles all of that. It's designed to be as plug-and-play
  as possible. Each instance is fully self-contained, so several editors can run
  on one page without affecting each other. It runs in any modern browser on Windows and Linux (macOS is not
  tested yet). On small screens it switches to a view-only mode.

- Customizability. You can define any theme (fonts and colors), and use your own
  icons and samples.

- Performance. Note: this isn't a formal benchmark, just my experience on my
  machine. TabUI stays responsive with a dense 1000-bar score, just like it does
  with a small score under 10 bars. I spent a lot of time making sure most edits
  in large scores stay under 100ms. It's not perfect yet: some paths can still
  make an edit take a couple of seconds. But overall, TabUI performs well with
  large scores. Performance is a core part of TabUI, and I don't want to
  compromise on it.

- Accessibility. I want anything a sighted user can do to also be possible for
  blind and low-vision users, and for users with limited mobility. I focus on two
  things:
  - Equal input methods. The mouse and the keyboard are meant to be equally
    important, so you can use TabUI with only a keyboard, only a mouse, or both.
    Most actions already work both ways.
  - Announcements. Navigation, selection, and edits are announced for screen
    readers. I have tested this with NVDA on Windows (in a VM) and Orca on Linux.
    macOS is not tested yet, mainly because I don't own a Mac.

  I am not visually impaired myself, and my mobility is not limited, so I can't
  be 100% sure TabUI is as comfortable for these users as it is for me. But I
  take accessibility feedback seriously and fix it as quickly as any other bug. I
  want TabUI to be usable by **all** users.

## Status and limits

TabUI 0.5.0 is the first version meant to be embedded and built upon. APIs may
still change before v1.0.0. Scores saved with 0.5.0 or later will keep loading
in later versions.

The following limits are planned work:

- **Only guitar tablature is supported.** Standard and drum notation are
  planned. I try to keep the code independent of notation style, so I can add
  them later without rewriting everything. I learned this from voices: I
  initially assumed that TabUI would not support multiple voices, so adding them
  later required rewriting every layer of the code.
- **One track is displayed at a time.** Playback still includes all tracks.
  Showing several tracks together is planned.
- **Only basic MusicXML import and export.** Scores are saved in TabUI's own
  JSON format. MusicXML import keeps only tab staves and doesn't read
  compressed `.mxl` files. Guitar Pro and MIDI are not supported yet.

These limits, on the other hand, are explicit design choices I made:

- **One score per TabUI instance.** You can put several instances with
  different scores on one page. They are fully self-contained and do not
  interact.
- **No samples are included.** If no samples are provided, playback uses
  synthesized tones.
- **Editing needs enough screen space.** TabUI checks the available width, not
  the device type. By default, viewports narrower than 1000px use view-only mode,
  and viewports narrower than 500px block interaction. So an unfolded foldable
  phone in landscape may be wide enough to edit, while a small tablet in
  portrait, like an iPad Mini, can only view.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and checks. Report bugs and
request features through [GitHub Issues](https://github.com/nik-idc/tabui/issues).

## License

TabUI is licensed under the [MIT License](LICENSE).

### Third-party assets

The [demo](https://nik-idc.github.io/tabui/demo) uses two sets of audio samples. They
are demo resources only: they are not covered by TabUI's MIT license and are not
included in the npm package.

- **FluidR3** (the demo default): extracted from the Fluid (R3) SoundFont,
  copyright 2000-2002, 2008 Frank Wen and contributors, under its own MIT-style
  license. See [the FluidR3 samples README](assets/samples/fluidr3/README.md).
- **Free Wave Samples**: recorded by Jason Champion and provided by
  [Free Wave Samples](https://freewavesamples.com/), under the site's
  [sample license](https://freewavesamples.com/about-us-license). It allows
  hosting the samples for web-app playback, but not as a separate download
  collection. See [the samples README](assets/samples/README.md).
