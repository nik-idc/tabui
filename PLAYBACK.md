# Playback Architecture

TabUI playback uses the Web Audio API directly. Playback is deliberately small
and scheduling-oriented: score traversal decides what should play, then Web
Audio nodes are scheduled on the audio context timeline.

## Web Audio Basics

- `AudioContext.currentTime` is a continuously increasing clock in seconds.
- Nodes can be scheduled ahead of time with absolute audio-context times.
- TabUI keeps a small lookahead buffer and schedules notes before they are heard.
- Note sources are one-shot nodes:
  - `OscillatorNode` for fallback synthesized tones.
  - `AudioBufferSourceNode` for configured samples.
- Each note has a short envelope `GainNode` to avoid clicks:
  - gain starts at `0`.
  - attack ramps to `0.06`.
  - release ramps back to `0`.
- Each track has a persistent audio bus:
  `note source -> note gain -> track gain -> track panner -> destination`.
- Track volume/mute/solo controls update the track bus gain.
- Track pan updates the track bus `StereoPannerNode`.

## Module Roles

- `ScorePlayer`
  - Owns transport state: start, stop, dispose, loop toggles, and UI events.
  - Lazily creates `AudioContext` on playback start.
  - Runs the rolling lookahead timer.
  - Converts scheduler results into playback cursor UI timeouts.

- `PlaybackScheduler`
  - Owns score-material scheduling state.
  - Owns `PlaybackTraversalManager`, `PlaybackSampleManager`, and
    `PlaybackNoteScheduler`.
  - Tracks scheduled audio nodes so they can be stopped/disconnected.
  - Owns per-track audio buses for real-time volume/mute/solo/pan.
  - Schedules all tracks, even muted or non-soloed tracks, so controls remain
    reversible while audio is already buffered.

- `PlaybackTraversalManager`
  - Decides which master bar should be scheduled next.
  - Handles playback start/end boundaries, repeats, and loop sections.
  - Converts master-bar positions into timing offsets used by the scheduler.

- `PlaybackSampleManager`
  - Loads configured samples by instrument preset.
  - Caches decoded `AudioBuffer`s and in-flight loads.
  - Provides each sample's configured root frequency.

- `PlaybackNoteScheduler`
  - Creates the source node for one note.
  - Connects it through a note envelope into the owning track bus.
  - Starts/stops the source at absolute audio-context times.

## Lookahead

`ScorePlayer` schedules playback in rolling windows instead of scheduling the
entire score at once.

- `LOOKAHEAD_SECONDS` controls how far ahead score material is buffered.
- `LOOKAHEAD_INTERVAL_MS` controls how often more material is scheduled.
- On each tick, `ScorePlayer` computes elapsed playback seconds from
  `AudioContext.currentTime` and asks `PlaybackScheduler` to schedule up to the
  target point.
- Scheduler returns beat-change events with exact audio start times.
- `ScorePlayer` maps those times to `setTimeout` calls for the visual cursor.

## Traversal

Playback is scheduled by master bar because all tracks share master bars.

- A playback run starts at a selected beat or the score start.
- Optional end boundaries come from loop/selection playback.
- Repeats are expanded during traversal.
- Repeats that are not fully inside the active selection are ignored for bounded
  selection playback.
- Bar-local beat offsets are converted from ticks to seconds using the current
  bar tempo.

## Oscillators vs Samples

If no sample is configured or loaded for a note's instrument preset, playback
uses an `OscillatorNode`:

- oscillator type is currently `sine`.
- frequency is calculated directly from the note pitch.
- no network or decoding is required.

If a sample is configured, playback uses an `AudioBufferSourceNode`:

- sample files are fetched and decoded before scheduling.
- one configured sample represents one recorded root pitch.
- other pitches are produced by setting `playbackRate` to
  `noteFrequency / rootFrequency`.
- this is single-sample pitch shifting, not multisampling.

## Non-Obvious Details

- `AudioContext` is lazy because browsers commonly require audio startup after a
  user gesture.
- `PlaybackScheduler` can exist before audio context initialization; audio-backed
  helpers are created by `setAudioContext`.
- Track audio buses are lazily created for tracks added after the audio context
  already exists.
- Muted/non-soloed tracks are still scheduled with their track bus gain at `0`.
  This prevents lookahead-buffered notes from being permanently missing if the
  user changes mute/solo before those notes play.
- Scheduled source nodes are one-shot. Stopping playback stops pending sources
  and disconnects note envelope nodes.
