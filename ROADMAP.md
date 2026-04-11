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
- Current focus should move to Phase 2 (targeted architecture cleanup).
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
- Active suite currently covers 18 suites / 87 tests.
- Repeatable fixture routing is in place via `fixture=empty`,
  `fixture=default`, and `fixture=selection_perf`.

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

### Phase 3 - Element Layer Performance

- Optimize large-score updates so localized changes do not trigger excessive
  rebuild, layout, or rendering work.
- Measure before and after using the same fixtures and benchmark scenarios.
- Preserve correctness while pushing for much better responsiveness.

Exit criteria:

- Large-score edits are noticeably faster.
- Small localized changes avoid unnecessary full-tree work where possible.
- Performance improvements are validated against repeatable scenarios.

### Phase 4 - Notation Expansion Evaluation

- Implement a limited but end-to-end sheet notation feature set to evaluate the
  direction.
- Validate whether the current model and element architecture can support it
  cleanly.
- Assess whether drum notation can share the same foundation without creating
  disproportionate complexity.
- Treat non-tablature notation viewing as the minimum acceptable `0.5.0`
  outcome if full editing support proves too costly.

Exit criteria:

- A limited but convincing sheet-notation implementation works end to end.
- A clear decision is made on whether to continue, narrow, or postpone broader
  notation expansion.

### Phase 5 - Playback Overhaul

- Improve score playback so all tracks can play together.
- Add optional focus on the current track within the overall mix.
- Improve instrument variety and audio quality incrementally.

Exit criteria:

- Multi-track playback works reliably.
- Current-track emphasis is controllable.
- There are at least a few distinct and usable playback timbres.

### Phase 6 - MVP Stabilization for 0.5.0

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

- If needed, full classical notation support can be postponed after an initial usable implementation.
- Drum notation should only proceed if it fits naturally into the same notation architecture.
- Audio realism is secondary to getting reliable multi-track playback working.
- Cleanup work should stay focused on changes that directly help reach 0.5.0.
