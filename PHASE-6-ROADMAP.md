# Phase 6 Roadmap - MVP Stabilization for 0.5.0

Last updated: 2026-08-05 (P1 Stage 4 complete). This is the source of truth for
turning the completed editor foundations into a dependable, embeddable `0.5.0`
package. Prefer clean pre-`1.0.0` ownership/API decisions and record new issues in
`PRE-RELEASE-STABILIZATION.md` before changing priority or scope here.

## Status

| Stage   | Scope                                                         | Status   |
| ------- | ------------------------------------------------------------- | -------- |
| 0       | Baseline, benchmark, fixtures, issue classification           | Complete |
| 1       | Package and external-consumer contract                        | Complete |
| 2       | Lifecycle, disposal, ownership, multi-instance safety         | Complete |
| 3.1-3.4 | Playback, selection, editing locks, controls, track switching | Complete |
| 3.5     | Bends and dialog input safety                                 | Complete |
| 3.6     | Minimum host event/API surface                                | Complete |
| 4       | P0 validation and closeout                                    | Complete |
| P1 1-4  | Correctness, persistence, constants, responsive embedding     | Complete |
| P1 5    | Multimodal input and accessibility                            | Next     |

Current automated checkpoint: 78 suites / 736 tests. `npm test`,
`npm run build:package`, `npm run build:demo`, `npm run test:pack-consumer`,
and `git diff --check` pass
after P1 Stage 4. The benchmark was last rerun after the magic-number audit;
all 28 focused-update scenarios retained their previously verified substantial
speedup over full updates.

## Completed Contracts

- Package output is ESM/CSS/declarations with deliberate framework-agnostic
  exports, packaged default assets, no repository-only aliases, and an external
  `npm pack` consumer fixture. Demo output is separate.
- `TabUIEditor.dispose()` is public, terminal, and idempotent. The host owns the
  root; TabUI owns its mounted contents/classes/theme state. Replace a score by
  disposing and remounting. Layout dimensions and focused keyboard ownership are
  instance-scoped, allowing multiple editors without input/config cross-talk.
- Playback traversal, repeats, bounded ranges, live loops, failures, stale async
  runs, click-to-seek, and editing locks have regression coverage. Copy,
  transport, active-track selection, and track/master mix controls remain usable
  during playback.
- `NotationComponent` owns one score-wide player. Track replacement preserves
  audio, loop state, player identity/generation, and retargets the visible cursor.
- `ScorePlayer` coordinates transport; `PlaybackScheduler` owns timing/traversal;
  `PlaybackAudioEngine` owns Web Audio resources; `PlaybackCursorCoordinator`
  owns visible cursor projection; `PlaybackTraversalManager` owns boundaries,
  repeats, loops, and selection-loop semantics.
- Track line shells retain whole-track geometry while descendants materialize
  only for viewport/overscan or cursor needs. Focused model updates preserve
  diffs and avoid eager full-track element construction.
- Bend add/edit/remove uses the established undoable technique command, with the
  dialog providing deliberate removal intent. All seven model bend types are
  selectable, existing state initializes the graph, and Hold/Release require a
  current Let Ring note after a same-string non-releasing bend. Malformed options
  are rejected before mutation, and curved selector paths survive mouse release.
- Normal dialog closure converges on native close-event cleanup for keyboard
  ownership. Enter, Escape, backdrop, cancel, and external close paths share the
  same validation contract, while editor shortcuts ignore dialog and editable
  control targets.
- Tempo, tuplet, and time-signature values are revalidated atomically at commit.
  Free-form numeric inputs are replaced by bounded button/wheel steppers, while
  time-signature duration uses a fixed denominator selector.
- Hold and Release playback resolves the preceding same-string terminal bend
  pitch, Hold controls cannot change that continuation pitch, and invalid
  playback context fails explicitly instead of scheduling fallback automation.
- Bend and Bend/Release on Let Ring continuation notes start at the inherited
  terminal pitch and cannot target a bend pitch below that start. Release targets
  remain independent of the continuation floor. Bend and Bend/Release are
  unavailable when the inherited pitch is already at the supported maximum.
