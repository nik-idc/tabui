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
  - attack ramps to a technique/profile-adjusted peak gain.
  - release ramps back to `0`.
- Each track has a persistent audio bus:
  `note source -> note gain -> track gain -> track panner -> destination`.
- Track volume/mute/solo controls update the track bus gain.
- Track pan updates the track bus `StereoPannerNode`.
- Tone profiles can adjust fallback oscillator type, note gain, attack, and
  release.
- Technique playback uses Web Audio pitch/envelope automation over the same
  oscillator or sample source.

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
  - Applies tone-profile, context, and technique shaping for note playback.

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

If no sample is configured or loaded for a note's instrument tone, playback uses
an `OscillatorNode`:

- oscillator type comes from the tone profile:
  - default and clean electric: `sine`.
  - bass/acoustic fallback tones: `triangle`.
  - overdrive/distortion fallback tones: `sawtooth`.
- frequency is calculated directly from the note pitch.
- attack/release/gain can vary by tone profile.
- no network or decoding is required.

If a sample is configured, playback uses an `AudioBufferSourceNode`:

- sample files are fetched and decoded before scheduling.
- one configured sample represents one recorded root pitch.
- other pitches are produced by setting `playbackRate` to
  `noteFrequency / rootFrequency`.
- this is single-sample pitch shifting, not multisampling.

## Technique Playback

Technique playback is currently implemented as Web Audio shaping over the same
scheduled note source rather than articulation-specific samples.

- Bends automate the source pitch according to bend options.
- Palm mutes shorten and soften the note envelope.
- Let-ring extends the note release.
- Natural and pinch harmonics shift playback to the first octave partial and use
  a softer envelope.
- Hammer-on/pull-off uses a softer, slightly slower legato-style attack.
- Vibrato modulates pitch around the target pitch.
- Slides pair the source note with the next playable same-string target note:
  - the source is scheduled through the target note's duration.
  - pitch ramps from source pitch to target pitch.
  - the target note is skipped as a separate source only when it is a playable
    slide target.

Technique shaping is intentionally lightweight. It improves playback feedback
without requiring multisampling, velocity layers, or technique-specific samples.

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
- Downbeat notes receive a small gain accent and repeated same-string/same-pitch
  notes are softened slightly to reduce mechanical playback.
- Current sample playback still uses one sample per configured tone. It does not
  support multisampling, velocity layers, or articulation-specific samples yet.
