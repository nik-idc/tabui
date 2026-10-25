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
- [x] Remove the instrument family selector (Strings, Orchestra, Drums) from
      track dialogs, keeping the models in code.
- [x] Review the active test-quality audit and confirm its release scope.
- [x] Test the installed TabUI package in raw, React, Angular, and Vue apps.
      Provide runnable demos and test framework apps in development and production.
- [x] Audit headless feasibility. Models and internal geometry work without a
      browser; public geometry APIs and one-shot export are deferred until after
      `0.5.0`.
- [x] Confirm provenance and redistribution terms for the demo audio samples.
      Credit Jason Champion / Free Wave Samples in the README and demo, with a
      link to the sample license.
- [x] ~Investigate the recurring Chromium timeout in the view-only keyboard test
      (`tests/e2e/keyboard-editing.spec.ts`). It passes in isolation but has exceeded
      its 10-second limit in full runs, stopping the verification gate.~
      Determined that 10s is too little for these e2e tests. Increased timeout
      threshold to 30s
- [x] Run `npm run verify`, `npx eslint .`,
      `git diff --check`, and `npm run benchmark:updates` from clean build output.
- [x] Review the root API and remove 16 implementation-only exports, keeping
      internal exports unchanged. Controllers and notation elements remain internal.
- [x] Explore best ways to generate public API documentation. If any public code is not
      properly documented, it should be.
- [x] Correct bend playback to use whole tones: a Full bend raises pitch by two
      semitones, including prebends, releases, and sustained continuations.
- [x] Return null when staff traversal reaches an empty adjacent voice, preventing
      note traversal from throwing on that boundary.
- [ ] Display tuning at the start of the track + make it clickable. The click would invoke
      the existing track settings dialog.
- [x] Resolve toolbar Space conflicts: mouse-clicked buttons allow playback,
      keyboard navigation keeps native activation, and Shift+Space toggles playback.
- [x] Separate Tie from Let Ring. Ties copy and continue the preceding string or
      chord without a new attack. Let Ring marks resonance passages, keeps plain
      fret numbers, and stops at the next same-string attack or passage/playback end.
- [ ] Don't render the release pitch if it's 0
- [ ] Implement the same "+" but for bars **only for the last bar**
- [ ] Implement "↑" & "↓" to increase/decrease the pitch of selection by 1 semitone
- [ ] Repeat playback doesn't actually use the specified repeat count - always defaults to 2
- [ ] Store expanded/collapsed state of "About this demo" & "Demo controls" in `localStorage`

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

### Headless use and export

- Expose model-to-geometry APIs for line breaks, positions, and bounds in Node.
  Score creation, editing, validation, and serialization already work without a
  browser; the geometry classes are currently internal.
- Add browser-backed, one-shot SVG export, then PNG/PDF export through Playwright.
  Render all lines, omit interaction overlays, include styles/assets, and bypass
  the editor's playback lifecycle.
- Assess browser-free SVG export separately. The current renderer needs DOM nodes
  and browser SVG measurements, so this requires more than a small API addition.

### Other deferred work

The former P2 work is deferred:

- Full phone editing with mobile-specific selection, controls, and panels.
- A coherent icon set and more consistent top controls.
- Further review of hard-coded colors and configurable behavior.
- Standard and drum notation.
- More realistic playback: multisampling, velocity layers, and articulations.
- A plugin system and schema migrations when concrete needs appear.

Broad architecture rewrites and compatibility wrappers for unpublished
internals need a measured benefit or a real integration requirement.