- Let Ring continuation notes reject all prebend variants in both controls and
  model mutation. `BendTechniqueOptions` requires explicit valid options.
- Numeric dialogs reload selected model values on every open, and final callback
  teardown releases captured keyboard ownership exactly once.
- Long Hold, Release, and Prebend/Bend labels are constrained to their existing
  beat geometry without introducing technique-specific collision planning.
- Note hover previews and selected-note outlines share one larger fixed square,
  independent of ordinary or parenthesized Let Ring fret text width.
- `TabUIEditor.getState()` projects active track, playback, model-level
  selection, and layout size without exposing controllers or renderers. Snapshots
  remain referentially stable between change notifications for external-store
  consumers.
- `TabUIEditor.subscribe()` is instance-scoped and returns an idempotent disposer.
  Change and structured playback-error events cannot cross editor instances, and
  the global internal event singleton is not part of the package contract.
- `TabUIEditor.refreshLayout(width?)` provides an explicit host resize/layout
  hook while preserving active selection and the score-wide player. Automatic
  responsive observation remains P1.
- Tempo and time-signature elements capture displayed values for diffing, so
  repeated edits, undo, and redo cannot leave retained SVG text stale when
  visibility and geometry remain unchanged.
- Beat/note/technique deep copies preserve destination ownership, keeping notes
  inserted through before/after controls click-selectable after execute and redo.
- Multi-staff outlines derive both endpoints and horizontal extents from rendered
  line-local staff geometry. One through four dense or sparse final-staff voices
  no longer extend outlines or playback cursors into rhythm rows.
- The public `tabui-score` V1 format round trips fixture and custom guitar scores,
  restores ownership and derived timing state, regenerates runtime UUIDs, and
  rejects malformed unknown input with exact `ScoreSerializationError` paths.
  Sparse voices and explicit rests are preserved; empty non-null voices remain
  rejected until their rendering semantics are defined.
- Magic-number audit (P1 Stage 3) introduced named constants only where a value
  encoded a shared domain/timing invariant or was duplicated across modules.
  `getFrequencyFromNoteType` now names the A4 reference frequency and A4
  semitone offset and reuses `NOTES_PER_OCTAVE`; `MasterBar` constructor
  defaults derive from the public `DEFAULT_MASTER_BAR`; tempo/time-signature/
  tuplet stepper bounds and the time-signature duration list are shared between
  each control's callbacks and template renderer; tempo display fallback now
  uses `DEFAULT_MASTER_BAR.tempo`; the bend-graph grid count now uses
  `NOTES_PER_OCTAVE` and the release selectors honor their owned
  `colsCount`/`rowsCount` instead of a literal `12`; the playback
  `semitonesToRate` divisor reuses `NOTES_PER_OCTAVE`. **Domain bounds were then
  relocated to own the invariant at the Model layer:** `MIN_MASTER_BAR_TEMPO`,
  `MAX_MASTER_BAR_TEMPO`, `MIN_MASTER_BAR_BEATS_COUNT`, and
  `MAX_MASTER_BAR_BEATS_COUNT` live on `MasterBar` and are enforced by its
  setters and constructor; `MIN_TUPLET_*`/`MAX_TUPLET_*` live on
  `TupletSettings`, exposed via `tupletSettingsInRange`, and enforced by
  `Beat.tupletSettings`. The serialization layer and UI steppers both import
  these Model constants, removing the earlier triplication of the same literals
  across UI callbacks, serialization, and (previously absent) Model setters.
  The UI keeps only genuine presentation choices: the tuplet stepper's stricter
  `min = 2` (the storage layer accepts `1`, round-tripped by serialization, but
  the UI steers users away from degenerate 1-tuplets) and the
  `AVAILABLE_TIME_SIG_DURATIONS` selector subset (the storage layer also
  accepts `NoteDuration.SixtyFourth`, exercised by serialization tests).
  Obvious inline literals (cursor priority ranks, voice slot indices, one-off
  visual/geometry tuning, layout scaling factors, and `whole-note-seconds =
240 / tempo`) were intentionally left local. New Model-boundary regression
  tests cover accept/reject at each limit.

