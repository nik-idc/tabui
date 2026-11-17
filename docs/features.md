# Features

This guide explains how TabUI's notation features behave: repeats, staves, dynamics, and
guitar techniques. These are TabUI's rules, not a claim about how other
tablature editors interpret the same marks. For what each term means, see
[Domain Model and Terms](domain.md).

## Repeat sections

Repeat signs mark a section to play again.

A repeat section starts at a repeat-start sign and ends at the next repeat-end
sign, with no other repeat signs between them. A bar with both signs repeats on
its own. Nested repeats are not supported yet.

Examples:

1. Two starts followed by two ends:

   ```text
   Bar 1: Start | Bar 2: Start | Bar 3 | Bar 4: End | Bar 5: End
   ```

   The repeat section is **Bar 2 to Bar 4**.
   The repeat signs in Bars 1 and 5 are invalid.

2. An end before a start:

   ```text
   Bar 1: End | Bar 2: Start | Bar 3
   ```

   No repeat section: Bar 1 has no start sign before it, and Bar 2 has no end sign
   after it.

3. Two separate sections:

   ```text
   Bar 1: Start | Bar 2: End | Bar 3 | Bar 4: Start | Bar 5: End
   ```

   Repeat sections are **Bar 1 to Bar 2** and **Bar 4 to Bar 5**.

With nested repeats, the first example would have an outer section from
**Bar 1 to Bar 5** and an inner section from **Bar 2 to Bar 4**.

## Staves

