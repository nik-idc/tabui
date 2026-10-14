# Domain Model and Terms

TabUI models and renders editable guitar tablature. Standard notation has partial
scaffolding but is not implemented.

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