## P0 Closeout

Stage 4 completed on 2026-08-01:

- Automated gate passed from clean output on 2026-08-01: `npm test`,
  `npm run build:package`, `npm run build:demo`, `npm run test:pack-consumer`,
  `npm run benchmark:updates`, and `git diff --check`. All 28 benchmark scenarios
  retained a substantial focused-update speedup over full updates.
- User smoke testing in Chrome and Firefox accepted the desktop P0 workflows and
  confirmed the inserted-beat selection correction.
- Chrome device emulation characterized mobile scope rather than accepting full
  mobile editing: phone-sized editing is P2; responsive embedding and basic
  tablet/touch behavior remain P1.
- Existing lifecycle coverage and repeated manual use exposed no P0 retained-DOM,
  listener, timer, player, or audio-resource defect. Deeper retained-memory
  measurement remains part of P1 Element/lifecycle quality work.

## Current P1 Stages

**NEXT IMMEDIATE:** Fix eager beat-removal invariant repair at the Model layer
before beginning Stage 5. Beat replacement should be one atomic bar operation:
apply all removals and insertions first, then normalize the completed `Bar` once
so it retains at least one voice and beat only when genuinely empty. This should
remove replacement's need to track and discard temporary fallback rests while
preserving exact execute/undo/redo behavior across single- and multi-voice bars.

1. (**COMPLETED**) Fix remaining technique, time-signature, multi-staff outline,
   and control-layout correctness.
2. (**COMPLETED**) Define versioned score serialization/deserialization with
   fixture round trips and validation errors.
3. (**COMPLETED**) Audit magic numbers and introduce named constants for
   repeated or non-obvious domain, timing, geometry, and layout values. Obvious
   structural values and readable one-off literals remain local.
4. (**COMPLETED**) Add view-only behavior, embedded-container support,
   configurable panel placement, and responsive layout.
   4.1. (**COMPLETED**) Contract and shell layout.
   `TabUIConfig` now defines edit/view-only interaction modes and independent
   score/side panel visibility and placement. Score controls support top/bottom;
   side controls support left/right. View-only hides the editing side panel by
   default, while an explicit visibility setting wins. Supplying
   `layout.width` remains the fixed-width opt-in. The shell collapses hidden
   panel tracks and cleans all placement state on disposal. Visible side panels
   can expose a lifecycle-owned collapse control with configurable initial state;
   measured layouts reflow on toggle while explicit widths remain fixed. The
   demo recreates the editor to exercise every Stage 4.1 option. Mutation
   prevention is deliberately owned by Stage 4.2 rather than inferred from
   hidden UI. Root DOM, panel rendering, collapse callbacks, and transition
   lifecycle now follow the component/template/renderer/callback convention;
   editor snapshots and host events are owned by a dedicated state store.
   Collapse/expand reflows immediately so notation geometry never trails panel
   geometry. Ordered cleanup uses a flat `runCleanupSteps()` finalizer utility.
   4.2. (**COMPLETED**) View-only enforcement. Immutable editing capability is
   propagated through controller replacement, with `TrackControllerEditor` as
   the single mutation authority for score structure, notation, metadata,
   instruments, and persisted mix state. UI controls are presented disabled or
   inert, while callbacks and public controller methods delegate to that
   authority. Selection, closest-existing-voice navigation without model growth,
   copy, scrolling, playback/seek/loop, and active-track selection remain
   available. Serialized-document regression coverage verifies that the complete
   score remains unchanged.
   4.3. (**COMPLETED**) Automatic embedded-container observation. Editors without
   an explicit width observe the notation viewport, coalesce changes per frame,
   and force active geometry to reflow using the latest valid measurement. A
   window resize fallback covers environments without `ResizeObserver`. Fixed
   widths never observe host size, runtime ownership is preserved, and pending
   work is disconnected safely during failed initialization and disposal.
