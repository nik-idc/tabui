# Roadmap

This file describes my vision for TabUI and its future.

## Major milestones

TabUI currently has two major milestones set:

- `0.5.0`. **First version is ready to be used and built upon**. After `0.5.0`
  is released, I will begin working on a wrapper React + Nest.js app. That is
  the point of `0.5.0`: TabUI is stable and presentable enough to be embedded
  into an actual app meant for guitarists to use. As it is pre-`1.0.0`, APIs can
  and will break.

- `1.0.0`. As of now, there is no concrete `1.0.0` vision. Treat this list as a
  direction, not a fixed plan. It may change. But for now I feel like `1.0.0`
  should at least achieve:
  - Sheet and drum notation. I think a good threshold for `1.0.0` is TabUI
    turning from guitar tabs only to tab + sheet + drum. So that passages on
    virtually any instrument are transcribable in TabUI.
  - Richer functionality. More techniques, more customization, etc.
  - Improved realistic playback.
  - Commitment. TabUI can be rewritten from the ground up before `1.0.0`. After
    that, breaking changes will require a new major version. This includes the
    score format: it can only break in a major version.

  See [Long term work](#long-term-work) for details.

## Short term/immediate work

This file **does not** describe immediate features or bug fixes that are planned
or in progress. Those live in GitHub issues.

## Medium term work

These are issues that I want to address in the medium term. Meaning some time
after `0.5.0` is released and a full web app is built on top of it. These are
in no particular order.

- Layout rethink. Keep the time-based spacing, add a collision detector in the
  Element layer, and let each notation style report how much space it needs.
  Grace notes follow after that. I want to start this one soon.

- Show several tracks together. Currently one track is displayed at a time.
  Bar widths are already calculated across all tracks, so part of the groundwork
  exists.

- Desloppify editing. This one is admittedly going to be pretty vague.
  Currently `ScoreEditor` just _feels_ a little sloppy. It's not vibe coded but I
  feel like I may have been a bit too permissive with some outputs of my agents.
  I imagine desloppifying this layer would entail better separation of concerns,
  improved modularization, and reduction of excessive complexity.

- Audit and potentially rewrite the test suite. The current test suite has about
  1500 tests as of writing this. Any time I start a strict audit of the test
  suite my agents report that actually the majority of these tests are fine and
  only ~100 can be trimmed down. Maybe they are right but I just have a _hunch_
  that close to 1500 tests for this project is too much. Not to mention that a
  good chunk of these tests **are** vibe coded. I usually only quickly glance at
  the diff to check if there are any red flags, not analyze the code as deeply
  as I do with actual source code, which is part of why I want to audit them.

- Formats and parsing. At least MusicXML, since that is a universally supported
  format. But also preferably Guitar Pro (`.gp`) and MIDI too.

- Headless use. This entails being able to install TabUI and use it via CLI.
  Something like:
  - `tabui calculate some-score.gp`: Takes a Guitar Pro score and calculates the
    TabUI geometry from its model data (`TrackElement.update()`).
  - `tabui render some-score.gp`: Renders the state of the model data in the
    file to SVG, the same way TabUI renders normally in the DOM.
  - `tabui convert tabui-format-score.json "gp"`: Converts the given file to the
    requested format. Input/output can be of any supported format.

- Agentic use. This largely means being able to implement this loop:
  - Speak/write text to an LLM instructing what to do. E.g. "put a bend on the
    3rd string".
  - The LLM interprets this and outputs JSON, something like:

    ```jsonc
    {
      "command": "SetTechniqueCommand",
      "targets": [20, 4, 3], // Bar index, beat index, string number
      "type": "GuitarTechniqueType.Bend",
      "options": {...} // Bend options
    }
    ```

  - TabUI receives this JSON via a top level method like `TabUI.execute()` and
    executes the specified command.

  I guess it could be said this isn't really about agentic use but more about a
  defined programmatic way for consumers to modify notation. But the immediate
  actual use case my mind jumps to is agentic use. And I think it's easiest to
  understand why it's useful in this context too.

- Examine performance bottlenecks. Some paths still result in long edits of 3
  seconds or more. It would be ideal if **no** editing path is longer than
  100ms.

## Long term work

- Sheet and drum notation. Arguably one of the most crucial pieces of work
  described in this file. When complete, this would allow **any** instrument and
  **any** score. Not just guitar focused pieces. "Spiritually" TabUI will remain
  focused on guitarists, but this would allow transcribing whole scores instead
  of just the guitar parts. This could be especially useful for drummers in rock
  and metal bands.

- Realistic playback. This would most likely require obtaining/recording a much
  more detailed set of samples. For example Palm Mutes: instead of emulating
  them, as TabUI does now, this separate sample set could have a separate set of
  recordings of palm muted notes.

- Comments. Basically just text, I imagine attached to bars.

- Hot config reloading & changing.

- Visible error and status messages. Today, failures that the user should know
  about are only spoken to screen readers, for example when the browser blocks
  the clipboard buttons. Sighted users get no feedback. This needs a visible
  message area, something like a snack bar or a subtle status bar string. Doing
  it right means tracing every place where such a failure can happen, not just
  the clipboard.

## Unsure

- Plugin system. Not really sure what this means in the context of TabUI, just
  putting it here so that this isn't forgotten.

- Canvas-based notation rendering. Currently rendering is done via SVG, which is
  much easier to develop and debug. Canvas may improve performance, but only if
  profiling shows that drawing, not layout, is the bottleneck. Canvas output
  must be as accessible as SVG output. If added, it would work **alongside** SVG
  rendering, not replace it.

- Customizable keyboard shortcuts.
