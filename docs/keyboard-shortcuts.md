# Keyboard shortcuts

This is the full set of TabUI notation shortcuts. For setup and accessibility
guidance, see the [usage guide](usage.md).

## Contents

- [Focus and availability](#focus-and-availability)
- [Navigation and selection](#navigation-and-selection)
- [Playback and clipboard](#playback-and-clipboard)
- [Notes and rhythm](#notes-and-rhythm)
- [Beats and bars](#beats-and-bars)
- [Guitar techniques](#guitar-techniques)
- [Dialogs and controls](#dialogs-and-controls)

## Focus and availability

- Editing and navigation shortcuts apply only while the **Notation editor** area has focus.
  Use Tab to reach it, or activate **Skip to notation**. They do not apply while
  typing in a form field or using a dialog.
- Use **Ctrl**, including on macOS. Command is not a substitute. Shortcuts with
  Alt or Command/Meta are ignored, as are text-composition events.
- Letters below do not require Shift unless it is shown. For example, `V` and
  `Shift+V` are different actions. Keys follow the characters produced by your
  keyboard layout.
- Navigation, range selection, copying, and playback are available in view-only
  mode. All other notation actions require editing to be enabled. Narrow layouts
  can force view-only mode or block interaction; see [responsive layout](usage.md#responsive-layout).
- While playback is active or preparing, only Space, Shift+Space, and Ctrl+C remain available
  as notation shortcuts. Stop playback before navigating or editing.
- Editing actions need a suitable note cursor or beat range. Some require a
  single note cursor, as described below. See also the
  [known no-selection limitation](usage.md#editing-with-no-selection).

## Navigation and selection

| Key                                | Action                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Left / Right arrow                 | Move the cursor between beats. From a beat range, return to a cursor at its corresponding edge. |
| Up / Down arrow                    | Move the cursor between strings.                                                                |
| Ctrl+Left / Ctrl+Right             | Move by bar boundary.                                                                           |
| Shift+Left / Shift+Right           | Extend or shrink a beat range by one beat.                                                      |
| Ctrl+Shift+Left / Ctrl+Shift+Right | Extend or shrink a beat range by bar.                                                           |
| Escape                             | Cancel a beat range and restore its anchor cursor.                                              |
| Shift+V                            | Cycle the active voice: 1 → 2 → 3 → 4 → 1. Requires edit mode.                                  |

## Playback and clipboard

| Key         | Action                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| Space       | Start playback when idle; otherwise stop playback or cancel preparation. |
| Shift+Space | Toggle playback from notation or an editor toolbar button.               |
| Ctrl+C      | Copy the selected note or beat range.                                    |
| Ctrl+V      | Paste the copied note or beats. Requires edit mode.                      |
| Ctrl+Z      | Undo. Requires edit mode.                                                |
| Ctrl+Y      | Redo. Requires edit mode.                                                |

Copy and paste use TabUI's internal clipboard, not a plain-text tablature import.

On toolbar buttons, Space toggles playback after a mouse click. After Tab or
arrow-key navigation, Space activates the focused button normally; use Shift+Space
for playback instead. Enter always keeps its normal button action. Holding a
playback shortcut does not toggle playback repeatedly.

Using a playback shortcut on a toolbar button returns focus to notation, so the
next Space can stop playback even if the button becomes disabled.

Playback shortcuts do not override text fields, selects, sliders, or dialogs.
Interactions inside a dialog do not change the toolbar's mouse/keyboard mode.

## Notes and rhythm

These actions require edit mode and stopped playback.

| Key       | Action                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 0–9       | Set the fret on the selected note slot. Two digits entered less than 250 ms apart on the same note combine into a fret number. |
| Backspace | Clear the selected note's fret, keeping its beat.                                                                              |
| X         | Set the selected guitar note to a dead note.                                                                                   |
| Shift+X   | Turn selected beats into rests.                                                                                                |
| -         | Shorten the selected beats' base duration by one step.                                                                         |
| + or =    | Lengthen the selected beats' base duration by one step.                                                                        |
| .         | Cycle duration dots: none → one → two → none.                                                                                  |
| T         | Cycle tuplets: none → duplet → triplet → none. A custom tuplet returns to none.                                                |
| Shift+T   | Open tuplet settings.                                                                                                          |

Duration steps run from sixty-fourth to whole notes. For a range, duration, dots,
and tuplet cycling use the active-end beat as the reference and apply the result
to the selected beats. Fret entry, clearing a fret, and dead-note entry use a
single note cursor.

The `+` shortcut accepts either Shift state because some keyboard layouts need
Shift to produce it. The `=` shortcut is unshifted.

## Beats and bars

These actions require edit mode and stopped playback.

| Key          | Action                                                        |
| ------------ | ------------------------------------------------------------- |
| A            | Insert a beat after the selection.                            |
| Shift+A      | Insert a beat before the selection.                           |
| Delete       | Remove selected beats.                                        |
| I            | Insert a bar after the selection.                             |
| Shift+I      | Insert a bar before the selection.                            |
| Shift+Delete | Remove selected bars.                                         |
| R            | Toggle repeat start on the cursor's bar.                      |
| Shift+R      | Open repeat-end count settings for the cursor's bar.          |
| M            | Open tempo settings for the cursor or selected bars.          |
| Shift+M      | Open time-signature settings for the cursor or selected bars. |

Repeat shortcuts require a single note cursor. Tempo and time-signature edits
apply to all bars touched by a beat range. With a cursor, they apply from that
bar up to the next existing change in the relevant setting, or the score's end.

## Guitar techniques

These actions require edit mode and stopped playback. Toggle shortcuts apply to
eligible notes in the selection; technique rules can prevent an action on an
incompatible or empty note.

| Key     | Action                                                  |
| ------- | ------------------------------------------------------- |
| V       | Toggle vibrato.                                         |
| P       | Toggle palm mute.                                       |
| L       | Toggle legato.                                          |
| J       | Tie to the previous beat, or remove selected ties.      |
| Shift+J | Tie to the earliest source, or remove selected ties.    |
| Shift+L | Toggle let ring.                                        |
| S       | Toggle slide.                                           |
| H       | Toggle natural harmonic.                                |
| Shift+H | Toggle pinch harmonic.                                  |
| B       | Open bend settings for a single eligible selected note. |

See [Ties and Let Ring](usage.md#ties-and-let-ring) for selection and controls,
and [Guitar techniques](techniques.md) for musical meaning and applicability.

## Dialogs and controls

Tab and Shift+Tab move between controls. Buttons support normal keyboard
activation with Enter or Space. Open dialogs keep focus within their controls;
Escape closes a dialog and returns focus to its opener. Notation editing
shortcuts do not run inside dialogs.

For screen-reader interaction modes and announcements, see
[accessibility](usage.md#accessibility).
