# Pre-Release Stabilization Inbox

Phase 6 is the final `0.5.0` stabilization phase: release blockers first, then
required persistence/layout/embedding quality, followed by release validation.

The ordered source of truth is `PHASE-6-ROADMAP.md`. This file remains the broad
issue inbox; classify new findings here before they expand release scope.

## P0 - Release Blockers

- None. P0 closeout was accepted on 2026-08-01.

## Completed P0

- Package artifact and external-consumer contract.
- Editor disposal, listener ownership, focused keyboard input, independent
  instance dimensions, and multi-instance lifecycle behavior.
- Drag-selection visual bounds/hitbox fixes and cross-voice anchoring safety.
- Loop and traversal controls, bounded playback, repeats, selection ranges,
  buffered loop toggles, and scheduling failure cleanup.
- Click-to-seek without edit selection during playback.
- Audio-clock cursor interpolation, viewport following, lazy line
  materialization, and stale player/run event isolation.
- Playback-time editing locks in the UI, callbacks, keyboard layer, and
  `TrackController`. Copy, transport, active-track selection, and mix controls
  remain available.
- Score-wide master volume/pan state and a distinct master audio bus, including
  live changes to buffered playback.
- Playback-preserving active-track switching through one player owned by the
  mounted notation component, with cursor retargeting and replacement lifecycle
  coverage.
- Skeleton-backed track-line shells and viewport/cursor-only materialization,
  removing eager full-track geometry and duplicate initial track loading.
- Bend add/edit/removal and undo/redo, complete bend-type selection, existing
  state initialization, curved selector drag persistence, continuation gating,
  and atomic option validation.
- Normal dialog close-event cleanup, Enter/Escape/backdrop/cancel behavior,
  editable-target shortcut suppression, and atomic validation for tempo, tuplet,
  time-signature, and track-name input.
- Tempo, tuplet, and time-signature free-form numeric fields replaced by bounded
  button/wheel steppers and a fixed time-signature denominator selector.
- Hold/Release playback continuation, fixed Hold selector pitch, and explicit
  failure for invalid continuation automation.
- Continuation Bend and Bend/Release selector, model, and playback behavior starts
  at the inherited terminal pitch, prevents downward bend targets, and disables
  further Bend/Bend-Release at the supported maximum.
- Prebend variants disabled and rejected on temporary Let Ring continuation
  notes.
- Numeric dialog drafts reset from current model values on every open.
- Captured dialog keyboard ownership released exactly once during final callback
  teardown.
- Long bend labels are constrained to existing beat geometry without introducing
  technique-specific collision planning.
- Note selection previews and selected-note outlines use identical fixed geometry
  for ordinary and parenthesized Let Ring fret text.
- `BendTechniqueOptions` requires explicit valid constructor input.
- Editor-instance `getState()`/`subscribe()` host API for active track, playback,
  model-level selection, layout size, and structured playback errors, with
  explicit subscription disposal and cross-editor isolation.
- Explicit `refreshLayout(width?)` host hook with stable external-store state
  snapshots; automatic responsive observation remains P1.
- Repeated tempo and time-signature edits invalidate retained notation using
  build-captured presentation values, preventing stale BPM and meter text when
  geometry remains unchanged.
- Inserted and copied beats preserve beat-note-technique ownership, so notes in
  insert-before/after results remain click-selectable through execute and redo.

Latest implementation commits:

- `9ebf5ad Fix stale beat reference in note copies`
- `5cb1a97 Fixed stale tempo & time signature state`
- `1696345 Implemented Phase 6 Stage 3.6 - stabilized & corrected public host API`

## P1 - Required MVP Quality

- Versioned JSON serialization and validated deserialization. This is required
  for the integrated `0.5.0` MVP even though it follows the P0 gate.
- Inline technique geometry and hit/layout bounds.
- Time-signature presentation on one- through four-string instruments.
- Multi-staff/multi-voice track-line outline extents.
- View-only mode.
- Responsive embedded-container behavior, including window resize.
- Basic tablet/touch, touchpad, mouse, and keyboard usability alongside
  responsive embedding.
- Configurable top/side panel visibility and placement.
- Measure Element-layer construction, materialization, updates, and retained
  memory before deciding whether to simplify presentation-shell types.
- Decide the desired cross-track width invariant before implementing score-wide
  width planning.
- Reassess UI event ownership and naming after stabilization. Prefer components
  owning their interactions when that reduces coupling, but do not make the
  current component/callback split part of the public integration contract.
- Replace the global internal `trackEvent` singleton with an injected
  editor/notation-owned event scope when revisiting component ownership. Current
  UUID/run filtering preserves multi-instance correctness, so treat this as an
  ownership cleanup rather than a P0 behavior fix.
- Evaluate hierarchical template element objects only as a measured internal
  simplification; the broad template access blast radius does not belong in P0.
- Improve repeat markers and technique visuals.
- Replace repeated Palm Mute and Let Ring labels with continuous dashed spans
  across consecutive applications.
- Add first-class tied notes with destination attack suppression, source sustain
  across tied beats, bend continuation, serialization, editing, and tie notation;
  remove the temporary use of Let Ring as a tied-destination marker afterward.
- Apply voice opacity consistently to technique labels.
- Define rendering semantics for empty but non-null voice bars before persistence
  accepts them; current `VoiceBarElement.measure()` assumes at least one beat.
- Tempo setting should overwrite tempo values of all master bars after the last one changed.
  This would make it so that changing the tempo of the first bar would effectively change the
  tempo of the entire score. And maybe also make it so that if drag selection is active,
  tempo change applies only to the bars within active selection.

## P2 - Conditional Polish

- Full phone-sized editing UX with deliberately mobile-specific selection,
  controls, and panel interaction rather than a compressed desktop layout.
- Improve existing icons and create a coherent handcrafted SVG set.
- Improve top-control visual consistency.
- Audit hard-coded colors and behavior that could use existing or new config.
- Evaluate additional safe customization opportunities.

## Deferred

- Sheet notation and drum notation.
- Single-line mode unless horizontal virtualization proves small and safe.
- Production-grade multisampling and articulation-specific samples.

## Preserved Notes

1. Responsive behavior on window resize belongs in P1 embedding work unless it
   causes a P0 unusable-editor defect.
2. Audit `TabBeatElement` necessity; it may be possible to converge on
   `BeatElement`. Keep this as measured architecture analysis, not a speculative
   P0 refactor.
3. Resolved during P0 closeout: repeated tempo and time-signature edits could
   leave stale rendered text because retained element hashes omitted displayed
   values.

## P0 Audit - 2026-08-01

- Audited TODO, FIXME, FIX, XXX, HACK, WARNING, NOTE, BUG, temporary, unsupported,
  placeholder, and empty-method markers across source and active tests.
- No additional marker-backed P0 was found. Classic/sheet notation stubs remain
  explicitly deferred; technique bounds, tuning approximation, paste semantics,
  and global event ownership remain P1/P2 or documented limitations.
- Confirmed the multi-staff/multi-voice outline extends into rhythm rows when the
  final staff has multiple voices. It remains P1 because editing/model/playback
  state stays correct, though the playback cursor shares the excessive extent.
- Confirmed repeated tempo text invalidation as P0 and the analogous repeated
  time-signature text invalidation. Both received focused regressions and a
  shared captured-presentation-state correction.
- Confirmed inserted-beat click selection as P0. Deep copies retained orphaned
  beat ownership in notes (and source ownership in techniques), while keyboard
  navigation used positional cursor state. Destination-aware deep copies and
  controller/model regressions now enforce the ownership invariant.

As testing progresses, add newly found issues with an explicit priority and
release impact.
