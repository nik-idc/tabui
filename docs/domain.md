# Domain Model and Terms

TabUI models and renders editable guitar tablature. Standard notation has partial
scaffolding but is not implemented yet.

## Score structure

Models are under `src/notation/model/`. This diagram shows their main
relationships:

```text
Score
  masterBars: MasterBar[]
  tracks: Track[]
    staves: Staff[]
      bars: Bar[]
        voiceBars: Record<VoiceNumber, VoiceBar | null>
          beats: Beat[]
            notes: Note[] | null
              techniques: Technique[]
```

- `VoiceNumber` is `1 | 2 | 3 | 4`. Each voice slot can be `null`.
- `Beat.notes === null` means the beat is a rest.
- `VoiceBar.isEmpty()` means `beats.length === 0`.

## Display and playback

Each notation component displays one active track at a time. Playback schedules
all tracks through separate audio buses, including muted and non-soloed tracks.
Bus gains control which tracks are audible.

See [Playback Architecture](playback.md) for scheduling and audio module details.

### Repeat sections

Repeat signs mark a section to play again.

A repeat section starts at a repeat-start sign and ends at the next repeat-end
sign, with no other repeat signs between them. A bar with both signs repeats on
its own. Nested repeats are not supported in version `0.5.0`.

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

## Terms

### Rhythm row

A visual row below a staff that contains one voice's durations, beams, and
tuplets. Bars on the same staff line share one vertical row position per
non-empty voice.

### Note transition

A guitar technique from a source note to a compatible target note. In TabUI,
the target is the immediate next beat's note on the same voice and string.

Use **note transition** instead of relation target, spanner, or slur when
describing this concept in TabUI documentation, code, tests, and issues.
