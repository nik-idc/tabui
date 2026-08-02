# Roadmap

This document tracks the current plan for moving TabUI toward version `0.5.0`
and, later, `1.0.0`.

## Versioning and Compatibility

Any and all compatibility is allowed to break before version `1.0.0`.

Version `0.5.0` is not intended to be a stable API milestone. It is a viable
checkpoint where a demo-able MVP is possible via integration of TabUI into a
web client, with the planned React.js client as the first target integration.

## Current Baseline

The refactor and optimization work from `tu-69-refactor-and-optimization` has
been merged into `master` and serves as the current baseline for the roadmap
below.

This means the next work should focus less on broad refactoring for its own
sake and more on targeted changes that directly unlock the MVP.

## Road to 0.5.0

### Progress Snapshot

- Phase 0 is complete.
- Phase 1 is complete.
- Phase 2 is complete.
- Phase 3 is complete.
- Phase 4 is complete.
- Phase 5 is complete.
- Current focus should move to Phase 6 stabilization for `0.5.0`.
- Phase 6 Stages 0-2 are complete. Stage 3 core correctness is in progress; its
  playback/cursor and playback-time editing-lock slices are complete.
- Phase 0 follow-ups that are intentionally deferred are listed under Phase 0.

### Phase 0 - Foundation

**Status: complete.**

- Fix known correctness issues in core model, controller, and rendering paths.
- Add a minimal automated test foundation for the model and element layers.
- Create a small set of representative score fixtures, including larger scores
  and rhythmically tricky cases.
- Add at least one repeatable large-score benchmark scenario.

Completed in Phase 0:

- Correctness fixes were applied across model/controller/command paths, including
  undo/redo behavior and structural selection sync.
- Renderer stale-state regressions were addressed in targeted paths needed for
  current editing flows.
- Active automated tests now exist in `tests/model/` and `tests/controller/`
  and run via `npm test`.
- At the 2026-07-22 Phase 6 checkpoint, the active suite covers 60 suites / 435
  tests. Earlier Phase 0 counts are historical baseline measurements.
- Repeatable fixture routing is in place via `fixture=empty`,
  `fixture=feature_showcase`, and `fixture=performance_stress`.

Exit criteria:

- A small but real test suite exists and runs reliably.
- Core regression-prone areas have basic coverage.
- There is a repeatable benchmark scenario for performance comparisons.

Phase 0 intentionally deferred follow-ups:

- Broad geometry naming refactor (`rect` -> `boundingBox`/`bounds`) due to high
  blast radius.
- Larger architecture redesigns beyond targeted boundary cleanup.
- Legacy/deprecated-area build issues outside the active notation/controller
  stabilization surface.

### Phase 1 - Tick-Based Timing Model

**Status: complete.**

- Introduce ticks as the canonical timing representation.
- Refactor duration-related logic to derive from ticks.
- Use ticks to simplify reasoning around tuplets, spacing, and playback timing.
- Prefer clean model changes over preserving old internal compatibility.

Completed in Phase 1:

- Model timing now uses ticks as the canonical representation for beats and bars.
- Dots and tuplets are derived through the tick-based timing model instead of
  ad hoc fractional duration handling.
- Bar fit/playability, beaming, and related timing-sensitive model logic were
  updated to operate on ticks.
- Score playback was rewritten around the tick-based model and now uses Web
  Audio instead of Tone.js.
- Playback now honors repeats, current-start position, and bounded looping,
  with active-track cursor updates restored.

Exit criteria:

- Beats and bars can be reasoned about in ticks.
- Dots and tuplets map cleanly into the timing model.
- Playback scheduling no longer relies on fragile ad hoc duration handling.

### Phase 2 - Targeted Architecture Cleanup

**Status: complete.**

- Clean up naming, ownership boundaries, and responsibilities where they block
  the upcoming notation, playback, or timing work.
- Revisit techniques and labels handling where needed.
- Reduce especially confusing hotspots in core music-related logic.

Completed in Phase 2:

- Changed "rect" to "boundingBox" to better reflect its purpose
- Added customizable theming & styling via a config object passed in root TabUIEditor.
  Also implemented 4 default themes: dark - midnight & obsidian, light - default & paper
- Refactored UI components: now use helper component assemblers and asset setters
- Updated technique element & technique label element: now uses SVG descriptors instead
  of returning full SVG elements inside a string
- Improved TrackController's API
- Global dead code & stale comments cleanup

Exit criteria:

- The main model and element responsibilities are clearer.
- Notation-style-specific logic has cleaner boundaries.
- The most problematic architecture bottlenecks for upcoming work are removed.

