# Keyboard shortcuts and controls

This page lists every notation action with its keyboard shortcut and its mouse
control.

Letters do not need Shift unless it is shown. On macOS, use **Command** instead
of **Ctrl** for select all, copy, cut, paste, undo, and redo. Bar navigation still
uses **Ctrl**. **Alt** is **Option** on macOS.

A shortcut marked as unavailable means the action needs several keys instead of
one. Some of these will get their own shortcut in later versions.

## Contents

- [Before you start](#before-you-start)
- [Navigation and selection](#navigation-and-selection)
- [Playback](#playback)
- [Clipboard and history](#clipboard-and-history)
- [Notes and rhythm](#notes-and-rhythm)
- [Beats, bars, and staves](#beats-bars-and-staves)
- [Guitar techniques](#guitar-techniques)
- [Dialogs](#dialogs)
- [Accessibility](#accessibility)

## Before you start

- Click the notation (or use Tab to reach it) before you use shortcuts.
- In view-only mode, you can only navigate, select, copy, and play. During
  playback, only play or stop, bar navigation, loop, metronome, and playback
  pitch work. Bar navigation then moves playback.
- To select a range without dragging, click **Set selection anchor**, then
  click the beat where the range should end.
- Two digits typed within 250 ms make one fret, such as 12. To enter a fret
  without this time limit, use **Edit fret**.
- Paste puts copied beats after the cursor beat. If the cursor beat is empty or
  a rest, the copied beats replace it.
- Copy and paste work between TabUI editors, also in other browser tabs, but not
  with text from other apps.
- In Safari, Command+V may ask you to confirm with a **Paste** button,
  usually when the copied content comes from another app or site.
- On a narrow screen, TabUI switches to view-only mode. On a very narrow screen,
  it blocks interaction.

## Navigation and selection

| Action                      | Shortcut                           | Mouse control                                      |
| --------------------------- | ---------------------------------- | -------------------------------------------------- |
| Move between beats          | Left / Right arrow                 | Click a beat                                       |
| Move between strings        | Up / Down arrow                    | Click a note slot                                  |
| Move between staves         | Ctrl+Up / Ctrl+Down                | Click a note slot in the other staff               |
| Move by bar                 | Ctrl+Left / Ctrl+Right             | **Prev bar** / **Next bar**                        |
| Go to the first or last bar | Ctrl+Home / Ctrl+End               | **First bar** / **Last bar**                       |
| Select or extend by beat    | Shift+Left / Shift+Right           | Drag, or **Set selection anchor** and click a beat |
| Extend by bar               | Ctrl+Shift+Left / Ctrl+Shift+Right | Drag across bars                                   |
| Select all                  | Ctrl+A                             | **Select all**                                     |
| Cancel a beat range         | Escape                             | Click a single note                                |
| Change the active voice     | Shift+V (cycles 1 → 2 → 3 → 4)     | **Voice 1** to **Voice 4**                         |

## Playback

| Action                     | Shortcut    | Mouse control                                             |
| -------------------------- | ----------- | --------------------------------------------------------- |
| Play or stop               | Space       | **Play** / **Pause**                                      |
| Play or stop from a button | Shift+Space | **Play** / **Pause**                                      |
| Loop a range               | O           | **Set selection anchor**, then **Loop**                   |
| Metronome                  | N           | **Metronome**                                             |
| Playback pitch shift       | ] / [       | **Increase playback pitch** / **Decrease playback pitch** |

The playback pitch keys are the two keys to the right of P. TabUI uses these
physical keys on every keyboard layout, even where they type other characters.

## Clipboard and history

| Action | Shortcut               | Mouse control |
| ------ | ---------------------- | ------------- |
| Copy   | Ctrl+C                 | **Copy**      |
| Cut    | Ctrl+X                 | **Cut**       |
| Paste  | Ctrl+V                 | **Paste**     |
| Undo   | Ctrl+Z                 | **Undo**      |
| Redo   | Ctrl+Y or Ctrl+Shift+Z | **Redo**      |

## Notes and rhythm

| Action                   | Shortcut              | Mouse control                                    |
| ------------------------ | --------------------- | ------------------------------------------------ |
| Set a fret               | 0–9                   | **Edit fret**                                    |
| Clear a fret             | Backspace             | **Edit fret**, then **Clear**                    |
| Set a dead note          | X                     | **Set dead note**                                |
| Turn beats into rests    | Shift+X               | **Rest**                                         |
| Raise or lower the pitch | Shift+Up / Shift+Down | **Increase pitch** / **Decrease pitch**          |
| Shorten the duration     | -                     | Duration buttons (**1/1 note** to **1/64 note**) |
| Lengthen the duration    | + or =                | Duration buttons                                 |
| Cycle dots               | .                     | **Dot** / **Double dot**                         |
| Cycle tuplets            | T                     | **Tuplet preset** / **Triplet preset**           |
| Custom tuplet            | Shift+T               | **Custom tuplet**                                |
| Louder dynamic           | >                     | Dynamic buttons (`ppp` to `fff`)                 |
| Softer dynamic           | <                     | Dynamic buttons                                  |

Two digits typed less than 250 ms apart on the same note make one fret number,
such as 12.

## Beats, bars, and staves

| Action               | Shortcut     | Mouse control          |
| -------------------- | ------------ | ---------------------- |
| Insert a beat after  | A            | **Insert beat after**  |
| Insert a beat before | Shift+A      | **Insert beat before** |
| Remove beats         | Delete       | **Remove beat**        |
| Insert a bar after   | I            | **Insert bar after**   |
| Insert a bar before  | Shift+I      | **Insert bar before**  |
| Remove bars          | Shift+Delete | **Remove bars**        |
| Toggle repeat start  | R            | **Repeat Start**       |
| Repeat end and count | Shift+R      | **Repeat end**         |
| Tempo                | M            | **Tempo**              |
| Time signature       | Shift+M      | **Time Signature**     |
| Add a staff below    | Alt+N        | **Add staff below**    |
| Remove the staff     | Alt+Delete   | **Remove staff**       |

## Guitar techniques

| Action                      | Shortcut | Mouse control                   |
| --------------------------- | -------- | ------------------------------- |
| Tie to the previous beat    | J        | **Tie**                         |
| Tie as far back as possible | Shift+J  | **Tie as far back as possible** |
| Let Ring                    | Shift+L  | **Let Ring**                    |
| Palm Mute                   | P        | **Palm Mute**                   |
| Vibrato                     | V        | **Vibrato**                     |
| Legato                      | L        | **Legato**                      |
| Slide                       | S        | **Slide**                       |
| Natural harmonic            | H        | **Natural Harmonic**            |
| Pinch harmonic              | Shift+H  | **Pinch Harmonic**              |
| Tap                         | K        | **Tap**                         |
| Accent                      | C        | **Accent**                      |
| Heavy accent                | Shift+C  | **Heavy Accent**                |
| Bend settings               | B        | **Bend**                        |
| Down stroke                 | D        | **Stroke** dialog               |
| Up stroke                   | U        | **Stroke** dialog               |
| Stroke settings             | Shift+D  | **Stroke**                      |

See [Features](features.md#guitar-techniques) for what each technique does.

## Moving between sections

These keys work anywhere in the editor, except in dialogs.

| Action                                      | Shortcut |
| ------------------------------------------- | -------- |
| Move focus to the next section              | Alt+Down |
| Move focus to the previous section          | Alt+Up   |
| Return focus to the notation from a control | Escape   |

The sections, in order, are: playback controls, score and editing controls,
the track list (when it is open), the side panel button, each side panel
section (Fret, Duration, Beat, Voices, Techniques, Measure, and Staff), the
score details, and the notation. Focus moves to the first control of a section,
and sections with no available control are skipped. The order wraps around.

## Where am I

| Action                     | Shortcut |
| -------------------------- | -------- |
| Read where you are in full | W        |

W reads the score title and artist, the track, staff, and voice, then the bar,
beat, and note under the cursor, or the selected range. It works in the
notation, also during playback, and changes nothing.

## Dialogs

Tab and Shift+Tab move between controls. Enter or Space activates a button.
Escape closes a dialog and returns focus to the control that opened it.

## Accessibility

- Activate **Skip to notation** to jump to the notation.
- The notation is an application region named **Notation editor**. If your
  screen reader intercepts arrow keys, use its focus or interaction mode there.
- TabUI announces the current position, the selected beat and its techniques,
  dynamic changes, range changes, and changes made in dialogs.
- Announcements read only what changed. Moving to the next beat reads the beat,
  and changing a fret reads the string and fret. The staff and voice are named
  only when the track has more than one staff or the staff has more than one
  voice.
- In the track list, Up and Down Arrow move focus between tracks without
  selecting one. Enter or Space selects the focused track.
- TabUI is tested with NVDA on Windows and Orca on Linux. macOS is not tested
  yet. Please [report problems](https://github.com/nik-idc/tabui/issues) with
  your browser, screen reader, and steps.
