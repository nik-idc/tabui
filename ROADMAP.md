# Roadmap

TabUI's next milestone is `0.5.0`: a usable, embeddable tablature editor for
browser applications. APIs and serialized formats may change before `1.0.0`.

This file replaces the phase roadmap and stabilization inbox. New findings belong
here with their user impact and priority. Completed implementation does not
replace release validation.

## Completed foundations

- Tick-based rhythm, sparse voices, explicit rests, and undoable structural edits.
- Incremental layout, viewport materialization, score-wide bar widths, and
  single-line horizontal virtualization.
- Multi-track Web Audio playback, samples with synthesized fallback, mix controls,
  repeats, seeking, and selection loops.
- ESM package, styles, declarations, runtime icons, and a packed-consumer check.
- Editor disposal, isolated input ownership, multiple instances, host state/events,
  and layout refresh.
- Versioned score serialization with input validation.
- View-only mode, responsive embedding, configurable panels, and themes.
- Pointer selection, keyboard editing, baseline control accessibility, and
  expanded Playwright coverage.
- Release-blocking editing fixes from the former Phase 6 Stage 10, including
  technique copying/application, selection, repeat controls, contained dialogs,
  and technique ownership. The callback-owner refactor was deferred.

## Before 0.5.0 (release blockers)

- [x] Apply tempo and time-signature edits from the cursor through the remaining
      section, stopping at the next existing change. Support selected-bar ranges,
      with one undoable edit and the affected bars shown in the dialog.
- [ ] Remove the instrument types from UI (keep the Models in code though)
- [x] Review the active test-quality audit and confirm its release scope.
- [x] Test the installed TabUI package in raw, React, Angular, and Vue apps.
      Provide runnable demos and test framework apps in development and production.
- [ ] Evaluate headless use: model-to-geometry and one-shot rendering to a file or
      buffer. Record the supported scope; this may require work beyond the release.
- [ ] Confirm provenance and redistribution terms for the demo audio samples.
- [ ] Investigate the recurring Chromium timeout in the view-only keyboard test
      (`tests/e2e/keyboard-editing.spec.ts`). It passes in isolation but has exceeded
      its 10-second limit in full runs, stopping the verification gate.
- [ ] Run `npm run verify`, `npx eslint .`,
      `git diff --check`, and `npm run benchmark:updates` from clean build output.
- [ ] Smoke-test desktop Chrome and Firefox, keyboard-only use, tablet/touch
      input, embedded layouts, persistence, playback, and repeated mount/disposal.
- [ ] Review the packed file list, release version, usage examples, known limits,
      and user-visible release notes, then publish and deploy the demo.

## Follow-up inbox

These notes came from the older roadmaps. Some overlap completed work. Confirm
each against the current code before scheduling it; they are not all release
blockers.

### Behavior and notation

- Audit recoverable public errors and use dedicated error classes where useful.
- Recheck inline-technique geometry, hit bounds, voice opacity, repeat visuals,
  time signatures on one- through four-string instruments, and control layout.
- Draw continuous Palm Mute and Let Ring spans across consecutive applications.
- Confirm first-class tied-note behavior across sustain, destination attacks,
  bends, serialization, editing, and notation; remove any remaining temporary
  use of Let Ring as a tied-destination marker.
- Define empty non-null voice rendering before allowing it in persisted scores.
- Recheck atomic beat replacement and empty-bar normalization; the older plan
  described eager fallback-rest repair as an immediate task.
- Investigate multi-bar insertion cost against focused-update benchmarks.
- Improve action announcements beyond selection descriptions.

### Architecture and performance

- Measure construction, materialization, updates, and retained memory before
  changing presentation-shell architecture or `TabBeatElement` ownership.
- Replace callback parameters with direct owner dependencies where this makes
  ownership clearer. Deferred until after `0.5.0`.
- Reassess component/callback boundaries, internal event scope, and hierarchical
  template objects where measured simplification justifies it.
- Improve the heterogeneous renderer registry's type boundary.
- Consider `noUncheckedIndexedAccess` through guarded input and selection paths,
  rather than adding assertions in bulk.
- Assess separate model, element, and controller entry points and additional
  customization based on actual consumer needs.

## After 0.5.0

The former P2 work is deferred:

- Full phone editing with mobile-specific selection, controls, and panels.
- A coherent icon set and more consistent top controls.
- Further review of hard-coded colors and configurable behavior.
- Standard and drum notation.
- More realistic playback: multisampling, velocity layers, and articulations.
- A plugin system and schema migrations when concrete needs appear.

Broad architecture rewrites and compatibility wrappers for unpublished
internals need a measured benefit or a real integration requirement.