### Phase 3 - Incremental Layout and Renderer Performance

**Status: complete.**

- Optimize large-score updates so localized changes do not trigger excessive
  rebuild, layout, or rendering work.
- Redesign the Element and Renderer layers around track-line-local coordinates
  and per-line rendering ownership so vertical shifts become cheap.
- Measure before and after using the same fixtures and benchmark scenarios.
- Preserve correctness while pushing for much better responsiveness.

Phase 3 split:

- 3.1 Stable element identity and renderer contract cleanup. Completed.
- 3.2 Line-local coordinate model in the Element layer. Completed.
- 3.3 Renderer restructuring around per-line embedded layers. Completed.
- 3.4 Incremental vertical update propagation using line-local layout and
  per-line renderer movement. Completed.
- 3.5 Width-affecting update propagation and regrouping-safe rebuilds.
  Completed.
- 3.6 Measurement, benchmarks, and viewport refinement. Completed.

Completed in Phase 3:

- Width-affecting incremental updates are now in place for contiguous duration,
  dots, tuplets, beat insertion/removal, bar insertion/removal, repeat changes,
  and time-signature changes.
- Vertical incremental updates are in place for tempo visibility and labeled
  technique updates.
- Targeted updates are in place for note-local changes and inline non-label
  techniques.
- Renderer reconciliation now uses stable element identity and consumes scoped
  `ElementDiff` output from `TrackElement`.
- Presentation-shell ownership is the active architecture: `TrackElement`
  orchestrates grouping/update/diff/registries while line/staff/style/bar shells
  own descendant creation and lifetime.
- Beat and bar insert/remove controls were added, including active beat selection
  flows and plural bar removal.
- Paste/replacement behavior was stabilized while intentionally keeping the
  current permissive no-rest model.
- Large-score editing is now practically responsive on the dense performance
  stress fixture used during Phase 3 work.

Benchmark status:

- General full-vs-focused update benchmark is available via
  `npm run benchmark:updates`.
- The benchmark uses a 1000-bar dense guitar score with 32 thirty-second notes per
  bar and covers dots, tuplets, beat/bar insertion and removal, time signatures,
  tempo, repeats, inline techniques, and labeled techniques.
- Current results show strong focused-update wins for the intended localized
  cases, including inline technique application after targeted-update fixes.
- Known anomaly: multiple bar insertion is unexpectedly close to full-update cost
  even for a small two-bar benchmark case. Treat this as a likely bug/performance
  defect to investigate later rather than as expected batch-size behavior. It is
  not blocking Phase 3 closeout because current user-facing empty-bar insertion
  workflows insert one bar at a time, and multi-bar removal remains fast in the
  stress fixture.

Exit criteria:

- Large-score edits are noticeably faster and instant for the user.
- Small localized changes avoid unnecessary full-tree work where possible.
- Vertical line shifts do not require child-by-child renderer updates across
  the affected suffix of the score.
- Performance improvements are validated against repeatable scenarios.

### Phase 4 - Notation Expansion Evaluation

**Status: complete.**

- Evaluate whether sheet notation should be implemented before `0.5.0`.
- Validate whether the current model and element architecture can support it
  cleanly.
- Expand the model where sheet notation exposes tablature-era shortcuts.
- Assess whether drum notation can share the same foundation without creating
  disproportionate complexity.
- Treat non-tablature notation viewing as the minimum acceptable `0.5.0`
  outcome if full editing support proves too costly.

Completed in Phase 4:

- Introduced multi-voice score structure through sparse voice bars:
  `Bar -> VoiceBar[1..4] -> Beat[]`.
- Added explicit rests using `Beat.notes === null`, with rest-aware editing,
  rendering, selection, playback, and command behavior.
- Reworked core bar/beat insertion, removal, replacement, and selection flows
  around voices and rests.
- Performed a major Element/Renderer architecture overhaul around
  `TrackElement` and `EditorSVGRenderer`.
- Replaced eager command update-type semantics with model-anchor-based affected
  models and lazy viewport-oriented Element layer updates.
- Refactored `TrackElement` around whole-track skeleton ownership and
  materialized visible line ranges.
- Refactored `EditorSVGRenderer` reconciliation around retained visible line
  containers, stable element identity, offscreen detach, and materialized-line
  rendering.
- Expanded multi-voice and rest fixtures for manual and automated coverage.
- Completed a large test refactor, including broad test updates for the new
  voices/rests model and stronger type safety across the `tests/` folder.
- Audited sheet-notation feasibility and decided to postpone sheet notation
  beyond `0.5.0` rather than make it a release blocker.