A track has one to four staves. Each staff has its own bars and voices, and all
staves play together. See [Domain model and terms](domain.md#staff).

- Set the number of staves when you create a track: use **Staves** in the
  **New track** dialog.
- **Add staff below** (Alt+N) adds an empty staff below the selected one and
  moves the cursor into it.
- **Remove staff** (Alt+Delete) removes the selected staff and its content. A
  track always keeps one staff. Undo brings the staff back.
- Alt+Up and Alt+Down move the cursor to the same moment in the staff above or
  below.

## Dynamics

A dynamic tells how loud a beat is played, from `ppp` (very soft) to `fff` (very
loud). Every beat has one, rests included. The default is `mf`.

A new beat takes the dynamic of the previous beat in the same voice. The search
goes back across bar lines and skips bars where the voice is absent. If there
is no previous beat, the new beat gets `mf`. Copies and pasted beats keep their
own dynamic. Rests keep a dynamic, so the next new beat can take it.

Dynamics are not drawn in tab. They change playback loudness and are saved
with the score.

### Dynamic controls

- The **Beat** section has eight dynamic buttons below the tuplet buttons.
  A click sets that dynamic on the cursor's beat or on every selected beat.
- A button shows as pressed when any selected beat has that dynamic. A
  selection with mixed dynamics shows more than one pressed button.
- **>** makes each selected beat one level louder, and **<** makes it one level
  softer. Each beat changes from its own dynamic. The change stops at `fff`
  and `ppp`.
- Screen readers name a dynamic on the beat where it changes. After a button
  or shortcut, they also name the new dynamic of the active beat, such as
  “Dynamic forte”.

## Guitar techniques

### Technique controls

Select a note, beat, or beat range, then use the technique's button or
shortcut. A cursor edits one string; a beat or range selection edits eligible
slots in musical order. Compatibility is checked per note, so different strings
in a beat can use different techniques. A button shows as pressed when the
selected notes have that technique.

A shortcut removes a technique when all selected notes already have it.
Otherwise, it sets the technique on them.

| Technique | Button and shortcut                                              |
| --------- | ---------------------------------------------------------------- |
| Tie       | **Tie** or **J**; **Tie as far back as possible** or **Shift+J** |
| Let Ring  | **Let Ring** or **Shift+L**                                      |
| Palm Mute | **Palm Mute** or **P**                                           |
| Tap       | **Tap** or **K**                                                 |
| Accent    | **Accent** or **C**; **Heavy Accent** or **Shift+C**             |
| Stroke    | See [Stroke controls](#stroke-controls)                          |

### Tie

A tie continues the previous note on the same string without a new attack. The
tied notes sound as one long note.

- The tie belongs to the second note, the continuation.
- Two notes with the same fret are not tied until you add a tie.
- Inside a bar, the continuation's fret is hidden. After a bar line, it is shown.
- **Tying can overwrite.** If you tie a note with a different fret, or a rest, it
  takes the fret of the note it continues. Tying a whole beat does this on every
  string. Tying one note slot leaves the other strings alone.
- Changing the fret of any tied note changes the whole chain.
- Removing a tie keeps the fret, and the note becomes a new attack.

**J** ties to the previous beat only. **Shift+J** searches farther back, through
empty slots and the same fret, and ties everything in between. It stops at a
different fret, a dead note, or a rest.

### Let Ring

Let Ring lets a string keep ringing. Unlike a tie, later notes on the string are
still new attacks.

- A passage can continue over empty slots marked with Let Ring, also across bar
  lines. Each marked empty slot must connect back to a played note.
- The last marked slot rings for its own length only. Nothing rings after it.
- A new note on the same string in **any** voice stops the ringing. A rest stops
  it only in its own voice.
- Let Ring on any note of a tied chain applies to the whole chain.

When you edit inside a passage:

- An inserted empty beat between two marked beats joins the passage. An inserted
  rest breaks it.
- Clearing a mark also clears the marked empty slots that depended on it.

### Palm Mute

Palm Mute damps the string with the picking hand, for a short, muted attack.

- Each note needs its own mark. It does not spread to later notes.
- Palm Mute works on dead notes too.
- A note cannot have both Palm Mute and Let Ring. Different strings in one beat
  can use them separately.

In tab, a passage of Let Ring or Palm Mute starts with `L.R.` or `P.M.` and
continues with dashes. The text starts again after a gap or a line break.

### Bends

A bend raises the pitch by pushing the string. The written fret does not change.
An open string cannot be bent.

- Amounts are in whole tones: `½` is one semitone, and `1` is two semitones.
- The shapes are **Bend**, **Bend and Release**, **Prebend** (starts already
  bent), **Prebend and Release**, and **Prebend Bend**.
- **Hold** and **Release** continue a bend into a tied note. Hold keeps the bent
  pitch, and Release lowers it. Prebend shapes need a new attack, so they cannot
  be on a tied note.

### Legato (hammer-on and pull-off)

Legato connects a note to the next beat's note on the same string and voice. The
next note must be played (not empty or dead), and the frets must differ. Open
strings work on both sides.

Playback plays the marked note with a softer, slower attack. This is an
approximation: a real legato note is not picked.

### Slide

A slide moves from a note to the next beat's note on the same string and voice.
The next note must be played (not empty or dead), the frets must differ, and
neither note can be an open string.

The second note is not attacked again.

### Vibrato

Vibrato moves the pitch slightly up and down. It applies to one note, not to the
whole chord.

### Natural and pinch harmonics

Playback plays **both** kinds as a softer tone one octave above the note. It does
not calculate the real harmonic pitch.

### Tap

Tap means the note is played by tapping the string onto the fret, usually with
the picking hand.

- Tap works only on played notes: not on dead notes, empty slots, or tied notes.
- Each tapped beat shows its own `T`. Taps never join into a passage with dashes.
- Playback plays a tapped note like a normal attack.

### Accent

An accent plays a note louder. A normal accent (`>`) is louder, and a heavy
accent (`^`) is much louder.

- A tied note has no attack, so it cannot have an accent or a tap. Tying a note
  removes them.
- Different strings in one beat can have different accents, but the beat shows
  one mark only. If any string has a heavy accent, the beat shows `^`.
- An accent adds to the beat's [dynamic](#dynamics). An accented note in a `p`
  beat is still softer than an accented note in an `f` beat.
- When a note becomes a dead note, it keeps only Palm Mute and Accent. Other
  techniques are removed.

### Stroke

A stroke strums the notes of a beat one after another. It belongs to the whole
beat, so a rest cannot have one.

- **The arrow points the other way.** String 1 is the top line of the tab, and
  the arrow points toward the last string played. So a down stroke points
  **up**, and an up stroke points **down**.
- TabUI strums in string order, not by pitch. Re-entrant tunings sound like on
  the real instrument.
- **Duration** is the time from the first to the last note, from a 64th note to a
  half note. **Alignment** sets whether the stroke **starts on time** (the
  default) or **falls on time**, which means the last note lands on the beat.
- The stroke spreads over at most half of the beat. A long stroke on a short beat
  is shortened.
- A "falls on time" stroke on the first played beat, or on the first beat of a
  loop, sounds late. A stroke never starts before playback starts.
- Tied notes and slide targets are not part of the stroke. Dead notes are.
- If two voices have a stroke at the same time, the arrows overlap.

#### Stroke controls

- **D** toggles a down stroke, and **U** toggles an up stroke. A new stroke is a
  16th note long and starts on time.
- **Stroke** or **Shift+D** opens a dialog with direction, duration, and timing.
  The timing slider reads like a timeline: the left end is "falls on time", and
  the right end is "starts on time". The sliders work with the arrow keys, Page
  Up, Page Down, Home, and End.
