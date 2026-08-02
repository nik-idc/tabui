# Phase 6 Roadmap - MVP Stabilization for 0.5.0

Last updated: 2026-08-02. This is the source of truth for turning the completed
editor foundations into a dependable, embeddable `0.5.0` package. Prefer clean
pre-`1.0.0` ownership/API decisions and record new issues in
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

Current automated checkpoint: 70 suites / 572 tests. `npm test`, `npm run build`,
`npm run build_vite`, `npm run test:pack-consumer`, and `git diff --check` pass
after the multi-staff outline geometry correction. All 28 focused-update
benchmark scenarios retain a substantial speedup over full updates.

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

## P0 Closeout

Stage 4 completed on 2026-08-01:

- Automated gate passed from clean output on 2026-08-01: `npm test`,
  `npm run build`, `npm run build_vite`, `npm run test:pack-consumer`,
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

## Current P1 Order

1. Fix remaining technique, time-signature, multi-staff outline, and control-layout
   correctness.
2. Define versioned score serialization/deserialization with fixture round trips
   and validation errors.
3. Add view-only, embedded-container, panel placement, responsive input, and basic
   accessibility behavior.
4. Revisit Element architecture, cross-track widths, and single-line mode only
   when profiling or a release requirement justifies them.
5. Apply final visual/icon polish, performance budgets, package/browser gates,
   release notes, and a feature freeze for the release candidate.
6. Audit the source code for:

- Non-reliance on tests. I remember there were moments when an agent
  would structure the code in an unnatural way just to make testing simpler.
  This is bad - tests should only affect understanding of code correctness,
  not its structure.
- Type strictness, meaning:
  - `any`
  - `!`
  - `as`
    etc should be minimized or removed entirely

7. Audit the test suite for:

- Over/under-exhaustiveness
- Stale tests/tests that no longer make sense and are only green because of
  code crutches that essentially force the test to be green
- Type correctness
- Type strictness, just like the source code
- Over-reliance on mocks when real source code could be used
- Anything else that makes the test suite worse

8. Create new demos using different JS frontend frameworks to ensure that packing
   actually works correctly. Suggested frameworks to test:

- React (important to note that once TabUI v0.5.0 ships this will be the frontend tech)
- Next.js (though since it's based on React not sure of the usefullness of testing this)
- Vue
- Angular
- Svelte
- Any other major frontend framework I might have missed

9. Test how this library would work in a headless/backend context. I.e.
   getting just the geometry from a Model. Or rendering once into a specified file/buffer.
   May require large scale code changes.

Deferred from `0.5.0`: sheet/drum notation, production multisampling, a plugin
system, speculative schema migrations, compatibility wrappers for unpublished
internals, and an unmeasured wholesale Element rewrite.

Phase 6 is complete when no P0 remains, required P1 workflows are dependable,
the packed artifact passes integration and browser gates, persistence round trips
musical meaning, repeated lifecycle operations remain bounded, and limitations
are documented plainly.