Phase 4 decision:

- The model now has the main primitives that sheet notation will need: pitch,
  duration ticks, dots, tuplets, rests, voices, and beaming metadata.
- The sheet presentation layer is still mostly unimplemented, so credible sheet
  notation viewing is achievable but not a safe `0.5.0` commitment.
- Sheet notation remains strategically valuable and should be revisited after
  the tablature-focused MVP is shipped or substantially stabilized.

Exit criteria:

- Voices and rests work end to end in the active tablature editor.
- The model supports the main primitives needed for future sheet notation
  without relying on the previous permissive no-rest model.
- A clear decision has been made to postpone sheet notation and keep `0.5.0`
  focused on a stable tablature-oriented MVP.

### Phase 5 - Playback Overhaul

**Status: complete.**

- Improve score playback so all tracks can play together.
- Add optional focus on the current track within the overall mix.
- Improve instrument variety and audio quality incrementally.

Completed in Phase 5:

- Reworked playback around Web Audio scheduling with rolling lookahead.
- Added URL-configured sample playback keyed by instrument tone, with oscillator
  fallback when samples are missing or fail to load.
- Added local demo samples for clean/overdriven/distorted electric guitar, bass,
  nylon acoustic guitar, and steel acoustic guitar.
- Added per-track audio buses and real-time volume, mute, solo, and pan controls.
- Tracks are all scheduled during playback so buffered mute/solo changes remain
  reversible.
- Added track-row playback controls and inline track naming UI.
- Added tone-specific oscillator fallback profiles for distinct no-sample timbres.
- Added first-pass guitar technique playback shaping for bends, palm mutes,
  let-ring, natural/pinch harmonics, hammer-on/pull-off, vibrato, and slides.
- Slide playback now treats the source and target notes as one continuous
  scheduled source when a playable same-string target exists.
- Added playback regression tests for samples, multi-track scheduling, track
  controls, repeats/selection playback, tracks/staves/voices added or removed
  after audio context creation, and technique playback behavior.

Phase 5 closeout note:

- Playback is now substantially better than the previous baseline and good
  enough for MVP feedback, but it remains rudimentary compared to mature guitar
  notation/audio tools. Future versions should aim for more realistic audio,
  including multisampling, velocity layers, richer articulations, and more
  instrument-specific playback modeling.

Exit criteria:

- Multi-track playback works reliably.
- Current-track emphasis is controllable.
- There are at least a few distinct and usable playback timbres.

### Phase 6 - MVP Stabilization for 0.5.0

**Status: in progress.**

Completed so far:

- Established the release baseline and repaired the update benchmark.
- Defined and validated the package/consumer contract.
- Added lifecycle disposal, focused keyboard ownership, independent instance
  dimensions, and multi-instance regression coverage.
- Hardened playback controls, bounded ranges, repeats, loops, lookahead failure
  handling, cursor synchronization, viewport following, and stale-event scoping.
- Disabled editing mutations and editing UI while playback is active while
  preserving copy, transport, track selection, and track mix controls.
- Completed bend/dialog safety and the instance-scoped host state, event, error,
  and explicit layout-refresh API.
- Closed the P0 gate with automated validation, desktop Chrome/Firefox smoke
  testing, and fixes for retained tempo/meter text and inserted-note ownership.

Next P1 work:

- Define versioned score serialization and validated deserialization with fixture
  round trips and explicit validation errors.

See `PHASE-6-ROADMAP.md` for current status, remaining work, and release gates.

- Fix high-value bugs discovered in previous phases.
- Expand tests around the most failure-prone model and element paths.
- Review the integration surface needed by host frontend applications, with the
  React.js client as the first concrete consumer.
- Tighten documentation and release readiness for the MVP checkpoint.

Exit criteria:

- TabUI is usable as the editor core in a web client demo.
- Core editing, rendering, and playback flows are dependable enough for MVP
  usage.
- The scope and expectations of `0.5.0` are documented clearly.

## Integration Checkpoints

- TabUI can mount into a provided host DOM element and cleanly manage its own
  lifecycle.
- TabUI model and editor APIs are usable from framework-agnostic frontend
  environments, with React.js as the first target integration.
- Playback and state-change events are stable enough for host application UI
  logic.
- The project is ready to serve as the frontend editing core of the broader
  product stack.

## Things That May Be Deferred

- Sheet and drum notation are deferred until after the tablature-focused `0.5.0`
  milestone.
- Audio realism is secondary to getting reliable multi-track playback working.
- Cleanup work should stay focused on changes that directly help reach 0.5.0.
