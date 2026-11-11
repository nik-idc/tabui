# Guitar techniques

This guide explains how TabUI interprets guitar techniques. These are TabUI's
rules, not a claim about how other tablature editors interpret the same marks.
For controls and selection, see [Using TabUI](usage.md#ties-and-let-ring).

## Tie

A Tie means “continue this note without another attack.” It joins the immediate
previous beat's note on the same staff, voice, string, and fret, including across
adjacent bars. The Tie belongs to the continuation; the source needs no Tie mark.
Matching frets alone do not make a tie.

The chain sounds as one note for the exact sum of its written durations, including
dots, tuplets, and tempo changes. Within a bar, the continuation fret is hidden;
across a bar boundary, it is shown. Tie curves continue across wrapped lines, and
rhythm notation stays visible.

### Applying and removing ties

The Tie button and **J** use only the immediately previous beat on the same
string and voice. An empty slot, dead note, rest, or missing previous beat means
nothing changes.

**Shift+J** searches farther **backward**, through empty slots and matching frets.
The earliest matching note stays an attack; later slots become continuations.
An earlier different fret, dead note, rest, or missing or empty adjacent voice
stops the search. Without a playable source, nothing changes.

The selected fret or rest can be replaced by the source fret. A whole-beat edit
replaces the selected chord, searching each string separately. A note-slot edit
preserves the other strings. Either shortcut removes ties when all selected
playable notes already have them. Removing an incoming Tie keeps the fret and makes
that note a new attack. Setting a playable fret updates every member of its
connected valid tie chain and preserves the ties. Clearing or setting a dead fret
keeps the ordinary tie cleanup behavior.

## Let Ring

Let Ring means “let this string keep resonating.” Unlike Tie, it does not turn
later fretted notes into continuations. Unless tied, each later playable note is
a new attack.

A passage starts on a playable marked note and can continue through consecutive
marked empty slots on the same string and voice, including across adjacent bars.
Every empty marker needs an uninterrupted marked path back to a playable source.
An empty marker has no fret and makes no attack. Starting playback inside one is
silent.

The last marked slot contributes its **full written duration**. There is no
implicit extra beat after it. A rest in the owning voice, dead note, unmarked
slot, or missing or empty adjacent voice ends the passage. A rest in another
voice does not. A new same-string attack in **any voice on the staff** cuts off
earlier resonance; a tied continuation is not a new attack. Resonance also stops
at the playback end.

A tied chain is one logical note: Let Ring on any member applies to the chain,
even when playback starts at a tied continuation. Let Ring can extend that chain,
but does not shorten its written Tie duration. For bent notes, the extra resonance
holds the final bend pitch rather than slowing down the bend.

### Keeping passages connected while editing

- Clearing a source or middle marker clears following unsupported empty markers,
  but keeps the next playable marked note and its independent passage.
- Clearing an attack keeps its empty Let Ring marker only if an earlier marked
  source still supports it. Voices stay independent.
- A blank beat inserted between marked neighbors inherits Let Ring on those
  strings. Inserted rests break the passage; default rest bars remain rests.
- Paste keeps copied markings; unmarked pasted content does not inherit Let Ring
  and can break a passage. Deletion joins surviving boundaries and removes
  unsupported empty markers.
- Changing a playable fret keeps its Let Ring marking. Undo and redo restore the
  complete edit.

## Palm Mute

Palm Mute means a damped, short, softer attack, not a fully dead note. It applies
to playable notes and dead notes, but never empty slots or rests. A dead note can
also have Palm Mute.

Each note needs its own Palm Mute mark. It does not spread from a source to later
notes or to inserted empty slots. Changing a playable fret keeps the marking.
Palm Mute and Let Ring cannot share one note, but different strings in the same
beat can use them separately.

### Let Ring and Palm Mute labels

The two techniques use separate rows. A passage starts with `L.R.` or `P.M.` text;
consecutive markings continue with dashes. Text restarts after a gap or a wrapped
line. These labels show markings, not a Tie or a promise of another attack.
For editing these markings, see the [technique controls](usage.md#ties-and-let-ring).

## Bends

A bend changes sounding pitch without changing the written base fret. Pitch
amounts are offsets in whole tones: `½` is one semitone and `1` is two semitones.
The bend duration sets the part of the note used for the pitch motion.

- **Bend** raises the pitch; **Bend and Release** raises it, then returns toward
  the chosen release pitch.
- **Prebend** starts already bent. **Prebend and Release** lowers that starting
  pitch; **Prebend Bend** moves from the prebent pitch to the chosen bend pitch.
- **Hold** and **Release** continue a previous bend through a Tie. Hold keeps the
  inherited bent pitch; Release lowers it toward the chosen release pitch.

For example, bend a note up one tone, tie the next note at the same base fret,
then use Hold or Release on that continuation. No second attack is added. Each
tied note keeps its own written bend timing. A continuation can bend further from
its inherited pitch; prebend shapes instead need a new attack and cannot share
an incoming Tie.

## Legato (Hammer-on/Pull-off)

Legato indicates a fret-hand transition rather than a normal picked change.
TabUI connects the marked note to the immediate next beat's same-string slot in
the same staff and voice, including across an adjacent bar. The frets must differ;
it does not search ahead past a rest or a missing voice.

Playback uses a softer, slightly slower new attack for the marked note. This is
an approximation of the articulation, not the attack-free continuation of a Tie.

## Slide

Slide indicates movement from the marked fret to the next beat's same-string
slot in the same staff and voice. The frets must differ, and the source cannot
be an open string. It does not search past empty slots or rests for a destination.

With a playable destination, playback moves toward its pitch and continues
through its duration without a separate target attack. An empty or dead target
does not produce that pitch transition. This is a two-note slide, not a slide
across an arbitrary range of beats.

## Vibrato

Vibrato varies a note's pitch around its starting pitch. It belongs to the marked
note, not to the whole chord or a whammy-bar passage. It does not extend the note's
duration.

## Natural and Pinch Harmonics

These marks indicate harmonic articulation rather than an ordinary fretted tone.
TabUI's current playback approximates **both** with a softer tone one octave above
the note's base pitch. It does not calculate a natural harmonic's pitch from a
touch position or reproduce the full range of pinch-harmonic partials.

## Tap

Tap means the note is played by tapping the string onto the fret, usually with
the picking hand. It applies to playable notes only, not to dead notes, empty
slots, rests, or tie continuations. Each note needs its own Tap mark. When a
note becomes a dead note, its Tap mark is removed.

In tab, each tapped beat shows its own `T` above the staff. Unlike `P.M.` and
`L.R.`, consecutive taps never join into a passage with dashes. Playback plays
a tapped note like a normal attack.

## Accent

An Accent means “play this attack louder.” It has two kinds: a normal accent
(`>`) and a heavy accent (`^`), which means “play it much louder.” An Accent
applies to playable notes and dead notes, but never to empty slots, rests, or
tie continuations. A note has at most one Accent. Different strings in the same
beat can use different kinds.

The two kinds toggle like stroke directions. **C** (normal) or **Shift+C**
(heavy) removes the accents when all selected notes that can have one already
have that kind. Otherwise, it sets that kind on them, so it also changes the
other kind directly.

A tie continuation has no attack, so it cannot have Tap or Accent. When you tie
a note, these marks are removed from the continuation.

In tab, the mark shows above the beat, in one row. A beat shows one mark only.
If one string has a normal accent and another has a heavy accent, the beat
shows `^`. Playback makes each marked attack louder; see
[Playback Architecture](playback.md) for the amounts. An Accent adds to the
beat's [dynamic](domain.md#beat-dynamic): an accented note in a `p` beat is
still softer than an accented note in an `f` beat.

When a note becomes a dead note, it keeps only Palm Mute and Accent. Other
marks, such as Tap or Vibrato, are removed.

## Stroke

A Stroke means “strum the notes of this beat one after another, not together.”
It belongs to the whole beat, not to one note, so a rest cannot have one. For
the controls, see [strokes in the usage guide](usage.md#strokes).

- **Direction**: a **down** stroke starts on the highest string number (usually
  the lowest string) and moves toward string 1. An **up** stroke moves from
  string 1 toward the highest string number. TabUI follows string order, not
  pitch, so re-entrant tunings strum like the real instrument.
- **Duration**: the time from the first to the last note of the stroke. It can
  be any length from a 64th note to a half note, and it follows the bar tempo.
- **Alignment**: when the stroke sounds compared to the beat time. **Starts on
  time** (the default) plays the first string on the beat. **Falls on time**
  plays the last string on the beat, so the stroke starts early. Values between
  them move that percent of the stroke before the beat.

In tab, a stroke shows as a vertical arrow at the left of the beat, across all
strings. The arrow points toward the last string played. String 1 is the top
line, so a down stroke points **up**, and an up stroke points **down**. The tab
does not show the duration or alignment.

Known limit: when two voices have a stroke at the same beat time, the arrows
draw on top of each other.

Playback limits:

- Only notes that attack take part: empty slots, slide targets, and tie
  continuations are skipped. Dead notes take part.
- The stroke spread is at most half of the beat, so a long stroke on a short
  beat is shortened.
- A stroke never starts before playback starts. A “falls on time” stroke on the
  first played beat, or on the first beat of a loop, sounds late.

See [Playback Architecture](playback.md) for the scheduling details.
