# Domain Model and Terms

This page explains the concepts TabUI uses to describe music. It is written for
readers with some musical knowledge who do not know the code. For how these
concepts behave in TabUI, see [Features](features.md).

TabUI models and renders editable guitar tablature. Standard notation has partial
scaffolding but is not implemented yet.

## Score structure

```text
Score
├── Master bars: tempo, time signature, and repeat signs
└── Tracks: one per instrument part
    └── Staves: usually one per track
        └── Bars: one per master bar
            └── Voices: 1 to 4 per bar
                └── Beats: a rest, or one note slot per string
                    └── Notes
```

### Score

A score is one whole piece of music, for example a song. It has a name and an
artist, and can have an album and a release date. A release date is a year, a
month, or a day: `2024`, `2024-05`, or `2024-05-17`.

### Master bar

All tracks in a score share the same bar structure. A master bar holds the
score-wide information for one bar position:

- Tempo
- Time signature
- Repeat signs

### Track

A track is one instrument's part in the score, for example rhythm guitar, lead
guitar, or bass guitar.

### Staff

A staff is one line of notation inside a track. Most tracks have one staff. The
classic example is the piano, which uses two staves, usually one for each hand.

### Bar

A bar is one staff's content for one master bar. It holds up to four voices.

### Voice

A voice is an independent rhythmic line on one staff, played by the same player
at the same time as the other voices. Each voice fills the bar with its own
rhythm. For example, in fingerstyle guitar, a bass note can ring for a half note
in one voice while the melody moves in eighth notes in another voice.

A bar has up to four voices and always keeps at least one.

### Beat

A beat is a point in a voice where notes start together, last the same time, and
share rhythmic modifiers (dots and tuplets).

A beat is either a **rest**, which is written silence, or a set of **note
slots**, one per string. Slots can be empty, so a beat can hold no notes, one
note, or a chord.

### Note

A note is one string's slot in a beat: a fret number, a dead note (`x`), or
empty.

### Dynamic

A dynamic tells how loud a beat is played, from `ppp` (very soft) to `fff` (very
loud). Every beat has one, rests included. The default is `mf`. Dynamics are not
drawn in tab. They change playback loudness.

### Rhythm row

A visual row below a staff that contains one voice's durations, beams, and
tuplets. Bars on the same staff line share one vertical row position per
non-empty voice.

The rhythm row applies only to tablature. Sheet notation shows rhythm on the
notes themselves, so it does not need a rhythm row.

## Techniques

A technique tells how a note or beat is played.

- **Note techniques** belong to one note. Most techniques are note techniques.
- **Beat techniques** belong to a whole beat. Stroke is currently the only beat
  technique.

A beat/note can have at most one technique of each type.

Let Ring and Palm Mute passages are not stored as spans. Each note carries its
own mark, and TabUI draws a passage from consecutive marks. A Tie belongs to the
second note, the continuation, not to the note it continues.

### Technique list

| Technique                   | Meaning                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| Tie                         | The note continues the previous note on the same string, with no new attack. |
| Let Ring                    | The string keeps ringing after the note.                                     |
| Palm Mute                   | The picking hand damps the string, for a short, muted sound.                 |
| Bend                        | The string is pushed to raise the pitch. Prebends and releases are included. |
| Legato (hammer-on/pull-off) | The next note is played by the fretting hand alone, without picking.         |
| Slide                       | The finger slides along the string to the next note's fret.                  |
| Vibrato                     | The pitch moves slightly up and down around the note.                        |
| Natural and pinch harmonics | A high, bell-like overtone sounds instead of the normal note.                |
| Tap                         | The note is played by tapping the string onto the fret.                      |
| Accent                      | The note is played louder. A heavy accent is played much louder.             |
| Stroke                      | The notes of the beat are strummed one after another, down or up.            |

See [Features](features.md#guitar-techniques) for the rules and controls of each
technique.