5. (**NEXT**) Add deliberate multimodal input and baseline accessibility across
   desktop, laptop, hybrid, and large-tablet configurations. Full phone-sized
   editing remains P2.
   5.1. (**COMPLETED**) Replace mouse-only notation drag ownership with pointer
   behavior for mouse, touch, and pen while preserving touchpad scrolling and selection.
   5.2. (**COMPLETED**) Remove keyboard focus traps and add basic names, roles, labels, focus
   order, activation, pressed/disabled state, dialog focus behavior, and an
   explicit accessibility boundary for notation SVG.
   5.3. (**COMPLETED**) Validate keyboard-only, mouse, touchpad, touch, pen, hybrid-device,
   orientation, zoom, coarse-pointer, and reduced-motion behavior. Add browser
   automation where unit fakes cannot verify CSS, focus, accessibility trees,
   pointer behavior, or native dialogs.
   ALSO: Added a small E2E test suite of the most basic functionality.
   5.4 (**COMPLETED**) Fix bend drag mobile bug. If deemed doable, implement mobile drag selection
6. (**COMPLETED**) Revisit Element architecture, cross-track widths, and single-line mode only
   when profiling or a release requirement justifies them.
7. (**NEXT**) Apply final visual/icon polish, performance budgets, package/browser gates,
   release notes, and a feature freeze for the release candidate.
8. Audit the source code for:

- Non-reliance on tests. I remember there were moments when an agent
  would structure the code in an unnatural way just to make testing simpler.
  This is bad - tests should only affect understanding of code correctness,
  not its structure.
- Type strictness, meaning:
  - `any`
  - `!`
  - `as`
    etc should be minimized or removed entirely

9. Audit the test suite for:

- Over/under-exhaustiveness
- Stale tests/tests that no longer make sense and are only green because of
  code crutches that essentially force the test to be green
- Type correctness
- Type strictness, just like the source code
- Over-reliance on mocks when real source code could be used
- Anything else that makes the test suite worse

10. Explore the feasability and implementaton of E2E testing using Playwright.
    Especially interesting to see testing under different configs:
    - Edit/view only
    - Side panel: collapes/expanded
    - Side panel: visible/hidden
    - Using different device presets:
      - Normal PC
      - Laptop (touchpad)
      - Phones
      - Tablets
      - Drawing tablets (is possible)
      - Other platforms I might be forgetting (eg do gaming consoles allow browser use?)
    - etc

11. Replace `HTMLDialogElement` with custom bialog behavior divs. Needed to ensure native dialogs
    only appear as modal in TabUI itself, not the host app.

12. Create new demos using different JS frontend frameworks to ensure that packing
    actually works correctly. Suggested frameworks to test:

- React (important to note that once TabUI v0.5.0 ships this will be the frontend tech)
- Next.js (though since it's based on React not sure of the usefullness of testing this)
- Vue
- Angular
- Svelte
- Any other major frontend framework I might have missed

13. Test how this library would work in a headless/backend context. I.e.
    getting just the geometry from a Model. Or rendering once into a specified file/buffer.
    May require large scale code changes.

## P2 Stages

P2 is conditional polish rather than a `0.5.0` release gate. Work these stages
after required P1 quality unless user feedback or release evidence promotes a
specific item.

1. Build a deliberate phone-sized editing UX for selection, controls, and panel
   interaction rather than compressing the desktop interface.
2. Improve existing icons and create a coherent handcrafted SVG set.
3. Improve top-control visual consistency.
4. Audit hard-coded colors and behavior that should use existing or new
   configuration.
5. Audit package modularity so consumers can assess using the Model, Element, or
   Controller layers independently instead of importing the complete editor.
6. Evaluate additional safe customization opportunities without expanding the
   public contract speculatively.

Deferred from `0.5.0`: sheet/drum notation, production multisampling, a plugin
system, speculative schema migrations, compatibility wrappers for unpublished
internals, and an unmeasured wholesale Element rewrite.

Phase 6 is complete when no P0 remains, required P1 workflows are dependable,
the packed artifact passes integration and browser gates, persistence round trips
musical meaning, repeated lifecycle operations remain bounded, and limitations
are documented plainly.
