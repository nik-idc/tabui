# Test audit

## Goal and process

Make the suite comprehensible and assuring. There is no target test count.
Review behavior coverage and test quality separately: important behavior does
not justify a poor test.

Each numbered group is one bounded handoff. Groups 1–3 started with Luna triage
and Sol verification. After repeated substantive Luna errors, the user approved
continuing with Sol for Groups 4–6:

1. Sol reviews current `docs/code-style.md` compliance and test quality using
   the TDD skill, then implements justified improvements within the owned scope.
2. A separate Sol reviews the evidence and implementation, including retained
   coverage and unflagged tests where relevant.
3. Record direct removals separately from replacements, and run verification.

Assessment and implementation are tracked separately. Helpers and setup are
shared dependencies. Large mixed files use test-level ownership across groups.

The planning inventory reported 94 unit spec files, 15 browser spec files, and
one package-consumer smoke script. Sol mechanically checked ownership of 840
source test declarations (751 unit, 89 browser). These are not generated-case
counts. Recheck paths and ranges when the tests change.

## Grouping foundation

| Area                               | Individual Luna/Sol handoffs                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notes and basic editing**        | **1.** Fret-entry pilot¹ · **2.** Fret controls and announcements · **3.** Note/rest values and controls · **4.** Voice slots and cursor movement                                                                                                                                                 |
| **Model structure**                | **5.** Score/staff invariants · **6.** Instruments, tuning, and track settings                                                                                                                                                                                                                    |
| **Structural editing**             | **7.** Beat insertion/removal · **8.** Bar insertion/removal · **9.** Undo history and general shortcuts · **10.** Beat replacement and data ownership · **11.** Clipboard/paste                                                                                                                  |
| **Rhythm and meter**               | **12.** Duration, dots, and timing rebuild · **13.** Tuplets · **14.** Meter and signature rebuild · **15.** Rhythm pointer targets · **16.** Beams, flags, and dotted geometry · **17.** Rhythm rows and selection rectangles                                                                    |
| **Layout and rendering**           | **18.** Bar spacing · **19.** Wrapped widths and track alignment · **20.** Single-line widths · **21.** Viewport materialization and following · **22.** Tree structure and coordinates · **23.** Incremental updates and renderer reuse · **24.** Vertical layout and technique ownership        |
| **Techniques**                     | **25.** Technique application rules · **26.** Inline transitions, harmonics, and vibrato · **27.** Technique labels and removal · **28.** Bend rules and undo · **29.** Bend curves and geometry · **30.** Bend dialog and pointer controls                                                       |
| **Notation controls**              | **31.** Repeats · **32.** Tempo · **33.** Shared notation-dialog routing                                                                                                                                                                                                                          |
| **Selection and input**            | **34.** Range anchors and traversal · **35.** Drag selection · **36.** Selection announcements · **37.** Keyboard ownership and mode restrictions                                                                                                                                                 |
| **Playback**                       | **38.** Transport, loops, and seeking · **39.** Traversal and scheduling · **40.** Note synthesis and teardown · **41.** Audio buses and samples · **42.** Playback cursor and overlays                                                                                                           |
| **Editor shell**                   | **43.** Track/score controls and switching · **44.** Lifecycle and subscription cleanup · **45.** Responsive sizing · **46.** Panels and accessible controls · **47.** Configuration, assets, and cleanup · **48.** Dialog confirmation and focus · **49.** Dialog ownership and multiple editors |
| **Serialization and distribution** | **50.** Serialization round trips · **51.** Invalid serialized input · **52.** Wire-format contract · **53.** Demo import/export · **54.** Demo fixtures and themes · **55.** Published-package smoke test                                                                                        |

¹ At planning time, the pilot was reviewed except for the non-`x` rows in its
assigned shortcut table. See current status below.

## Progress

| Group                                        | Assessment                                         | Implementation                         |
| -------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 1. Fret entry                                | Complete: Sol verified and corrected Luna findings | Implemented; independent review passed |
| 2. Fret controls and announcements           | Complete: Sol retry succeeded                      | Implemented; independent review passed |
| 3. Note/rest values and controls             | Complete: Sol verified and corrected Luna findings | Implemented; independent review passed |
| 4. Voice slots and cursor movement           | Sol assessment complete                            | Implemented; independent review passed |
| 5. Score/staff invariants                    | Sol assessment complete                            | Implemented; independent review passed |
| 6. Instruments, tuning, and track settings   | Sol assessment complete                            | Implemented; independent review passed |
| 7. Beat insertion/removal                    | Sol assessment complete                            | Implemented; independent review passed |
| 8. Bar insertion/removal                     | Sol assessment complete                            | Implemented; independent review passed |
| 9. Undo history and general shortcuts        | Sol assessment complete                            | Implemented; independent review passed |
| 10. Beat replacement and data ownership      | Sol assessment complete                            | Implemented; independent review passed |
| 11. Clipboard/paste                          | Sol assessment complete                            | Implemented; independent review passed |
| 12. Duration, dots, and timing rebuild       | Sol assessment complete                            | Implemented; independent review passed |
| 13. Tuplets                                  | Sol assessment complete                            | Implemented; independent review passed |
| 14. Meter and signature rebuild              | Sol assessment complete                            | Implemented; independent review passed |
| 15. Rhythm pointer targets                   | Sol assessment complete                            | Implemented; independent review passed |
| 16. Beams, flags, and dotted geometry        | Sol assessment complete                            | Implemented; independent review passed |
| 17. Rhythm rows and selection rectangles     | Sol assessment complete                            | Implemented; independent review passed |
| 18. Bar spacing                              | Sol assessment complete                            | Implemented; independent review passed |
| 19. Wrapped widths and track alignment       | Sol assessment complete                            | Implemented; independent review passed |
| 20. Single-line widths                       | Sol assessment complete                            | Implemented; independent review passed |
| 21. Viewport materialization and following   | Sol assessment complete                            | Implemented; independent review passed |
| 22. Tree structure and coordinates           | Sol assessment complete                            | Implemented; independent review passed |
| 23. Incremental updates and renderer reuse   | Sol assessment complete                            | Implemented; independent review passed |
| 24. Vertical layout and technique ownership  | Sol assessment complete                            | Implemented; independent review passed |
| 25. Technique application rules              | Sol assessment complete                            | Implemented; independent review passed |
| 26. Inline transitions, harmonics, vibrato   | Sol assessment complete                            | Implemented; independent review passed |
| 27. Technique labels and removal             | Sol assessment complete                            | Implemented; independent review passed |
| 28. Bend rules and undo                      | Sol assessment complete                            | Implemented; independent review passed |
| 29. Bend curves and geometry                 | Sol assessment complete                            | Implemented; independent review passed |
| 30. Bend dialog and pointer controls         | Sol assessment complete                            | Implemented; independent review passed |
| 31. Repeats                                  | Sol assessment complete                            | Implemented; independent review passed |
| 32. Tempo                                    | Sol assessment complete                            | Implemented; independent review passed |
| 33. Shared notation-dialog routing           | Sol assessment complete                            | Implemented; independent review passed |
| 34. Range anchors and traversal              | Sol assessment complete                            | Implemented; independent review passed |
| 35. Drag selection                           | Sol assessment complete                            | Implemented; independent review passed |
| 36. Selection announcements                  | Sol assessment complete                            | Implemented; independent review passed |
| 37. Keyboard ownership and mode restrictions | Sol assessment complete                            | Implemented; independent review passed |
| 38. Transport, loops, and seeking            | Sol assessment complete                            | Implemented; independent review passed |
| 39. Traversal and scheduling                 | Sol assessment complete                            | Implemented; independent review passed |
| 40. Note synthesis and teardown              | Sol assessment complete                            | Implemented; independent review passed |
| 41. Audio buses and samples                  | Sol assessment complete                            | Implemented; independent review passed |
| 42. Playback cursor and overlays             | Sol assessment complete                            | Implemented; independent review passed |
| 43. Track/score controls and switching       | Sol assessment complete                            | Implemented; independent review passed |
| 44. Lifecycle and subscription cleanup       | Sol assessment complete                            | Implemented; independent review passed |
| 45. Responsive sizing                        | Sol assessment complete                            | Implemented; independent review passed |
| 46. Panels and accessible controls           | Sol assessment complete                            | Implemented; independent review passed |
| 47. Configuration, assets, and cleanup       | Sol assessment complete                            | Implemented; independent review passed |
| 48. Dialog confirmation and focus            | Sol assessment complete                            | Implemented; independent review passed |
| 49. Dialog ownership and multiple editors    | Sol assessment complete                            | Implemented; independent review passed |
| 50. Serialization round trips                | Sol assessment complete                            | Implemented; independent review passed |
| 51. Invalid serialized input                 | Sol assessment complete                            | Implemented; independent review passed |
| 52–55                                        | Not started                                        | Not started                            |

## Current handoff scopes

Line ranges refer to the source at assessment time, before the implementation
changes (repository HEAD `2b94b57d5a726b8d5886b3cbb8dadc38e0a9a761`). Use that
baseline and test titles to relocate tests after edits. A whole parameterized
declaration belongs to one group. In particular, do not use the old keyboard
callback ranges against the shortened file without remapping them first.

### Group 1: Fret entry

- `tests/unit/controller/set-fret-command.spec.ts`: whole file.
- `tests/unit/callbacks/editor-keyboard-callbacks.spec.ts`: 180–211 (all shortcut
  rows), 750–822, 974–1067.
- `tests/e2e/editor-interactions.spec.ts`: 3–24, timed fret input.

The full shortcut table, including all non-`x` rows, is now assessed. Final
decisions appear below.

### Group 2: Fret controls and announcements

- `tests/unit/callbacks/fret-controls-callbacks.spec.ts`: whole file.
- `tests/e2e/editor-interactions.spec.ts`: 161–231, rapid-input announcements.

### Group 3: Note/rest values and controls

- `tests/unit/model/beat.spec.ts`: whole file.
- `tests/unit/controller/set-note-command.spec.ts`: whole file.
- `tests/unit/controller/set-rest-command.spec.ts`: whole file.
- `tests/unit/callbacks/note-controls-callbacks.spec.ts`: whole file.
- `tests/unit/callbacks/note-controls-template-renderer.spec.ts`: whole file.
- `tests/e2e/keyboard-editing.spec.ts`: 278–305, note/rest editing.

## Remaining ownership manifest

Paths below are relative to `tests/`. A filename without a range means the whole
file. Ranges own declarations whose start line falls within the range, including
all generated cases. Setup outside these ranges remains shared. This manifest
records the planning-time ownership check; revalidate after source changes.

| Group | Owned files and ranges                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4     | `unit/controller/tab-note-slot-element.spec.ts`; `unit/controller/selection-cursor.spec.ts`; `unit/controller/track-controller.spec.ts:1080–1181`; `unit/callbacks/editor-mouse-callbacks.spec.ts:593–609`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:283–293`; `e2e/keyboard-editing.spec.ts:224–276`                                                                                                                                                               |
| 5     | `unit/model/score.spec.ts`; `unit/model/staff.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 6     | `unit/model/track.spec.ts`; `unit/model/instruments.spec.ts`; `unit/callbacks/track-settings-callbacks.spec.ts`; `unit/callbacks/new-track-controls-callbacks.spec.ts`; `e2e/accessibility.spec.ts:308–366`                                                                                                                                                                                                                                                                  |
| 7     | `unit/controller/append-beat-command.spec.ts`; `unit/controller/insert-beat-command.spec.ts`; `unit/controller/insert-beats-command.spec.ts`; `unit/controller/remove-beats-command.spec.ts`; `unit/controller/track-controller.spec.ts:384–445,1200–1299,1336–1417,1575–1597`; `unit/render/beat-interaction-renderer.spec.ts`; `unit/callbacks/editor-mouse-callbacks.spec.ts:679–767`; `e2e/editor-interactions.spec.ts:26–157`                                           |
| 8     | `unit/controller/append-bar-command.spec.ts`; `unit/controller/insert-bar-command.spec.ts`; `unit/controller/prepend-bar-command.spec.ts`; `unit/controller/remove-bar-command.spec.ts`; `unit/model/score-editor.spec.ts:18–46`; `unit/controller/track-controller.spec.ts:1300–1335,1418–1574`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:727–748`                                                                                                                 |
| 9     | `unit/controller/command-manager.spec.ts`; `unit/controller/track-controller.spec.ts:1182–1199`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:295–307,824–857,1212–1268`; `e2e/keyboard-editing.spec.ts:72–81,202–221`                                                                                                                                                                                                                                                  |
| 10    | `unit/model/score-editor.spec.ts:208–353`; `unit/controller/timing-rebuild-commands.spec.ts:152–420`                                                                                                                                                                                                                                                                                                                                                                         |
| 11    | `unit/controller/track-controller.spec.ts:1649–1876,1917–2077`                                                                                                                                                                                                                                                                                                                                                                                                               |
| 12    | `unit/model/bar.spec.ts`; `unit/model/score-editor.spec.ts:101–147,548–562`; `unit/controller/timing-rebuild-commands.spec.ts:21–71`; `unit/controller/track-controller.spec.ts:1598–1648`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:365–425`; `e2e/keyboard-editing.spec.ts:113–139`                                                                                                                                                                               |
| 13    | `unit/model/bar-tuplets.spec.ts`; `unit/controller/bar-tuplet-group-element.spec.ts`; `unit/callbacks/tuplet-controls-callbacks.spec.ts`; `unit/model/score-editor.spec.ts:47–100,148–182`; `unit/controller/timing-rebuild-commands.spec.ts:72–113`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:427–471,705–725`; `unit/callbacks/editor-mouse-callbacks.spec.ts:365–403`; `e2e/notation-dialog-interactions.spec.ts:89–145`; `e2e/keyboard-editing.spec.ts:141–195` |
| 14    | `unit/model/master-bar-bounds.spec.ts`; `unit/callbacks/time-sig-controls-callbacks.spec.ts`; `unit/controller/track-element-measure.spec.ts:7–68`; `unit/model/score-editor.spec.ts:183–207`; `unit/controller/timing-rebuild-commands.spec.ts:114–151`; `unit/controller/track-controller.spec.ts:2260–2311`; `e2e/notation-dialog-interactions.spec.ts:3–34`                                                                                                              |
| 15    | `unit/callbacks/editor-mouse-callbacks.spec.ts:156–247`; `unit/render/svg-tab-beat-rhythm-renderer.spec.ts`; `unit/controller/track-controller.spec.ts:147–195`; `e2e/rhythm-interactions.spec.ts:27–128,189–224`                                                                                                                                                                                                                                                            |
| 16    | `unit/model/bar-beaming.spec.ts`; `unit/controller/beam-segment-element.spec.ts`; `unit/controller/track-element-rhythm.spec.ts:420–533`; `unit/render/svg-beam-segment-renderer.spec.ts`; `e2e/rhythm-interactions.spec.ts:129–188`                                                                                                                                                                                                                                         |
| 17    | `unit/controller/track-element-rhythm.spec.ts:62–419`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 18    | `unit/controller/bar-layout.spec.ts:71–372`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 19    | `unit/controller/bar-layout.spec.ts:374–737`; `unit/controller/track-element-tree.spec.ts:877–972`; `e2e/track-switching.spec.ts:42–59`                                                                                                                                                                                                                                                                                                                                      |
| 20    | `unit/controller/bar-layout.spec.ts:739–870`; `e2e/single-line.spec.ts:109–130,169–204`                                                                                                                                                                                                                                                                                                                                                                                      |
| 21    | `unit/controller/track-element-tree.spec.ts:1043–1210`; `unit/render/editor-svg-renderer.spec.ts:85–122`; `e2e/single-line.spec.ts:78–108,131–168`                                                                                                                                                                                                                                                                                                                           |
| 22    | `unit/controller/track-element-tree.spec.ts:148–499`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 23    | `unit/controller/track-element-tree.spec.ts:500–876`; `unit/controller/track-controller.spec.ts:2078–2125`; `unit/render/editor-svg-renderer.spec.ts:46–84`                                                                                                                                                                                                                                                                                                                  |
| 24    | `unit/controller/track-element-techniques.spec.ts:649–737,1012–1167`; `unit/controller/track-element-tree.spec.ts:973–1042,1211–1255`                                                                                                                                                                                                                                                                                                                                        |
| 25    | `unit/model/guitar-note-techniques.spec.ts:22–158,341–382`; `unit/controller/set-technique-command.spec.ts:12–137`; `unit/model/score-editor.spec.ts:354–405,523–547,563–602`; `unit/callbacks/technique-controls-callbacks.spec.ts`; `unit/callbacks/technique-controls-template-renderer.spec.ts`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:244–281,309–349,940–972`; `e2e/keyboard-editing.spec.ts:533–569`                                                      |
| 26    | `unit/controller/track-element-techniques.spec.ts:85–435,813–896`; `unit/render/svg-technique-renderer.spec.ts`; `e2e/inline-technique-interactions.spec.ts`; `e2e/keyboard-editing.spec.ts:379–393`                                                                                                                                                                                                                                                                         |
| 27    | `unit/controller/track-element-techniques.spec.ts:437–529,739–812,1168–1355`; `unit/render/svg-technique-label-renderer.spec.ts`; `unit/controller/track-controller.spec.ts:303–383,2126–2165`; `unit/callbacks/editor-mouse-callbacks.spec.ts:475–542`; `e2e/technique-label-interactions.spec.ts:30–97`                                                                                                                                                                    |
| 28    | `unit/model/bend-options.spec.ts`; `unit/model/guitar-note-techniques.spec.ts:159–340`; `unit/controller/set-technique-command.spec.ts:138–241`; `unit/model/score-editor.spec.ts:406–522`                                                                                                                                                                                                                                                                                   |
| 29    | `unit/callbacks/bend-curve-selector.spec.ts`; `unit/controller/track-element-techniques.spec.ts:530–647,898–1011`; `e2e/technique-label-interactions.spec.ts:98–134`                                                                                                                                                                                                                                                                                                         |
| 30    | `unit/callbacks/bend-controls-callbacks.spec.ts`; `unit/callbacks/bend-controls-component.spec.ts`; `e2e/bend-controls.spec.ts`; `e2e/keyboard-editing.spec.ts:474–491`                                                                                                                                                                                                                                                                                                      |
| 31    | `unit/controller/set-repeat-status-command.spec.ts`; `unit/controller/track-element-measure.spec.ts:69–183`; `unit/callbacks/measure-controls-callbacks.spec.ts`; `unit/callbacks/repeat-count-controls-callbacks.spec.ts`; `unit/controller/track-controller.spec.ts:196–302`; `unit/callbacks/editor-mouse-callbacks.spec.ts:249–290`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:351–363`; `e2e/repeat-interactions.spec.ts`; `e2e/contained-dialog.spec.ts:41–60` |
| 32    | `unit/controller/set-tempo-command.spec.ts`; `unit/callbacks/tempo-controls-callbacks.spec.ts`; `unit/render/svg-track-line-info-renderer.spec.ts`; `unit/controller/track-controller.spec.ts:2166–2259`; `e2e/notation-dialog-interactions.spec.ts:35–88`; `e2e/accessibility.spec.ts:3–57,127–148`                                                                                                                                                                         |
| 33    | `unit/callbacks/dialog-open-state.spec.ts`; `unit/callbacks/editor-mouse-callbacks.spec.ts:292–363,405–474`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:213–242,473–516`; `e2e/notation-dialog-interactions.spec.ts:146–160`; `e2e/keyboard-editing.spec.ts:91–110,407–427`; `unit/render/svg-bar-renderer.spec.ts`                                                                                                                                                   |
| 34    | `unit/controller/track-controller.spec.ts:682–963`; `unit/callbacks/editor-keyboard-callbacks.spec.ts:681–703,1069–1210`; `unit/callbacks/editor-mouse-callbacks.spec.ts:563–592,611–626,655–666`; `unit/callbacks/play-controls-callbacks.spec.ts:91–176`; `e2e/range-selection.spec.ts:91–186`                                                                                                                                                                             |
| 35    | `unit/callbacks/selection-drag-controller.spec.ts`; `unit/controller/track-controller.spec.ts:1877–1916`; `unit/callbacks/editor-mouse-callbacks.spec.ts:769–857,923–958`; `e2e/range-selection.spec.ts:3–90`                                                                                                                                                                                                                                                                |
| 36    | `unit/controller/notation-selection-announcement.spec.ts`; `unit/callbacks/tabui-callbacks.spec.ts:158–178,238–453`; `unit/lifecycle/tabui-editor-lifecycle.spec.ts:309–414,1093–1119`; `e2e/editor-interactions.spec.ts:233–244`; `e2e/accessibility.spec.ts:73–126`                                                                                                                                                                                                        |
| 37    | `unit/callbacks/editor-keyboard-callbacks.spec.ts:518–679,859–938,1270–1397`; `e2e/keyboard-editing.spec.ts:307–373,430–472,493–532`; `e2e/accessibility.spec.ts:149–222`                                                                                                                                                                                                                                                                                                    |
| 38    | `unit/player/score-player.spec.ts`; `unit/callbacks/play-controls-callbacks.spec.ts:6–90,177–214`; `unit/controller/track-controller.spec.ts:446–681,964–1079`; `unit/callbacks/editor-mouse-callbacks.spec.ts:627–654,667–678`; `e2e/editor-interactions.spec.ts:246–342`                                                                                                                                                                                                   |
| 39    | `unit/player/playback-traversal-manager.spec.ts`; `unit/player/playback-scheduler.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                   |
| 40    | `unit/player/playback-note-scheduler.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 41    | `unit/player/playback-audio-engine.spec.ts`; `unit/player/playback-sample-manager.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                   |
| 42    | `unit/player/playback-cursor-coordinator.spec.ts`; `unit/render/player-overlay-renderer.spec.ts`                                                                                                                                                                                                                                                                                                                                                                             |
| 43    | `unit/callbacks/track-controls-callbacks.spec.ts`; `unit/callbacks/score-controls-callbacks.spec.ts`; `unit/lifecycle/notation-component.spec.ts`; `e2e/track-switching.spec.ts:24–41,60–83`; `e2e/accessibility.spec.ts:367–385`                                                                                                                                                                                                                                            |
| 44    | `unit/lifecycle/tabui-editor-lifecycle.spec.ts:272–308,415–442,592–734,1073–1092`; `unit/callbacks/tabui-callbacks.spec.ts:109–157,179–237`; `unit/callbacks/ui-callbacks.spec.ts`; `unit/callbacks/top-callbacks.spec.ts`; `unit/callbacks/editor-mouse-callbacks.spec.ts:858–921`; `e2e/root-containment.spec.ts`                                                                                                                                                          |
| 45    | `unit/lifecycle/tabui-editor-lifecycle.spec.ts:443–476,735–1072`; `unit/config/tabui-config.spec.ts:88–115,139–165`; `e2e/responsive-layout.spec.ts:40–99`                                                                                                                                                                                                                                                                                                                   |
| 46    | `unit/lifecycle/tabui-editor-lifecycle.spec.ts:477–591`; `unit/callbacks/editor-shell-callbacks.spec.ts`; `unit/config/tabui-config.spec.ts:255–306`; `e2e/responsive-layout.spec.ts:100–146`; `e2e/accessibility.spec.ts:58–72,223–307`                                                                                                                                                                                                                                     |
| 47    | `unit/config/tabui-config.spec.ts:11–87,116–138,166–254`; `unit/config/asset-url-resolver.spec.ts`; `unit/shared/run-cleanup-steps.spec.ts`                                                                                                                                                                                                                                                                                                                                  |
| 48    | `unit/callbacks/yes-no-callbacks.spec.ts`; `e2e/contained-dialog.spec.ts:3–39,62–221`                                                                                                                                                                                                                                                                                                                                                                                        |
| 49    | `unit/callbacks/contained-dialog.spec.ts`; `e2e/contained-dialog.spec.ts:223–510`                                                                                                                                                                                                                                                                                                                                                                                            |
| 50    | `unit/model/score-serialization.spec.ts:90–278`; `unit/model/score-serialization-exhaustive.spec.ts`                                                                                                                                                                                                                                                                                                                                                                         |
| 51    | `unit/model/score-serialization.spec.ts:279–817`; `unit/model/serialized-value-reader.spec.ts`                                                                                                                                                                                                                                                                                                                                                                               |
| 52    | `unit/model/serialization-wire-contract.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 53    | `unit/demo/score-persistence-controls.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 54    | `unit/demo/editor-fixture.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 55    | `integration/package-consumer/pack-consumer-smoke.mjs`                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Assessment results

The decisions below record the static assessment. See the progress table and
implementation log for applied changes and verification results.

### Group 1: complete

#### Direct removals

- `set-fret-command.spec.ts:78–92`, fresh-command redo guard: normal command
  history cannot reach this sequence. Valid redo remains covered by state tests.
- Same file, `:115–148` and `:150–175`, element-diff tests: remove internal diff
  membership checks. The browser timed-input test checks visible population and
  the existing fret changing from `12` to `3`. Exact diff membership is the
  coverage given up; no replacement is needed. Remove now-unused imports too.
- `editor-keyboard-callbacks.spec.ts:180–211`: remove the whole mocked shortcut
  table, all eight rows. Real dead-note/rest behavior survives at `:750–787`;
  browser shortcut parity/undo survives at `keyboard-editing.spec.ts:59–81`;
  deletion survives at browser `:198–221` and keyboard unit `:727–748`.
  Keyboard unit `:473–490` already checks rendering/default prevention for the
  seven non-`x` actions. Exact internal routing assertions are not worth retaining.

#### Replacement-dependent removals

- Keyboard unit `:808–822`, accepted Backspace: use a real controller and
  populated note. Dispatch through `onKeyDown`; assert cleared fret, accepted
  event, render notification, and history restoration instead of setter calls.
- Keyboard unit `:1029–1067`, mixed navigation/clear: replace mock direction
  calls with real Up/Down selection. Use distinct populated notes and verify
  clearing affects the reached note, not the other note. Preserve accepted
  events. Do not delete the current vertical-direction protection first.

#### Minor cleanup

- Command `:94–113`: keep `affectedModels`; rename the test to describe the
  affected beat anchor. This is an explicit repository contract.
- Keyboard `:766–787`: keep the real rejected-dead-note state/history test;
  remove only the setter spy and its assertion.
- Keyboard `:789–806`: keep all three rejected-Backspace rows; remove the
  additional direct `clearFretEvent()` invocation.
- Keyboard `:974–1008`: retain controlled time and assert real frets `1`, `12`,
  `3`, then unchanged `3` after invalid input, instead of setter call history.
- Browser `editor-interactions.spec.ts:18`: use exact `"12"`, not `/12/`.

#### Keep

- Command `:8–29`, normal execute/undo/redo; `:31–53`, clearing with null;
  `:55–76`, maximum fret; `:177–215`, rest conversion and restoration.
  The rest test already asserts fret `7` after redo; add nothing.
- Keyboard `:750–764`, real dead-note/rest sequence; `:1010–1027`, rapid digits
  across voice changes.
- Browser timed-input test, with the exact-text cleanup above.

No concrete formatting violation was established. Apply the current logical-block
guidance when rewriting; multiple related assertions do not require separate tests.

### Group 2: complete

No test declarations are marked for removal.

- `tests/unit/callbacks/fret-controls-callbacks.spec.ts`, “applies no fret, dead,
  and numeric values”: near-full rewrite. The current internal controller mock
  proves forwarding only. Use a real controller and selected note through the
  public callbacks, or real dialog interaction. Preserve frets `5`, `-1`, `null`,
  and `12`, and dialog closure. Do not retain setter-call ordering as the oracle.
- `tests/e2e/editor-interactions.spec.ts`, both “rapid fret digits stay on their
  selected notes” modes: keep. Keyboard and mouse select different notes within
  the same digit-accumulation window and assert rendered values `1` and `2`.
- Same file, “announces a fret change but not an unchanged fret DOM write”:
  minor cleanup, not replacement. Keep the mutation observer. A final-text
  assertion misses same-text reinsertion and the live region's delayed-repeat
  behavior. The mutations are relevant browser output, not an internal side
  channel. Flush the changed action before resetting the observation window,
  advance beyond the 50 ms repeat timer after unchanged input, and include frame
  work. Replace window `any` state with typed test-owned state, disconnect/dispose
  reliably, and check the semantic live-region attributes. Retain positive
  changed-action and zero unchanged-action mutation assertions.

Sol rejected Luna's proposed removal of mutation observation: unchanged text
does not establish that the live region avoided repeated updates. Luna also
understated the callback rewrite. No changes to the rapid-input cases are needed.

### Group 3: complete

18 declarations: 12 keep, 3 minor cleanup, 2 near-full rewrites, 1 direct removal.

#### Direct removal

- `tests/unit/callbacks/note-controls-callbacks.spec.ts:115`, unsupported voice
  dataset: production creates four buttons and assigns datasets `1`–`4`. This
  test fabricates a fifth value and asserts the parser's exact error through a
  fake dispatcher. No supported arbitrary-dataset input path was found. Remove
  this defensive-parser test; normal voice-selection behavior remains covered.

#### Replacement-dependent removals

- Same file, `:11`, mixed buttons/binding test: near-full rewrite through public
  callback construction, `bind()`, and `unbind()`, real controls, and a real
  controller in a DOM-capable harness. Preserve quarter-duration, double-dot,
  triplet results; insert-before/after and removal exactly once after repeated
  binding; listener cleanup; custom-tuplet dialog opening and keyboard ownership.
  Check state/order/count/history, not cumulative mock calls. Keep the existing
  public invalid-tuplet-preset rejection separate from the mixed scenario.
- `tests/unit/callbacks/note-controls-template-renderer.spec.ts:26`: replace
  `Object.create()` and private-method calls with the public constructor and
  `render()`, real template elements, and real selection. Preserve applied
  eighth-duration, double-dot, and triplet highlighting. Jest currently uses
  the node environment, so arrange a DOM-capable harness rather than incomplete
  fake elements. No new accessibility feature is required.

#### Complete keep/minor ledger

| File                                             | Test start                               | Decision                                                                                     |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `tests/unit/model/beat.spec.ts`                  | 20, tuplet value comparison              | Minor: add unequal valid settings; positive-only equality also passes if tuplets are ignored |
| Same file                                        | 35, index equal to length                | Keep: valid boundary check; exact error wording is not required                              |
| Same file                                        | 45, valid note replacement               | Keep: result, fret, and ownership                                                            |
| Same file                                        | 63, real rest                            | Keep: null notes and public rest queries                                                     |
| Same file                                        | 84, rest copy                            | Keep: distinct copy, rest state, duration                                                    |
| Same file                                        | 107, copied note/technique ownership     | Minor: assert distinct copied technique and unchanged source ownership                       |
| Same file                                        | 126, derived fret clamp                  | Keep: public pitch and instrument limit                                                      |
| `tests/unit/controller/set-note-command.spec.ts` | 6, value/octave history                  | Keep                                                                                         |
| Same file                                        | 34, rest conversion/history              | Keep, including documented affected-model anchor                                             |
| `tests/unit/controller/set-rest-command.spec.ts` | 7, conversion preserves rhythm           | Keep                                                                                         |
| Same file                                        | 24, undo/redo content                    | Keep                                                                                         |
| Same file                                        | 45, rest to empty note lanes             | Minor: assert lane count/default note state and redo, retaining undo                         |
| Same file                                        | 63, preserve existing rest               | Keep: mixed selections can apply rest to an existing rest                                    |
| Same file                                        | 83, multiple beats                       | Keep: distinct values restored                                                               |
| `tests/e2e/keyboard-editing.spec.ts`             | 278–305, rejected rest shortcuts/history | Keep: browser rejection and unchanged undo/redo history                                      |

The rest-to-empty branch is supported: the toolbar and Shift+X reach
`TrackControllerEditor.setSelectedBeatRest()`, which chooses false for an all-rest
selection. This is not a user decision. Allocated empty note lanes are distinct
from an empty notes array.

No explicit-any style violation was established: the test ESLint configuration
allows it. The substantial issues are mock-only outcomes and bypassed public
construction/rendering. Luna understated the callback rewrite and missed weak
copy/equality assertions; Sol resolved those from the implementation.

### Reviewer quality and pause

Sol found substantive errors in Luna's Group 1 review: it proposed removing the
explicit affected-model contract, overlooked real state/history assertions in
the rejected-dead-note test, and proposed a redo-fret assertion already present.
It also missed evidence supporting removal of the remaining shortcut rows.

This meets the user's stop condition for repeated poor results. No new Luna
reviews will be launched. The user has since approved Sol implementing the marked
removals and rewrites, and now continuing Groups 4–6 with independent Sol review.

## Implementation log

- Groups 1 and 3: assigned to separate Sol agents with non-overlapping test files.
- Added `jest-environment-jsdom@^29.7.0` for real controls and public renderer
  tests. Three controls specs select it per file; global Jest remains node.
  The required dependency tree updates shared `hasown` from 2.0.2 to 2.0.4.
- Group 2: the earlier final-review request failed with a server error, request
  `1378a990-82d8-49de-9f27-81f999bf326b`. The fresh Sol assessment succeeded;
  implementation is complete with separate E2E test ownership.
- Independent Sol reviews passed for Groups 1–3. Verification is complete with
  the timeout and unrelated lint failures recorded below.

### Group 1 implementation

- Removed the three marked command tests and all eight generated shortcut rows.
- Replaced mocked Backspace and vertical-navigation checks with real controller
  state through `onKeyDown`; applied the smaller assertion and title repairs.
- Targeted unit checks passed: 95 tests across two suites, including test
  TypeScript compilation. Changed-file ESLint, Prettier, and diff checks passed.
- Temporary test-only sensitivity probes for ignored Backspace, reversed Down,
  and an expired digit window failed as expected and were restored.
- Independent Sol implementation review passed with no blockers. It confirmed
  real state/history and distinct-note navigation assertions, and the surviving
  coverage supporting removals. Repository verification results are below.

### Group 2 implementation

- Replaced the callback mock with a per-file DOM test using a real controller,
  real fret dialog, and a minimal typed notation-owner adapter. It asserts all
  four fret values and actual dialog closure.
- The announcement test retains mutation observation with a typed browser handle,
  semantic live-region checks, settled observation windows, controlled timers and
  frames, and reliable observer/handle cleanup. Rapid-input cases are unchanged.
- Targeted unit test and test-project type checking passed. Changed-file ESLint
  and Prettier passed. Independent Sol review passed with no blockers; browser
  execution is part of the full verification run.

### Group 3 implementation

- Replaced fabricated note controls and private renderer calls with real public
  construction, real DOM controls, model outcomes, and selected-state rendering.
- Removed the synthetic invalid-voice-dataset test. Kept invalid-tuplet-preset
  rejection as a focused public-method test without exact error wording.
- Strengthened tuplet comparison, copied-technique independence, and rest-to-empty
  lane/default-state/history assertions.
- Targeted checks passed: four suites, 18 tests, and test-project compilation.
  Changed-file ESLint, Prettier, dependency resolution, and diff checks passed.
- Temporary runtime mutations for wrong insertion direction and always-equal
  comparison failed the intended tests and were restored.
- Independent Sol implementation review passed with no blockers, including
  cleanup, public-boundary coverage, and the dependency-tree changes.

### Groups 1–3 repository verification

- `npm run verify`: failed at one browser timeout; do not count it as a clean
  full-run pass. Type checking, package build, all 94 unit suites (994 tests),
  and the package-consumer smoke test passed before that failure.
- Full Chromium/Firefox run: 248 passed, 1 skipped, 1 failed. The unchanged
  `keyboard-editing.spec.ts` scenario “view-only mode rejects editing shortcuts
  but permits navigation” exceeded its 10-second limit in Chromium while pressing
  keys. No assertion mismatch was reported. All changed browser scenarios passed.
- Targeted rerun of that exact Chromium scenario: passed (3.7 seconds). No test
  or production changes were made for the timeout. This suggests a timing/load
  issue, but one passing rerun does not establish its cause.
- `npm run build:demo`: passed separately because the failed browser command
  prevented the final demo-build stage of `verify` from running.
- `npx eslint .`: failed on seven errors in unchanged files:
  `demo/data/helpers.ts` (unused `excludedStrings`), `demo/vite-env.d.ts`
  (four uppercase property names), and `scripts/benchmark-updates.ts`
  (two uppercase property names). These are outside the audit changes.
- Changed-file lint checks passed during implementation. Final changed-file
  Prettier checks and `git diff --check` passed.
- Groups 1–3 are implemented and reviewed. No production code was changed.

### Groups 4–6: completed

- Separate Sol agents own each group, using the original manifest and baseline
  test titles to account for line shifts from Groups 1–3.
- Existing uncommitted work is preserved. The coordinator owns this document;
  implementation agents own only their assigned test files or test sections.
- Independent implementation reviews passed after the Group 5 fixture correction
  and Group 4 browser-oracle correction. Verification details are below.

### Group 5: assessment and implementation

Scope: `tests/unit/model/score.spec.ts` and `staff.spec.ts`. All 20 test
declarations are retained; no removal was justified. Independent review found
one boundary-fixture blocker; Sol corrected it and the independent recheck passed.

- Replaced the inconsistent insertion fixture with the supported master-bar
  removal/restoration path used by undo. Assert exact restored order and identities.
- Strengthened append/removal across three staves in two tracks: verify retained
  and removed bars, master-bar links, returned index, and exact maps.
- Track creation now checks actual master-bar links, not just matching counts.
- Rejected operations preserve existing state. Removed exact error wording where
  it is not a documented contract.
- Corrected two overstated titles. Retained repeat validity, track ordering,
  notation-flag independence, and staff traversal/sequence tests.

Final disposition by baseline behavior:

| Behavior                               | Decision                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| Default score graph                    | Keep; accurate title                                       |
| Add track/default staff                | Harden identity and alignment                              |
| Insert ready master bar                | Replace invalid setup; retain requested-position guarantee |
| Remove track/neighbor                  | Keep; use public setup                                     |
| Reject last-track removal              | Harden preserved state                                     |
| Move track                             | Keep exact order                                           |
| Reject invalid track moves             | Keep rejection; drop exact error text                      |
| Reject last master-bar removal         | Harden preserved master/staff bar                          |
| Append master bar                      | Harden multi-track/multi-staff identities and map          |
| Remove master bar                      | Harden retained/removed identities, map, and index         |
| Add track to multi-bar score           | Harden master-bar links                                    |
| Matched/unmatched repeats              | Keep                                                       |
| Separate repeat sections/ordinary bar  | Keep; correct overstated title                             |
| Later start supersedes unmatched start | Keep                                                       |
| Repeat start/end on one bar            | Keep                                                       |
| Independent notation flags             | Keep                                                       |
| Invalid staff-bar index                | Harden unchanged state                                     |
| Reject last staff-bar removal          | Harden unchanged state; drop exact message                 |
| Cross-bar forward/backward traversal   | Keep exact beat identities                                 |
| Flattened beat sequence                | Keep ordered identities                                    |

Targeted verification: test TypeScript compilation and both suites passed (20
tests); changed-file ESLint, Prettier, and diff checks passed. A temporary wrong
removal-index probe failed the intended identity assertion and was restored.

Independent review found that invalid staff indices were tested with only one
bar, allowing the separate last-bar guard to satisfy both throws. The required
correction uses two real bars, checks negative and upper-bound indices, and
preserves their order. The last-bar test remains separate. Other Group 5 changes
passed review.

The correction is implemented. Bypassing index validation while retaining the
last-bar guard failed the corrected test. The probe was removed; all 20 tests,
test compilation, lint, format, and diff checks passed again. Independent Sol
recheck passed with no remaining blockers.

### Group 4: assessment and implementation

Implemented; independent review and targeted browser verification passed after
correcting the transient-decoration oracle described below. References
below identify the original baseline tests, not shifted current line numbers.

#### Direct removals

- `selection-cursor.spec.ts:123`, missing-voice seed: the destination voice was
  already present because staff creation copied it. Ordinary traversal survives;
  real missing-voice creation is covered by controller tests at baseline 1110/1131.
- Same file, `:233`, invalid `afterAddedBar`: removes exact error behavior for an
  unsupported sequence. The full-final-bar test now completes real insertion.
- `editor-keyboard-callbacks.spec.ts:283`, four mocked voice-cycle rows: rendered
  four-voice cycling remains in the browser scenario. Recomputed routing
  expectations add no meaningful separate guarantee.

#### Replacement-dependent removal

- `editor-mouse-callbacks.spec.ts:593`, mocked voice-click refresh: replaced by
  clicking a filled inactive note in the existing browser voice scenario and
  observing active voice buttons and SVG opacity. The corrected replacement
  passed in Chromium and Firefox.

#### Rewrites and hardening

- All eight `tab-note-slot-element.spec.ts` scenarios remain: real SVG hit-target
  ownership/pointer behavior; later empty attacks; quarter/half matching by attack
  time; active-filled and all-empty slots; rendered Let Ring parentheses and width;
  literal square outline dimensions; and real preview/cursor geometry. Geometry
  checks require the elements and attributes before comparing them.
- Cursor previous-bar traversal now starts in the second bar, with three beats
  in the previous bar, and checks destination and retained lane. Full-final-bar
  navigation completes real bar insertion. Vertical wrapping uses literal lane 5.
- Retained cursor scenarios: rest state, seed-state growth, first-bar boundary,
  existing next bar, nearest-voice fallback both ways, lower-voice tie, view-only
  final bar, and recovery after real structural shrink.
- Controller new/existing voice tests use actual voice/selection/materialization
  state instead of update-call counts. Missing-voice navigation proves absence
  before the action and checks active voice and first-beat selection afterward.
  Range outer-edge traversal remains unchanged.
- Browser voice cycling preserves four cycles, toolbar parity, hit geometry, and
  opacity. It now also checks unchanged rendered score on an existing-voice
  switch and inactive-note click refresh.

Seven unit cases removed: six direct and one browser-backed replacement. Targeted
checks passed: five suites, 233 tests, test and production type checking, changed
lint/format, and diff checks. Temporary no-op probes for cross-bar left movement
and note SVG rendering failed the intended tests and were restored.

Independent Sol review passed: all eight rendering scenarios remain, geometry
requires real elements, and the browser replacement clicks an actual filled
inactive note and checks both active buttons and opacity. It confirmed all seven
removed cases and the surviving coverage.

### Group 6: assessment and implementation

Implemented; independent review and browser verification passed. No direct
test removals. Three mock/private callback declarations were replaced by four
declarations producing five cases. Unit cases changed from 17 to 19; both browser
scenarios remain.

| File / baseline behavior                                                     | Decision                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `track.spec.ts`: default staff                                               | Keep public constructor guarantee                                            |
| Same file: upper-bound staff removal                                         | Keep supported rejection                                                     |
| Same file: remove last staff                                                 | Harden removed/replacement entries and distinct replacement identity         |
| Same file: insert staff alignment                                            | Harden insertion, ownership, and exact master-bar sequence                   |
| Same file: shared instrument context                                         | Keep                                                                         |
| Same file: keep-frets tuning                                                 | Keep literal fret/pitch outcomes                                             |
| Same file: transpose tuning                                                  | Keep literal outcomes                                                        |
| Same file: conventional tuning order                                         | Harden literal G2/G4 pitches and upper-string fret 3                         |
| `instruments.spec.ts`: tuning/string-count mismatch                          | Keep constructor rejection                                                   |
| Same file: first supported default tuning                                    | Harden literal four-string notes/octaves, not another default instrument     |
| Same file: ukulele tuning                                                    | Harden literal tuning, not its source constant                               |
| Same file: chromatic octave boundaries                                       | Harden known E2 frequency 82.4069 Hz; ratios alone permit zero frequencies   |
| Same file: tuning shift helpers                                              | Keep independent worked examples                                             |
| Same file: default conventional string order                                 | Keep literals and unsupported-count result                                   |
| `track-settings-callbacks.spec.ts`: validation/lifecycle and tuning steppers | Replace both mock/private declarations with real controls and model outcomes |
| `new-track-controls-callbacks.spec.ts`: validation/lifecycle                 | Replace mock declaration with real creation and instrument-edit scenarios    |
| Browser new-track tuning labels                                              | Retain; also activate new seventh-string control by Space and check C        |
| Browser tuning announcement/focus                                            | Keep unchanged                                                               |

Callback replacements use public construction, rendering, binding, and real DOM
clicks. Track settings cover Drop D confirmation in KeepFrets and Transpose modes,
instrument selection, tuning steps, repeated binding, and unbinding. New-track
controls cover rejected whitespace/overlong names, trimmed-name creation and
selection, dialog closure, keyboard release, unbound submission, and a seven-string
instrument with chosen tone and edited tuning. Newly created tuning controls must
receive working listeners. Exact mock routing/counts and private render counts are
discarded; the useful behavior is protected by state and DOM outcomes.

Targeted verification passed: four suites, 19 tests, test/production compilation,
changed-file lint/format, and diff checks. Temporary probes reversing tuning
direction and skipping new-control binding failed the intended assertions and
were restored.

Independent Sol review passed with no required fixes. It confirmed public control
boundaries, cleanup, literal pitch/frequency expectations, supported input
rejections, and retained lifecycle coverage. The staff upper-bound rejection is
not masked by a later guard. Optional additional reference-identity assertions
were not required for the implemented behavior guarantees.

### Groups 4–6 repository verification

- `npm run verify`: failed in the browser stage. Type checks, package build,
  all 94 unit suites (989 tests), and consumer smoke passed.
- Browser results: 246 passed, 1 skipped, 3 failed. The changed voice-cycle
  scenario failed in both browsers because its score snapshot included a
  transient end-gap hint (`+`) whose DOM presence depends on active-voice capacity.
  Pointer movement alone cannot stabilize it. Sol added a scenario-local filter
  for that exact class token, retaining all notation, attributes, and toolbar
  state. The shared snapshot helper is unchanged. Both browsers then passed.
- Sensitivity check: applying real vibrato before switching voices still failed
  the unchanged-score assertion in both browsers. The probe was restored and
  the final two-browser run passed. Independent Sol recheck approved the narrow
  filter and retained voice, geometry, opacity, and inactive-click assertions.
- The unchanged Chromium view-only shortcut test again exceeded its 10-second
  limit while pressing keys. Its exact targeted rerun passed in 4.0 seconds;
  no changes were made to that scenario. The full run is not a clean pass, and
  this repeated full-suite timeout remains unresolved.
- Group 6 browser scenarios passed in both browsers.
- Demo build passed separately; the browser failure skipped that final verify stage.
- `npx eslint .`: the same seven errors remain in unchanged demo/benchmark files
  listed in the Groups 1–3 verification section. Changed tests passed targeted lint.
- Unit count: 994 after Groups 1–3 to 989 after Groups 4–6 (net five fewer cases).
  This reflects seven removed cases in Group 4 and two additional real-behavior
  cases in Group 6, not a count target.
- Groups 4–6 are implemented and independently reviewed. No production code or
  dependencies changed in this round. Groups 7–55 were not started at that point.

### Groups 7–9: implemented and reviewed

- Separate Sol agents own each group, with disjoint declaration ownership in
  shared files. The coordinator owns this document and the combined verification.
- Existing staged and unstaged changes are preserved.
- Initial repository-wide `npx eslint .` passed. The seven lint errors recorded
  in earlier rounds are no longer present in the current working tree.

### Group 9: assessment and implementation

Independent review passed with no blockers. References use baseline titles and
ownership.

- Replaced command-manager counters with real fret edits, intermediate state,
  returned commands, history availability, redo invalidation, and clear behavior.
  The clear fixture now has both undo and redo entries.
- Strengthened controller append/undo/redo with preserved original content and
  restored quarter-rest content. Redo creates a new appended beat.
- Replaced mocked Ctrl shortcut routing with real lowercase/uppercase copy,
  paste, undo, and redo outcomes. Replaced mixed mock routing with real F2/Tab
  ignored-event, selection, content, and history checks.
- Removed the direct command-handler forwarding test. Copy/paste/history remain
  in the new shortcut scenarios; deletion remains in browser range-removal tests;
  Space start/pause remains in browser editor interactions. Exact forwarding and
  cumulative render-call counts are given up.
- Both owned browser declarations are retained unchanged. Owned declarations
  changed from 11 to 10; expanded cases from 25 to 23.
- Focused checks passed: three suites (167 tests), test TypeScript compilation,
  changed-file lint/format, and diff checks.
- A production issue was discovered: copying first-string fret 5 onto fret 9
  throws `Calculated fret below valid range`. `SetNoteCommand.applyNoteState()`
  sets octave before pitch, producing an invalid intermediate note. The passing
  shortcut fixtures use same-octave frets 5 and 3. No production fix or failing
  regression has been retained. Independent review confirmed this is an existing
  defect, not a blocker for the audit: mocked baseline tests never established
  cross-octave paste correctness. A separate fix and regression test are needed.
- Independent focused execution passed all ten owned unit cases across three
  suites (157 unrelated cases skipped). Review confirmed justified removals,
  real attached fixtures, sensitive history assertions, and retained browser
  parity/deletion coverage. No required changes were found.

### Group 8: assessment and implementation

Independent review passed. All 15 owned declarations remain: 12 improved
and three unchanged. One parameterized declaration adds a final-bar case, giving
16 owned cases. No behavior guarantee was given up.

- Append/insert/prepend command history now checks exact order, identities,
  master-bar links, and affected-model anchors across three staves in two tracks.
- Removal command history checks restored staff identities, tempo, and second-track
  content (fret 9, eighth duration, one dot). Unordered duplicate input verifies
  sorting and deduplication of original indices. The affected-model test remains,
  with its obsolete update-request title corrected.
- `ScoreEditor.removeBars` now checks exact survivors and returned master/staff-bar
  identity maps in ascending original-index order for duplicate unordered input.
- Controller range insertion uses exact counts and preserved original order.
  Removal checks exact survivors and single-operation history, including selecting
  all bars while retaining the final bar. Unneeded explicit element refresh calls
  were removed from owned scenarios.
- Single-cursor before/after insertion and real Shift+Delete behavior remain
  unchanged: their state, selection, event acceptance, and history checks suffice.
- Focused checks passed: seven suites (193 tests), final removal-command rerun
  (three tests), test TypeScript compilation, lint/format, and diff checks.
- Independent review found no blockers and independently passed all 193 tests
  across the seven relevant suites. It confirmed supported fixtures, exact
  identity/map contracts, retained coverage, and normal controller updates.
- Applied the reviewer's optional exact staff-bar length checks after leading-range
  undo and redo, closing the possible extra-trailing-bar assertion gap.

### Group 7: assessment and implementation

Independent review passed. Baseline 29 declarations / 37 cases became 27
declarations / 32 cases: eight kept, 15 strengthened or cleaned up, four weak
tests replaced, and two direct removals.

- Beat commands now check affected-model anchors, exact order through history,
  six allocated note lanes, copied content and ownership on restoration, and
  independent voice-2 insertion/history. Restored copies do not require original
  beat identity.
- Controller explicit-anchor insertion uses an anchor distinct from the cursor.
  Cursor insertion preserves nonzero lanes 2 and 3; full-range deletion checks
  replacement-rest selection and null note. Corrected two misleading titles.
- Replaced the fabricated three-scale renderer table and mocked click delegation
  with real controller elements, SVG geometry and public attributes, repositioning,
  real bubbling events, updated last-beat anchors, detachment, and target removal.
- Removed fake playback-attribute propagation: real browser hint visibility remains.
  Arbitrary fabricated scale factors, exact node reuse, and direct Starting-state
  attribute propagation are given up.
- Replaced eligible/ineligible end-gap mouse routing mocks with real insertion,
  model order, selection, history, and unchanged-state checks for full/overflow,
  view-only, inactive-voice, and secondary-button input.
- Removed the gap-specific playing/paused routing table. Paused is not a valid
  playback state; generic playback seeking and controller insertion guards remain.
- Browser gap insertion starts with fret 1 and requires exact rendered frets
  `["1", "7"]` after insertion. Hint geometry queries are editor-root scoped;
  both geometry fixtures and playback visibility remain.
- Final focused checks passed: seven suites (137 tests), test TypeScript
  compilation, lint/format for eight review files, and diff checks. Intermediate
  generic-note typing errors were corrected.
- Independent review found no blockers and confirmed valid rejection fixtures,
  cleanup, justified removals, and real renderer/controller/browser boundaries.
  Applied its optional voice-1 identity/duration checks through voice-2 history;
  all four insertion-command cases passed afterward.

### Groups 7–9 repository verification

- `npm run verify` failed at the browser stage; this is not a clean full-run pass.
  Type checking, package build, all 94 unit suites (986 tests), and the packed
  consumer smoke test passed. Log:
  `/tmp/opencode/tabui-audit-groups-7-9-verify.log`.
- Full Chromium/Firefox browser run: 248 passed, one skipped, one failed. The
  unchanged view-only shortcut/navigation scenario again exceeded its 10-second
  limit in Chromium. All changed browser scenarios passed in both browsers.
- That exact Chromium scenario passed its targeted rerun in 3.7 seconds. Its
  timeout and implementation are unchanged; the recurring full-suite timeout
  remains unresolved. Rerun log:
  `/tmp/opencode/tabui-audit-groups-7-9-timeout-rerun.log`.
- Demo build passed separately because the browser failure skipped the final
  stage of `verify`.
- Final test-project compilation, repository-wide ESLint, changed-test formatting,
  and `git diff --check` passed. The old seven repository lint errors are resolved
  in the current working tree.
- Group 8 optional staff-bar count assertions passed both focused cases after
  application.
- Group 7 optional voice-1 identity/duration checks passed all four command cases.
  Final compilation passed after both review follow-ups.
- Audit-only unit delta: Group 7 minus five cases, Group 8 plus one, Group 9 minus
  two: six fewer in total. Group 7 combined counts include four unchanged browser
  cases; unit cases changed from 33 to 28. Separate asset-resolver work added three
  unit cases, explaining the repository count of 989 to 986. Those changes are
  outside this audit and were preserved.
- Groups 7–9 are implemented and independently reviewed. This audit round changed
  tests and this record; no production or dependency changes were made by audit
  agents. Separate configuration/asset work is present in the working tree.
  Groups 10–55 are not started.

### Cross-octave paste follow-up: fixed

- At the user's request, Luna fixed the production defect discovered in Group 9.
  `SetNoteCommand.applyNoteState()` now calls the existing `note.setNote(value,
octave)` API for playable notes. Both pitch fields are assigned before fret
  calculation, avoiding an invalid intermediate pitch during paste or history.
- Adjusted the existing lowercase/uppercase Ctrl shortcut scenarios to copy fret
  9 onto fret 5, then undo and redo. Undo failed with the original implementation;
  all steps now pass while preserving the source note. This covers the same
  cross-octave transition without adding a test declaration.
- Luna's checks passed: all 986 unit tests, focused ESLint, and diff checks.
  The supervisor confirmed the source change uses the existing combined setter.

### Groups 10–12: implemented and reviewed

- Separate Sol agents own each group, using baseline titles to locate disjoint
  declarations in shared files. One independent review per group follows.
- A before-round snapshot of owned files is saved at
  `/tmp/opencode/tabui-audit-groups-10-12-before/` for review and count comparisons.
- Existing staged and unstaged work is preserved, including the cross-octave fix
  and separate asset/package-test work. The coordinator owns this document and
  combined verification.

### Group 11: assessment and implementation

Independent review passed. Ten owned declarations/cases became nine, with
one replacement-dependent merge and no direct removal without replacement.

- Corrected the supposed multi-bar paste/history fixture: its original selection
  touched only one target bar. The replacement selects both, then checks paste,
  undo, and redo, including the emptied bar's single replacement rest.
- Underfill now requires exactly one replacement rest. Same-bar undo checks exact
  restored durations. Local paste uses distinct clipboard durations and a middle
  target, proving the insertion point and preservation of surrounding beats.
- Merged the duplicate local-paste undo declaration into long-clipboard/local replacement
  coverage using the same sixteen-thirty-second/two-quarter fixture. Exact pasted
  and restored durations, unchanged bar count, and redo remain covered.
  No unique behavior guarantee was given up.
- Retained ordinary selection replacement, right-to-left source/target ordering,
  replacement-rest exclusion, and playable pitch/source-preservation scenarios.
  The intervening drag-selection declaration remains intact.
- Focused unit command (including test compilation) passed 77 tests. File lint,
  formatting, and diff checks passed.
- Independent review approved all owned declarations with no blockers and
  confirmed the merged guarantees and unchanged adjacent scopes. It corrected
  this record's overflow label: sixteen thirty-second notes underfill a 4/4 bar;
  `checkDurationsFit() === false` alone does not establish overflow. Actual
  overflow remains covered in the same-bar and note-cursor paste fixtures.

### Group 10: assessment and implementation

Independent review passed. Eleven owned unit declarations/cases became ten:
eight improved, two retained unchanged, one directly removed.

- Equal-length model replacement uses one score graph while preserving duration,
  dots, and both tuplet settings. Copied notes/techniques now prove fret copying
  and source independence after editing the copy's fret and removing its bend.
- Fewer-beat timing uses a dotted half, changing total duration from 3/8 to 3/4
  so stale timing cannot satisfy an unchanged-total oracle. More-beat timing stays.
- Removed the separate last-content/default-rest model example. Removal-command
  execute/undo/redo still protects default-rest behavior.
- Replacement command tests use complete sequences rather than filtered notes,
  exact lengths, and explicit restored dots/tuplets. Removed fresh-UUID requirements
  and repeated default-metadata assertions in cardinality scenarios. Secondary
  voice attachment/history coverage remains.
- Multi-bar setup now uses public `VoiceBar.replaceBeats` instead of manual
  splice/rebuild. The primary-voice rest test title describes observable behavior.
- Focused Jest passed three suites (37 tests), including removal coverage. Scoped
  lint and diff checks passed. Final test compilation and formatting await Group
  12's in-progress shared-file corrections.
- Independent review found no blockers across all owned declarations and passed
  all 37 focused tests. It confirmed valid public timing/multi-bar setup, sensitive
  duration oracles, direct source independence, and surviving default-rest coverage.

### Group 12: assessment and implementation

Independent review passed. All 21 declarations remain: 20 unit and one browser.
Expanded unit cases changed from 23 to 24 with double-dot multi-beat toggle
coverage. No direct removals.

- Bar tests strengthen rejected removal state, final-beat replacement results,
  append/prepend copying and preserved neighbors, and exact-fit recovery after
  overflow. Rebuild timing uses worked durations/start/end/total fractions after
  changing dots. `fillBar` now starts with an actual default rest.
- Dot validation checks preserved dots/timing rather than exact error text.
  All-selected toggling now covers single and double dots, asserting applied
  state before clearing. Existing single/mixed toggles and duration checks remain.
- Duration/dot command history uses distinct original values, multiple selected
  beats, an untouched follower, and worked timing through execute/undo/redo.
- Controller single-note duration now selects the middle of three beats and
  preserves both neighbors. Range duration checks worked starts for every beat.
- Keyboard duration/dot tests use real controller edits and history, backward
  selection, accepted events, render notifications, and an untouched third beat.
  All four duration rows and seven duration steps remain. Exact mocked routing is
  replaced by real outcomes.
- Browser rhythm-control parity/clamp coverage remains unchanged.
- Five focused suites passed 204 tests before the final dot-table expansion;
  the final score-editor rerun passed 25 tests. Final test compilation, scoped
  lint/format, and diff checks passed. Intermediate dispose-call errors are fixed.
- Independent review found no blockers or required improvements across all 21
  declarations. It confirmed correct worked timing, supported fixtures, real
  keyboard history, cleanup, preserved neighboring scopes, and retained browser
  parity/clamp coverage.

### Groups 10–12 repository verification

- `npm run verify` passed in full: type checks, package build, all 94 unit suites
  (985 tests), packed-consumer smoke, Chromium/Firefox tests, and demo build.
  Log: `/tmp/opencode/tabui-audit-groups-10-12-verify.log`.
- Browser result: 249 passed, one skipped. The recurring unchanged view-only
  shortcut/navigation scenario passed in both browsers (Chromium 9.2 seconds,
  Firefox 5.9 seconds). This run is clean; the earlier timeout history remains.
- Repository-wide ESLint, changed tracked-test formatting, audit-document
  formatting, and `git diff --check` passed.
- Audit unit delta: Group 10 minus one, Group 11 minus one, Group 12 plus one,
  giving one fewer unit case overall (986 to 985 in the full runs). All owned
  browser declarations remain unchanged.
- All three groups passed independent review. No production or dependency changes
  were made in this audit round. Existing user work and the prior cross-octave
  bugfix are preserved. Groups 13–55 are not started.

### Groups 13–15: implemented and reviewed

- Separate Sol agents own each group with disjoint declaration ownership in
  shared files. One independent review per group follows implementation.
- Before-round copies of scoped files are saved in
  `/tmp/opencode/tabui-audit-groups-13-15-before/` for review/count comparisons.
- Existing staged and unstaged changes are preserved. The coordinator owns this
  document and the combined verification run.

### Group 14: assessment and implementation

Independent review passed. Owned unit declarations changed from 18 to 16;
expanded unit cases from 41 to 39. The one browser declaration remains.

- Model bounds tests strengthen constructor/setter readback and unchanged state
  on rejection, retaining all cases without error-word coupling. Public tuplet
  range-predicate coverage remains distinct from nullable stored settings.
- Signature model timing starts both staves with fitting four-quarter content,
  then checks literal ticks/overflow after 3/4. Command history changes 4/4 to
  3/8, exercising numerator, denominator, resolution, capacity, and beat timing.
- Measure-layout coverage remains; changed-meter beat geometry derives its
  expectation from layout inputs instead of another output rectangle.
- Signature controls now use real DOM/component/controller behavior: stored 1/64
  exposes an unsupported selector value and recovery; real wheel events check
  idempotent binding, default prevention, and unbinding; confirmation checks 7/8,
  closure, history, keyboard release, and unbound submission.
- Directly removed fabricated numerator-zero validation through corrupted clamped
  display. Removed controller hash/diff checks with replacement in the browser:
  repeated visible 4/5/6 signatures, undo/redo, and repeated-signature hiding.
  Exact internal forwarding/render counts, hash/diff membership, and error-word
  matching are given up.
- Six focused unit suites passed 152 tests; the final two-suite rerun passed 35.
  Scoped lint/format and diff checks passed. Final compilation awaits correction
  of in-progress Group 13 geometry typing errors.
- Independent review found no blockers, confirmed both removals and the visible
  browser replacement, and verified supported 1/64 validation and adequate cleanup.
- Applied the reviewer's optional public-stepper setup for unbound submission;
  all three signature-controls tests passed afterward.

### Group 15: assessment and implementation

Independent review passed. Seven unit declarations/ten cases and four browser
declarations/cases per project remain. No direct removals; four mouse declarations
and one renderer declaration were replaced with real behavior checks.

- Stem/flag clicks replace an existing range with the exact clicked beat in
  view-only mode. Dot clicks remove both dots from the target while preserving
  another selected note, avoid rendering unchanged actions, and support undo.
- Real 6/8 beaming supplies two groups; available segments select their complete
  group and exclude the neighbor. Rejected starting/playing/secondary clicks check
  unchanged real state, with only transport state supplied as a narrow stub.
- Renderer tests now use public rendering and real SVG bubbling events, current
  element references, handler replacement, ignored container clicks, and detach
  cleanup instead of private fields/fake listener maps.
- Controller dot removal strengthens neighbor and selection preservation through
  history. Both playing/view-only rejection rows remain.
- Browser stem/flag scenarios begin on a different beat and use subsequent dot
  edits to prove the reached target. View-only checks the selection rectangle
  contains the clicked beat; restored dot hover color and playback blocking remain.
- Exact internal call counts/order and fake listener-map assertions are given up.
- Final focused execution passed ten cases; earlier three-suite execution passed
  125 before the last 6/8 refinement. Scoped lint and diff checks passed. Shared
  compilation/formatting await Group 13's in-progress corrections.
- Independent review found no blockers and independently passed all ten owned
  unit cases, scoped lint, and diff checks. Applied its optional selected-beat/lane
  assertions to guard against in-place cursor mutation, and require rendered beam
  segments in both expected groups. All three follow-up cases passed.

### Group 13: assessment and implementation

Independent review passed after correction of one vertical-geometry blocker.
Owned unit declarations changed from 28 to 23,
expanded unit cases from 29 to 25. Four browser declarations/five cases remain.

- Model grouping checks exact beat membership and independent dotted-duration
  expectations. Score-editor and command checks use worked starts/totals through
  applying, clearing, undo, and redo, with complete grouping on redo.
- Six geometry declarations became two rendering declarations/three cases, covering
  complete standard/custom labels, bracket endpoints at outer attacks, centered
  labels below the duration row, and incomplete per-beat attack-aligned labels
  without a bracket. Removed the unsupported internal invalid-label-index test.
- Tuplet controls now use real components/DOM/controller selection and history:
  existing ratio from a range without a cursor, independent button/wheel stepping,
  lower limits, stored model-supported 1:4 rejected by the dialog, unchanged state
  and history on rejection, confirmation/closure, repeated binding, and unbinding.
- Keyboard cycles use real range/history and preserve an unselected beat; backward
  custom-range coverage remains. Mouse selection starts elsewhere, then verifies
  complete-group replacement or only the clicked incomplete beat.
- Browser complete-label context begins with a single-note selection. Incomplete
  editing changes only the middle of three labels to `["4:2", "5:2", "4:2"]`
  and checks undo. Existing custom-cycle and mixed active-end scenarios remain.
- Given up: internal rectangle partitioning, unused coordinate-space getters,
  exact legacy vertical offsets, mock call choreography, and keyboard-release/render
  callback counts. Observable labels, bracket geometry, closure, and history remain.
- Seven focused suites passed 181 tests. Final test compilation, scoped lint/format,
  and diff checks passed. Earlier geometry typing errors were fixed with explicit
  `TabBeatElement` narrowing.
- Review found that rendered bar-local bracket/label coordinates were compared
  only with the duration-row height, omitting its bar-local origin. A tuplet
  overlapping the row could therefore pass. Required correction: use the actual
  duration-row bottom in the same coordinate space, and demonstrate failure when
  the duration-row offset is omitted. All other owned changes passed review.
- The correction renders a real duration stem and uses its SVG `y2` as the
  bar-local duration-row bottom. Complete brackets/labels and incomplete labels
  must sit below it. A test-process-only temporary transformer omitted the
  duration-height offset: all three cases failed (bracket 150 versus bottom 174;
  incomplete label 171 versus 174). The ordinary three-case run passed afterward.
  Test compilation, file lint/format, and diff checks passed. Repository source
  was never mutated; before/after source and package hashes matched.
- Independent recheck confirmed the corrected coordinate reference and sensitivity
  evidence, then independently passed all three focused cases. No blockers remain.

### Groups 13–15 repository verification

- First combined `npm run verify` stopped at test compilation: the coordinator's
  optional beam-group assertions used `includes` across differing generic beat
  types. Direct identity comparisons fixed this; test compilation then passed.
  Initial log: `/tmp/opencode/tabui-audit-groups-13-15-verify.log`.
- The rerun passed production/test type checks, package build, all 94 unit suites
  (979 tests), and packed-consumer smoke. It failed at one unchanged browser timeout.
  Log: `/tmp/opencode/tabui-audit-groups-13-15-verify-rerun.log`.
- Browser result: 248 passed, one skipped, one failed. The recurring Chromium
  view-only shortcut/navigation scenario exceeded 10 seconds while pressing keys.
  Its exact targeted rerun passed in 4.0 seconds. Its timeout/implementation remain
  unchanged. All changed scenarios passed in both browsers.
- Demo build passed separately after the browser failure skipped that stage.
  This is not a clean full `verify` pass.
- Group 13's final geometry correction passed all three focused cases, test
  compilation, lint/format, and diff checks after the combined run.
- Unit delta: Group 13 minus four, Group 14 minus two, Group 15 unchanged: six fewer
  cases (985 to 979). All owned browser declarations/cases remain.
- All three groups are implemented and independently reviewed. No production or
  dependency changes were made in this round. Prior user changes and the
  cross-octave paste fix are preserved. Groups 16–55 are not started.
- Final repository-wide ESLint, changed tracked-test formatting, audit-document
  formatting, and `git diff --check` passed.

### Groups 16–18: implemented and reviewed

- Separate Sol agents own each group. Groups 16 and 17 have disjoint declaration
  ownership in their shared rhythm test file. One independent review per group
  follows implementation.
- Before-round scoped files are saved at
  `/tmp/opencode/tabui-audit-groups-16-18-before/` for review/count comparisons.
- Existing staged and unstaged work is preserved. The coordinator owns this
  document and combined verification. The recurring full-suite timeout remains
  recorded separately; its cause is not established by passing targeted reruns.

### Group 17: assessment and implementation

Independent review passed. All ten owned declarations/eleven cases remain.

- Attack/selection geometry now uses independent padding, text extension, selected
  width, attack boundaries, and staff height instead of seeding expectations from
  output positions or the production visual-bounds getter.
- Wrapped justification requires multiple lines. Dense bars now use valid 4/4
  with 64 sixty-fourths, requiring all beats/positive widths and line containment;
  the former overfilled 32/64 dense fixture is given up.
- Voice-row height checks require exact changes on the affected line, stable
  neighbors, and restoration via public voice removal. Sparse voice rows use
  independent bar-local positions/heights. Cross-voice incomplete labels compare
  against each attack/duration stem/row bound in matching coordinate space.
- Focused file execution passed 15 cases, test compilation, lint/format, and diff
  checks. Shared setup/helpers are unchanged; Group 16 sections are preserved.
- An attempted extension crashed on an existing empty voice after clearing its
  beats and rebuilding timing: `VoiceBarContainer.measure()` reads the first
  element's height without an empty guard. No production changes/failing extension
  were retained. Independent review reproduced this through public
  `bar.insertVoiceBar(2).replaceBeats([])` followed by layout update, confirming a
  pre-existing model/layout compatibility defect. Normal final-beat removal
  resolves the voice and works; deserialization rejects empty arrays. No ordinary
  editor action leaving this state was established. This is a separate follow-up,
  not an audit blocker.
- Independent review found no blockers and passed all 15 rhythm cases, test
  compilation, file lint/format, and diff checks.

### Group 18: assessment and implementation

Independent review passed after correction of one overflow-fixture blocker.
Twelve owned declarations/cases became eleven,
with one direct removal and five replacements. Unowned Groups 19/20 are unchanged.

- Replaced copied metric formulas/intermediate counts with public bar/attack
  geometry: underfilled full-measure spacing, wrapped overflow containment,
  cross-staff attacks, signature clearance, and stable width/attacks with repeats.
- Cross-voice alignment requires real nonzero-time attacks. Relative meter widths
  require both bars on one line. Justification requires multiple lines and an
  exact first-line edge. Shortening another staff must preserve width/attack.
- Collision spacing checks the configured minimum gap. Compression requires all
  64 beats/63 positive gaps and viewport/bar containment.
- Removed the duplicate invalid-content canonical-duration example. Underfill
  remains in the replacement; Group 20 retains canonical duration versus overflow.
  Exact intermediate column counts/formulas, metric decomposition/equality, and
  the specific original overflow fraction are given up.
- Focused execution passed all 23 file tests, test compilation, file lint/diff,
  and byte comparison of the unowned suffix.
- The reviewer found that `[Quarter, Whole]` has no attack beyond the canonical
  measure end. Clamped beat widths could therefore hide incorrect normalization.
  Required correction: include a final attack beyond that end and require positive
  ordered geometry and containment. All other owned tests passed review; the
  independent 23-test file run, test compilation, and lint passed.
- The corrected fixture is `[Quarter, Whole, Quarter]`, with a third attack at
  1.25 beyond the canonical end. It requires all three elements, strictly ordered
  attacks, and final-beat containment. A test-local wrong-normalization probe
  failed containment (final right 495.3 versus bar width 415.05). The probe was
  removed; no source was mutated. All 23 file cases, test compilation, scoped
  lint/format/diff, and unowned-suffix comparison passed afterward.
- Independent recheck approved the corrected fixture and sensitivity evidence,
  then passed the focused overflow case. No blockers remain.

### Group 16: assessment and implementation

Independent review passed. Unit declarations changed from 22 to 20 and cases
from 27 to 25. The one browser declaration/case remains.

- Model subdivisions/meter/tuplet coverage remains, with complete terminal/member
  arrays and clearer diagnostics for isolated beats and 13/8 grouping.
- Shared beams now check stem-to-stem endpoints after an earlier beat, in bar-local
  coordinates. Tails check attachment, direction, 10px extent, unshared levels,
  thickness, and clear gaps. Removed artificial invalid constructor and misplaced
  tuplet hash/label tests; Group 13 retains real custom-tuplet rendering.
- Replaced corrupted beam metadata with valid beamed/isolated flag scenarios.
  Beamed dots must wholly clear the real top beam in the same coordinate space;
  standalone flag/dot geometry remains.
- Renderer uses real controller/SVG bubbling events, callback replacement, current
  segment references, visible/hit targets, and detach cleanup. Browser tail/primary
  selection proves first-two-note inclusion and third-note exclusion, with hover
  restoration and dot editing retained.
- Given up: exact invalid-construction exception, tuplet hash/literal 2:4 fixture,
  and behavior for manually corrupted beam metadata.
- All 25 owned unit cases passed, along with test compilation, scoped lint/format,
  and diff checks. Earlier concurrent Group 17 failures were superseded by its
  final passing checks.
- Independent review found no blockers and independently passed all 25 owned
  cases. It confirmed supported fixtures, same-space geometry, real event-boundary
  checks, browser selection sensitivity, and justified removals.

### Groups 16–18 repository verification

- `npm run verify` passed in full: type checks, package build, all 94 unit suites
  (976 tests), packed-consumer smoke, Chromium/Firefox tests, and demo build.
  Log: `/tmp/opencode/tabui-audit-groups-16-18-verify.log`.
- Browser result: 249 passed, one skipped. The recurring unchanged view-only
  shortcut/navigation scenario passed in Chromium (9.6 seconds) and Firefox
  (5.9 seconds). This run is clean; earlier timeout history is preserved.
- Group 18's final overflow-fixture correction additionally passed all 23 file
  tests, test compilation, and independent focused recheck. No source mutation
  was needed for sensitivity verification.
- Final repository-wide ESLint, changed tracked-test formatting, audit-document
  formatting, and diff checks passed.
- Audit unit delta: Group 16 minus two, Group 17 unchanged, Group 18 minus one:
  three fewer cases overall (979 to 976). Owned browser cases remain unchanged.
- All three groups are implemented and independently reviewed. No production or
  dependency changes were made. Existing user/audit changes and the cross-octave
  fix are preserved. Groups 19–55 are not started.

### Empty installed voice follow-up: fixed

- At the user's request, Luna fixed the public-model/layout defect discovered in
  Group 17. `VoiceBarContainer.measure()` now falls back to the instrument's staff
  height when the voice has no beat elements. An empty voice adds no rhythm row.
- The existing line-height test retains the populated-voice guarantee (second
  line increases by exactly 60px, first line stays stable), then empties that voice
  through public `replaceBeats([])` and verifies the original heights return
  without a crash, before removing the voice. The empty-state step failed before
  the source fix. No new test declaration was added.
- The supervisor identified and corrected an initial test revision that dropped
  the populated-voice height guarantee; both transitions are now covered.
- Focused rhythm/layout execution passed 38 tests, with test compilation, scoped
  lint/format, and diff checks. The supervisor's full unit run passed afterward;
  log: `/tmp/opencode/tabui-empty-voice-fix-unit.log`.

### Groups 19–21: implemented and reviewed

- Separate Sol agents own each group with disjoint declaration ownership in
  shared files. One independent review per group follows implementation.
- Before-round scoped files are saved at
  `/tmp/opencode/tabui-audit-groups-19-21-before/` for review/count comparisons.
- Existing staged and unstaged work is preserved, including the cross-octave and
  empty-voice fixes. The coordinator owns this document and combined verification.

### Group 21: assessment and implementation

Independent review passed. Four unit declarations/cases and three browser
declarations/cases remain. Two private renderer tests are replaced by two tests
in the new DOM-based `tests/unit/render/editor-svg-viewport.spec.ts`.

- Materialization checks actual bar membership, nonzero placement, defined initial
  identity and restoration, and eviction of a later beat. Descendant tests require
  six classes, prove eviction, and compare restored identities without prefixes.
- Public real-controller rendering replaces fake viewport trees/private methods:
  bounded horizontal windows, middle target/neighbor output, initial-bar removal,
  and a stale beyond-end vertical offset falling back to final bars while bounded.
- Browser windows must be nonempty, evict the initial border, and restore its exact
  identity on return. Selection must fit entirely inside the viewport. Playback
  waits for Pause, checks positive cursor width and viewport intersection, then stops.
- Given up: exact private viewport ranges, diff membership, range-map contents,
  and identity encoding prefixes. Vertical stale-scroll state is supplied directly,
  rather than exercising a browser score-shrink sequence.
- Focused execution passed three suites (33 tests), production/test type checks,
  scoped lint, and diff checks. Renderer/browser formatting passed; shared tree
  formatting awaits Group 19 completion.
- Independent review found no blockers and passed the same 33 tests, test
  compilation, and scoped lint. Applied its optional generous bound: each renderer
  window must contain at most 20 of the 81 bars, rather than merely less than the
  whole score. Both renderer cases passed after the change.

### Group 20: assessment and implementation

Independent review passed. Three unit and two browser declarations/cases
remain; no direct removals or declaration replacements.

- Single-line intrinsic width uses worked geometry rather than planner output as
  its own oracle. Both tracks require one line, exact bar identity/order, widths
  710.25/285.45 and total 995.7 despite a 400px viewport.
- Equal-time cross-track attacks require actual elements and meaningful nonzero
  alignment with an intervening eighth. Overflow uses public canonical/content
  timing and exact beat membership, with both-side bar-local containment.
- Browser track switching waits for changed scrolled geometry and requires
  multiple borders before alignment comparisons. Duration editing proves an
  actual inactive-to-active Whole-note change and bar growth, preserving origin
  and positive non-overlapping neighboring bar/content extents.
- Planner-derived placement/width and direct metric assertions are replaced by
  independent values and public model/controller output. Shared setup is unchanged.
- The full 23-test bar-layout file, test compilation, scoped lint/format, and diff
  checks passed. Browser execution remains for combined verification.
- Exploratory global-coordinate containment failed (beat right 463.8 versus bar
  right 461.85). The agent suspects duplicated voice offset in `globalCoords`;
  independent review confirmed a pre-existing coordinate-API defect, not visible
  SVG overflow. `barLocalCoords` already adds the voice offset, while `globalCoords`
  and `lineLocalCoords` add a parent origin containing that offset again. Rendering
  uses bar-local geometry; `attackXGlobal`/visual bounds compose correctly. Normal
  public model construction reproduces it. No production edits were made; this
  needs a separate fix.
- Independent review found no audit blockers and passed all 23 file tests, test
  compilation, scoped lint/format, and diff checks. It confirmed independent width
  literals, actual alignment elements, nonempty overflow containment, and meaningful
  browser actions and geometry.

### Group 19: assessment and implementation

Independent review passed. All ten unit declarations/cases and one browser
declaration/case remain: six replacements and five strengthened scenarios.

- Wrapped ranges/widths now require actual wrapping and increased line count after
  narrowing. Cross-track attacks use required elements, shared nonzero musical
  times, and an intervening eighth rather than optional-value equality.
- Cross-track edits check changed attack geometry, wrapping, and containment after
  targeted updates instead of diff membership. Intrinsic/dense/final-line behavior
  uses public contiguous geometry, collision gaps, page fitting, and unused space
  instead of planner metrics as expected output.
- Density must actually widen both tracks equally; intrinsic widths stay stable
  while responsive wrapped ranges change. Planner identity/metric fields and exact
  element diff sets are given up; renderer diff delivery is not claimed.
- Tree traversal retains cross-line selection and complete bar order, with note
  containment in global coordinates including the second row's origin. Browser
  track switches compare screen-space border positions grouped by ordered row,
  scoped to the editor and polled until settled.
- Two focused suites passed 53 tests, production/test compilation, scoped lint,
  formatting, and diff checks. Shared setup and neighboring scopes are preserved.
- Independent review found no blockers and passed both focused suites (53 tests)
  and diff checks. It confirmed actual wrapping/alignment, independent intrinsic
  geometry, meaningful cross-line selection containment, and editor-scoped browser
  row grouping. Browser transitions remain the original two forward switches.

### Groups 19–21 repository verification

- `npm run verify` failed at browser execution. Production/test type checks,
  package build, all 95 unit suites (976 tests), and consumer smoke passed.
  Log: `/tmp/opencode/tabui-audit-groups-19-21-verify.log`.
- Browser result: 244 passed, one skipped, five failed, all in changed single-line
  scenarios. Chromium: selection intersection ratio 0.9999988 versus exact 1;
  playback cleanup requested a nonexistent Stop control; duration-edit origin
  differed by 0.001px. Firefox: initial border remained within the materialized
  window after scroll; playback full-page intersection was about 0.852 before
  reaching the end. Owning agents are checking/correcting these assumptions.
- The recurring unchanged view-only shortcut scenario passed both browsers.
  Demo build passed separately after the browser failure skipped that stage.
- Static review and unit passes did not establish browser correctness; runtime
  corrections and targeted two-browser verification are required before completion.
- Group 20's origin correction uses `toBeCloseTo(..., 2)` (less than 0.005px)
  for the observed 0.001px drift, tighter than its 0.01px non-overlap allowance.
  Every bar, including the final one, now requires positive width. The original
  reviewer approved the scoped correction; lint/format and test compilation pass.
- Group 21 runtime corrections passed independent recheck. Selection uses
  horizontal scroller-client bounds with 1 CSS pixel scroll-rounding tolerance.
  Playback samples active state, positive width/scroll, and horizontal containment
  in one browser frame, then uses the real Pause control. Vertical/full-page
  containment is given up for these horizontal-following scenarios.
- Materialization now finds the leftmost initial bar by geometry, not lexical ID
  order. It scrolls to the end and requires three complete bars behind the viewport
  before eviction, beyond two-bar overscan. Nonempty windows/exact restoration
  remain. No production issue was established by these browser failures.
- Corrected Group 21 checks passed three unit suites (33 tests), production/test
  compilation, lint/format, and diff checks. A full two-browser single-line spec
  rerun passed all ten cases (five scenarios in Chromium and Firefox); log:
  `/tmp/opencode/tabui-audit-groups-19-21-single-line-rerun.log`.
- Independent recheck confirmed meaningful eviction/containment, narrow rounding
  tolerance, supported Pause cleanup, and a playback sampling loop that cannot
  wait away an overflow. The playback scenario checks an active cursor after
  Last-bar navigation, which also requests selection scrolling; it does not prove
  continuous playback-only auto-follow. That boundary predates these corrections.
- Final repository-wide lint, changed-test/new-renderer-spec formatting,
  audit-document formatting, and diff checks passed. The original full run remains
  failed; all affected browser scenarios subsequently passed targeted execution.
- All three groups are implemented and independently reviewed. Unit cases remain
  976; splitting public viewport coverage into a DOM suite increases suites from
  94 to 95. All owned browser cases remain. No production or dependency changes
  were made; existing user/audit changes and both prior bugfixes are preserved.
  Groups 22–55 are not started.

### Beat coordinate offset follow-up: fixed

- At the user's request, Luna fixed the coordinate-API defect found in Group 20.
  `TabBeatElement.lineLocalCoords` and `globalCoords` now add bar-local coordinates
  to the owning bar's origin, instead of the voice origin that duplicates the
  already-included voice offset. Bar-local/rendering geometry is unchanged.
- Strengthened the existing descendant-coordinate test with a nonzero 85.5px voice
  offset and both axes of line-local/global composition, preserving its bar,
  note, and label checks. The separately added draft regression declaration was
  merged into this existing test; total test count is unchanged.
- Temporarily restoring the original composition failed the existing test with
  expected 97.5 versus received 183 (an extra 85.5). The fix was restored, and all
  95 unit suites/976 tests passed. Type checking, scoped lint/format, and diff
  checks passed. No dependency changes were made.

### Groups 22–24: implemented and reviewed

- Separate Sol agents own each group with disjoint declaration ownership in the
  shared tree test file. One independent review per group follows implementation.
- Before-round scoped files are saved at
  `/tmp/opencode/tabui-audit-groups-22-24-before/` for review/count comparisons.
- Existing staged and unstaged work is preserved, including the coordinate,
  empty-voice, and cross-octave fixes. The coordinator owns this document and
  combined verification.

### Group 24: assessment and implementation

Independent review passed. All ten owned declarations/cases remain, with two
substantial replacements and no direct removals.

- Skeleton height requires explicit two-technique-row growth and agreement with
  measured materialized height. Demand updates require exact indices, concrete
  vibrato/model associations, offscreen eviction, and gap height.
- No-op gaps check required labels, stable identities/model associations, unchanged
  global bounds, and two-row height rather than new shell/label allocations.
  Ownership requires concrete gap/row/label membership, drawable classification,
  exact added harmonic ownership, and stale-node removal.
- Track shells require all-line emptiness, positive contiguous geometry, total
  extent, and agreement with full materialization. Viewport demand preserves every
  line's bounds and leaves all other shells unmaterialized.
- Tempo shifts by exactly one technique row globally while its line-local rectangle
  and horizontal position stay fixed. Public inverted-range and skeleton-provenance
  contracts remain unchanged.
- Incidental object-replacement and merely-nonempty diff assertions are given up.
  No shared setup, mocks, private access, or production edits were introduced.
- Both focused files passed 62 tests, test compilation, scoped lint/diff, and
  techniques formatting. Shared tree formatting awaits Group 23 completion.
- Independent review found no blockers and passed all 62 cases, test compilation,
  scoped lint/format, and diff checks. It confirmed non-vacuous geometry/ownership
  and snapshot bounds unaffected by later mutation. Applied its optional explicit
  all-line materialization assertion before comparing predicted/measured bounds.

### Group 22: assessment and implementation

Independent review passed. All nine owned declarations/thirteen cases remain.
Four coordinate declarations were rewritten in place; no declaration removals.

- Outline growth uses valid sixteen-sixteenth content and requires actual width
  growth/staff-line alignment. Multi-voice/two-staff, all five voice-table cases,
  and structural addition/removal coverage remain.
- Default hierarchy checks model bindings and all six ordered note slots/backing
  notes. Immediate/descendant/helper/core coordinate tests use worked local/global
  values and natural second-line origins rather than output self-comparisons.
- Preserved the 85.5px reserve and nonduplicated beat-coordinate regression checks.
  Second-line helpers include the 234px global origin while local values exclude
  it. Two-staff core geometry requires real outlines, preventing an empty loop.
- Given up: exact outline state-hash change and overfilled seventeen-quarter
  fixture. Public outline growth, coordinate composition, and text geometry remain.
- All thirteen owned cases and the thirty-case shared file passed, along with
  test compilation, scoped lint/format, and diff checks. Shared setup is unchanged.
- Independent review found no blockers, confirmed grounded worked coordinates and
  preservation of the beat-offset regression, and passed all thirty shared-file
  cases, test compilation, scoped lint/format, and diff checks.
- Applied its optional exact per-slot backing-note identity assertions in place
  of structural equality; the focused hierarchy case passed afterward.

### Group 23: assessment and implementation

Independent review passed after correction of one renderer-reference blocker.
All twelve owned declarations/cases remain, with
two one-for-one replacements and no direct removals.

- Registry lookup requires the exact model beat; no-op updates preserve line
  shells and stable descendant identities without requiring new allocations.
  Insertion/removal checks public lookup/tree counts instead of exact diff sets.
- Targeted duration changes must actually move note geometry, preserve or change
  line ownership as appropriate, and match a full rebuild. The late regrouping
  fixture was corrected: its original edit never regrouped lines.
- Moved-bar checks prove line movement with stable identities. Middle insertion
  and deletion differential coverage remains. Append reconciliation now queries
  the actual registry; palm-mute affected-model contract remains.
- Bounded right navigation requires score growth, contiguous lines, final-bar
  ownership, and selected-beat lookup. The renderer test uses real DOM/public
  rendering: the same fret text node survives rebuild and receives a later edit
  without duplicating the text node, replacing private mock mount/render choreography.
- Given up: exact diff membership, mandatory descendant allocation, internal
  mount/render calls. Existing viewport coverage and production fixes are preserved.
- Three focused suites passed 107 tests, test compilation, scoped lint/format,
  and diff checks. No production changes or implementation blockers.
- Independent review approved eleven owned cases but found the renderer oracle
  insensitive to missing `updateElementReference`: a test-process-only removal
  still passed because the stale element shares the live note model. Required
  correction: a changed layout/DOM position that distinguishes stale/current
  elements while preserving node reuse. The same-node assertion does not measure
  DOM write count. All twelve owned cases passed runtime, which does not resolve
  this demonstrated sensitivity gap.
- The correction inserts a quarter beat before the retained note through public
  APIs, then requires the same fret-9 text node to move from 97.5 to worked x
  144.3. Existing no-op reuse/content/non-duplication checks remain. A temporary
  in-memory transformer disabling reference refresh fails at 97.5 versus 144.3;
  the ordinary uncached case passes. Test compilation, scoped lint/format, and
  diff checks passed. No repository source was mutated.
- Independent recheck reproduced both uncached runs: the normal case passed and
  the stale-reference probe failed at expected 144.3 versus received 97.5. It
  confirmed the worked quarter-spacing reference and exact mutation target.
  All twelve owned cases are approved; no blockers remain.

### Groups 22–24 repository verification

- `npm run verify` passed in full: production/test type checks, package build,
  all 95 unit suites (976 tests), consumer smoke, Chromium/Firefox execution, and
  demo build. Log: `/tmp/opencode/tabui-audit-groups-22-24-verify.log`.
- Browser result: 249 passed, one skipped. The recurring unchanged view-only
  shortcut/navigation scenario passed (Chromium 9.7 seconds, Firefox 6.8 seconds).
- This full-run pass precedes Group 23's final renderer-oracle correction, which
  still needs focused verification and independent recheck. Passing execution did
  not establish sensitivity to missing reference refresh.
- Optional Group 22 backing-note identity and Group 24 full-materialization
  follow-ups passed their focused cases. Unit declarations/cases are unchanged.
- Group 23's final renderer correction passed focused test compilation/lint/format
  and independent normal/sensitivity runs after full verification. Final
  repository-wide lint, changed-test/audit formatting, and diff checks passed.
- All three groups are implemented and independently reviewed. No unit declarations
  or generated cases were added/removed (95 suites, 976 tests). No production or
  dependency changes were made in this round. Prior user/audit changes and all
  three production fixes are preserved. Groups 25–55 are not started.

### Groups 25–27: implemented and reviewed

- Separate Sol agents own technique application rules, inline techniques, and
  technique labels/removal. Each implementation receives an independent review.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-25-27-before/`. Shared files use disjoint
  declarations mapped from baseline titles, not current line numbers.
- Existing test improvements, production fixes, and separate repository cleanup
  are preserved. Cleanup commits `fae0cf7dd2c8c269a9f765784a0cd95659aae28e`
  and `d9b68fad48f18aa63ebc538565bf291fd8645cae` are user work.
- The coordinator owns this record and combined browser/full verification.

### Group 25: assessment and implementation

Independent review passed after correcting the rejected-redo removal rationale.
All 27 owned declarations/48 generated cases
remain. Six unit files changed; the owned browser declaration remains unchanged.

- Real DOM controls, public rendering, and real cursor/range edits replace callback
  routing mocks and private renderer access. Coverage includes binding/unbinding,
  technique actions, bend dialog opening, selected/disabled state, range protection,
  rejection, and undo/redo. Required affected-model note anchors remain.
- Model checks strengthen rejection preservation, bend identity/options/no-op state,
  eligible/ineligible transitions, and missing bend options without side effects.
- Given up: the exact rejected-command redo exception check, exact internal bend
  delegation counts, and redundant unchecked transition application. Valid redo,
  real dialog opening/post-unbind rejection, and rejected unchanged state remain.
- Review corrected the initial removal rationale: rejected commands can enter
  normal history. Dropping the exact exception assertion is intentional; preserving
  current faulty behavior is not a coverage goal. The reachable history failure is
  recorded below as a production follow-up, not dismissed as unreachable.
- Focused six-suite run passed 149 tests; final model checks passed 22. Scoped
  lint/format/diff passed. Initial test compilation was blocked by concurrent
  technique-tree edits; Group 26 subsequently reported successful compilation.
- Independent review passed all six focused suites (149 tests), test compilation,
  scoped lint/format/diff and approved all rewrites. Its documentation-only recheck
  confirmed the corrected reachable-history finding and intentional coverage
  tradeoff. No remaining Group 25 audit blockers; production follow-ups remain.

### Group 25 production finding: mixed populated/empty range toggle

- User requested a fix for both findings. Luna implemented empty-slot range
  toggling and no-change command history/redo preservation. Final independent
  review and full verification are running; the results below describe discovery
  and the subsequent fix separately.
- Reported reproduction: populate string one in two beats, select both, press `v`
  twice. Vibrato remains applied. `ScoreEditor.setTechniqueNotes()` includes empty
  string slots when deciding whether all selected notes have the technique.
- No production fix was made. The rewritten application/removal table uses fully
  populated chords, preserving the original guarantee. Independent review will
  assess this finding separately from the test-audit changes.
- Independent review reproduced the mixed empty-slot range behavior and a related
  reachable history failure: apply vibrato twice, undo, then redo throws
  `Redo called before execute`. The editor submits a rejected/no-change command;
  `CommandManager` pushes it without checking `executed`, undo transfers it to redo,
  and `SetTechniqueCommand.redo()` throws. The removed exact-error assertion was
  therefore reachable, contrary to the initial implementation report. No fix was
  made; both toggle behavior and rejected-command history need follow-up.
- Fully populated chord fixtures are supported and preserve the old mocked
  apply/remove guarantee. They do not cover this separate empty-slot behavior.

### Group 25 toggle/history follow-up: fixed and reviewed

- `ScoreEditor.setTechniqueNotes()` decides removal using populated guitar notes
  only. Empty string slots no longer prevent toggling an applied technique off.
- `Command` exposes optional `executed`; explicit false means no edit to record.
  `CommandManager.execute()` returns before pushing history or clearing redo for
  that result. Commands without an execution flag retain their existing behavior.
- Existing model coverage now selects two beats with first-string frets 5/7 and
  ten empty slots, requires successful application before removal, and checks all
  empty slots remain unchanged. Existing manager coverage rejects an incompatible
  technique after undo, preserves the original redo entry, redoes its fret edit,
  and retains the valid-new-edit clearing/undo guarantees.
- Luna reproduced each merged regression against its respective old production
  code, then passed all 95 unit suites/976 tests and test compilation. No test
  declarations were added or removed. Scoped lint/format/diff checks passed.
- The supervisor added explicit positive application/two-beat/empty-slot checks
  and execution-contract documentation. Independent Sol review and final
  `npm run verify` are running. Log:
  `/tmp/opencode/tabui-technique-toggle-history-verify.log`.
- Independent Sol review approved both fixes with no blockers. Four focused
  suites passed 39 tests. Public-controller reproduction passed apply/remove and
  repeated undo/redo for first-string frets 5/7 plus ten empty slots, preserving
  frets/empties without exceptions. Runtime probes passed explicit true, false,
  and unspecified execution states; scoped lint/format/diff checks passed.
- Applied the optional manager JSDoc correction to describe rejected/no-edit
  execution accurately. Review used Git diff because before-snapshot access was
  denied; it excluded earlier audit changes from the production-fix verdict.
- Full verification passed production/test compilation, package build, all 95 unit
  suites/976 tests, and consumer smoke. Browser execution failed two Firefox cases:
  bend-dialog keyboard opening (`bend-controls.spec.ts:220`) and inline slide
  creation (`inline-technique-interactions.spec.ts:4`); 247 passed, one skipped.
  Do not count this as a clean full-run pass. Exact-case reruns are running; demo
  build is running separately because verify stopped at the browser failures.
- Both exact Firefox cases passed unchanged on targeted rerun (2.2/2.6 seconds).
  Log: `/tmp/opencode/tabui-technique-toggle-history-browser-rerun.log`. Their
  full-run failures remain recorded; this rerun does not establish their cause.
- Separate demo build passed. Repository-wide lint, changed-source/test formatting,
  audit formatting, and diff checks passed. Both requested fixes are complete and
  independently reviewed, with no added test declarations (95 suites/976 tests).
  No dependency changes or commits were made. Prior work is preserved.

### Group 26: assessment and implementation

Independent review passed. All twelve declarations/nineteen generated cases
remain; no direct declaration removals.

- Preserve slide direction, harmonic alignment at three text sizes, cross-bar and
  cross-line transitions, and target-fret clearing. Cross-line targets must remain
  on another rendered line; clearing requires a path to exist first.
- Inline addition checks actual slide geometry and undo/redo instead of internal
  diff membership/concrete class. Explicit affected-model anchors and line ownership
  remain. Duplicate algebraic edge checks are removed; global edge checks remain.
- Vibrato uses a complete tuplet fixture, required labels/segments, and joins in
  matching coordinate spaces. Renderer events use real controllers/elements/DOM,
  preserving current reference, callback replacement, detachment, and reuse.
- Browser inline cases control timing, match exact rendered source/target frets,
  require nonempty paths, and check restored geometry/frets after undo. Keyboard
  transition/mouse parity coverage remains and is strengthened.
- Focused unit files passed 33 tests; owned title filter passed twelve. Test
  compilation, scoped lint/format, and diff checks passed. Browser execution awaits
  combined supervisor verification.
- Independent review approved every owned declaration, including retained tests,
  and passed both focused suites (33 tests). It confirmed matching vibrato join
  coordinates, non-vacuous path checks, and current-element callback identity that
  detects stale renderer references despite a shared live model. No blockers.

### Group 27: assessment and implementation

Independent review passed. All seventeen owned declarations/nineteen cases
remain. Six declarations are substantial replacements; no direct removals.

- Technique rows require actual labels, note ownership, compact noncontiguous rows,
  expansion and collapse after undo, and intermediate vibrato removal/reapplication.
  Second-row assertions require elements instead of fallback coordinates.
- Palm mute uses two beats and requires real position/width changes plus alignment
  with independently observed note center. Let ring requires one shared LR label
  per applied beat across two beats.
- Controller removal preserves selected non-target notes and unrelated techniques
  through history. Vibrato layout requires exactly one-row displacement and model
  state; the fixture uses twelve added bars instead of eighty.
- Two renderer and four callback rewrites use real models/controllers/DOM events.
  They check current-element dispatch, detachment, real targets/transforms after
  duration edits, cleanup/rerender, owning-beat removal scope, ignored bend labels,
  rejected/secondary/no-op clicks, history, and detached behavior.
- Three browser cases use measured text geometry for symmetric positive padding
  and matching transforms, preserving surviving-label identity and fret text.
- Given up: internal attach/detach counts, synthetic descriptor/type transitions,
  and exact fabricated text rectangles. Real interaction, geometry, and cleanup
  coverage remain. No production or shared setup changes.
- Four focused suites passed 158 tests; test compilation including browser specs,
  scoped lint/format, and diff checks passed.
- Independent review approved all owned cases and coverage tradeoffs. Its runtime
  probe confirmed distinct rebuilt labels, stale callback references without
  refresh, and stale paths without refresh after duration edits. Applied its
  optional direct-identity callback assertions to avoid deep graph comparisons.
- After full verification, the identity-only follow-up passed both renderer cases,
  scoped lint/format, audit formatting, and diff checks.

### Groups 25–27 repository verification

- `npm run verify` passed: production/test type checks, package build, all 95 unit
  suites (976 tests), consumer smoke, Chromium/Firefox (249 passed, one skipped),
  and demo build. Log: `/tmp/opencode/tabui-audit-groups-25-27-verify.log`.
- Repository-wide lint, changed-test formatting, audit formatting, and diff checks
  passed. All three independent reviews passed; no audit blockers remain.
- This round retains all owned declarations and cases (95 suites, 976 tests).
  No production or dependency changes were made. Existing audit/cleanup work is
  preserved. The mixed empty-slot toggle and reachable rejected-command redo
  failures are documented production follow-ups. Groups 28–55 are not started.

### Groups 28–30: implemented and reviewed

- Started on the user's `test-audit` branch with a clean working tree after their
  checkpoint commit. Prior audit changes, production fixes, and cleanup are retained.
- Separate Sol agents own bend rules/history, bend curve geometry, and bend dialog
  controls. Each group receives an independent review before completion.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-28-30-before/`. Ownership uses original baseline
  titles, since current line numbers have changed. The coordinator owns this record
  and combined browser/full verification.

### Group 28: assessment and implementation

Independent review passed. Thirteen owned declarations remain. Generated
cases increase from 29 to 35 through six added parameter rows, not new declarations.

- Bend options require every valid field, three additional invalid inputs (zero
  duration, excessive pitch, wrong-type extra option), and terminal values for all
  seven types, including nonzero releases.
- Inheritance uses string two with a distinct string-one bend to detect incorrect
  note lookup. Rejections preserve technique state through both public operations.
  Accepted bend/release options and retained Let Ring are checked fully.
- Command and editor tests require complete options, single-technique counts,
  successful execution, replacement/no-op state, mixed-selection application, and
  undo/redo restoration. Explicit affected-model note anchors remain.
- Invalid replacement retains a documented JavaScript mutation of readonly options;
  independent review will check the fixture's value. No behavior guarantees were
  intentionally dropped; error-substring assertions became general rejection checks.
- Four focused suites passed 77 tests and test compilation; scoped lint/format and
  diff checks passed. No source changes or confirmed production bugs reported.
- Independent review approved all owned declarations and six added rows, confirmed
  same-string sensitivity, rejection preservation, independent expectations, and
  the supported JavaScript mutation scenario. It passed 77 tests, test compilation,
  scoped lint/format, and diff checks. No blockers or established production bugs.

### Group 29: assessment and implementation

Independent review passed. Owned declarations decrease from ten to nine;
generated cases remain 21. No production edits or confirmed bugs reported.

- Selector tests use public construction, real SVG, complete worked paths, and
  emitted options instead of helper substrings or fabricated DOM. Hold/Prebend
  equality becomes two explicit horizontal-path/pitch cases. Continuations require
  full paths, inherited pitch/duration, and noneditable Hold geometry.
- Private-point mutation for continuation floors becomes real keyboard handle
  events: initialization, upward movement, and repeated downward clamps in both
  emitted options and circle positions.
- Controller shapes require worked curve coordinates, vertical segments, arrow
  positions/directions, existing empty-path Hold, explicit short-Hold width/center,
  required text fitting, and independent bar-space pitch label placement.
- Browser checks interact with both Bend and Prebend labels, require full text
  and nonempty numeric path data, and preserve hover styling/path data after each
  click. Label interaction establishes text visibility, not curve visibility.
- Direct removal: fabricated incomplete helper control points, not produced by
  selector initialization. Given up: malformed-helper rejection/exact error.
  Splitting the horizontal comparison adds one case, offsetting that removal.
- Two focused suites passed 44 tests; test compilation, scoped lint/format, and
  diff checks passed. Browser/full verification awaits the coordinator.
- Independent review approved all owned declarations and the direct removal,
  confirmed supported initialization/continuation fixtures and independent worked
  coordinates. No blockers. Its optional wording correction is applied above;
  review itself did not rerun tests.

### Group 30: assessment and implementation

Independent review passed. Owned declarations decrease from 23 to 21 and
cases from 29 to 27 (before browser-project multiplication). Callback declarations
decrease from eight to six; all seven component and eight browser declarations
remain. No production changes.

- Real DOM/public construction/controller outcomes replace routing mocks and
  prototype/fake DOM setup. A shared bend-controls test helper owns setup/cleanup.
- Two routing declarations merge into one seven-type behavioral scenario. Seven
  disabled-type cases use real states and unchanged graph points after rejected
  clicks/callbacks. Confirm checks options, closure, undo/redo, repeated binding,
  single history entry, and unbinding. Removal checks full options/history; no-bend
  removal leaves state/dialog/history unchanged. Close checks keyboard ownership,
  old handle cleanup, cancellation, and controls after reopening.
- Components check actual classes/ARIA, saved coordinates/type/removal, inherited
  pitch, maximum continuation, Let Ring conditions, and releasing predecessors.
- Browser mouse dragging commits and persists the named handle's pitch across
  reopening/undo/redo. Touch retains CDP input with reliable session cleanup.
  Keyboard confirmation requires a rendered bend/full label plus parity/focus/undo.
  The previously failing Firefox reopen declaration remains unchanged.
- Direct removal: mocked incomplete selector output with no established UI path.
  Model invalid-option coverage remains in Group 28. Given up: fabricated selector
  rejection and exact internal forwarding/disposal call counts.
- Two focused suites passed nineteen tests; test compilation, scoped lint/format,
  and diff checks passed. Independent review checks removal justification and all
  owned scenarios, including retained browser declarations.
- Independent review approved all declarations/helper cleanup and both reductions,
  then passed nineteen tests across two suites and scoped diff checks. No audit
  blockers remain. Browser/full verification remains with the coordinator.

### Group 30 production finding: bend missing after two-edit redo

- User confirmed the failure when starting from an actual rest (`notes === null`),
  distinct from an empty string slot on an existing note beat, and requested a
  Luna fix. Implementation and regression coverage are in progress. Fret entry and
  bend application are separate atomic commands; the failure follows undoing each
  once, then redoing each once.
- Reported public-controller reproduction: default rest, enter fret 5, apply
  Bend/Release, undo twice, then redo twice. The fret returns but the bend does not.
  Redoing only the bend succeeds. No existing two-edit sequence coverage was removed.
- No production fix was made. Independent review reproduced the full sequence:
  fret 5 returns without the bend, whereas undo/redo of just the bend restores it.
  This is a separate production history bug, not removed baseline coverage.
- User-requested fix is now implemented by Luna: technique execution/undo resolves
  the current note from its beat/string lane instead of editing a discarded note
  after rest restoration/recreation. Initial red/green regression and all 95 unit
  suites/981 tests passed. The regression is being strengthened to exercise public
  controller/history behavior and each intermediate state; affected-model anchors
  are being checked for the same stale-reference issue. Final review/verification
  are pending.
- Final regression uses public controller/history from a verified rest, checks
  initial fret/options, bend removal, restored rest, fret-only redo, full bend redo,
  and the repeated cycle on the current note. One new declaration is justified by
  this previously uncovered two-command sequence; earlier declarations remain.
- `affectedModels` also resolves the current note UUID after recreation. Its
  existing contract test was strengthened and failed before the anchor fix.
  Final implementation passed all 95 unit suites/981 tests, production/test type
  checks, scoped lint, and diff checks. Independent Sol review and full verify are
  running; log: `/tmp/opencode/tabui-rest-bend-redo-verify.log`.
- Repository-wide lint and changed-source/test formatting passed. No commits or
  dependency changes were made.
- Independent Sol review approved the production fix and passed two focused
  suites/84 tests. It requested reading the current model again after bend redo;
  that assertion correction and optional intermediate fret-preservation checks
  were applied, passed the focused regression, and received final review signoff.
  No production correctness blockers remain. Final full verification is pending.
- Final `npm run verify` passed: production/test type checks, package build, all
  95 unit suites/981 tests, consumer smoke, Chromium/Firefox (249 passed, one
  skipped), and demo build. Log: `/tmp/opencode/tabui-rest-bend-redo-verify.log`.
  The review's final assertion-only strengthening also passed its focused run.
  The user-requested rest/bend redo fix is complete and independently reviewed.

### Groups 28–30 repository verification

- Full verification passed production/test type checks, package build, all 95 unit
  suites (980 tests), and consumer smoke. Log:
  `/tmp/opencode/tabui-audit-groups-28-30-verify.log`.
- Browser execution: 247 passed, one skipped, two failed. Group 29's changed
  bend-label test failed in both browsers because adjacent labels overlap and
  intercept the required pointer interaction. This is a fixture failure, not an
  unexplained timeout. Correction and independent recheck are pending; no clean
  full-run pass is claimed. Demo build is running separately.
- Repository-wide lint, changed-test/helper formatting, audit formatting, and diff
  checks passed before the browser-fixture correction.
- Fixture correction places Prebend on the next quarter-note beat with the public
  `a` shortcut, rather than a different string on the same beat. Normal hover/click
  and both-label/style/count/path guarantees remain. Test compilation, scoped
  lint/format/diff passed. Independent recheck and the entire changed label browser
  spec in both browsers are running.
- The separate demo build passed; log:
  `/tmp/opencode/tabui-audit-groups-28-30-demo.log`.
- The corrected complete label browser spec passed all eight cases across Chromium
  and Firefox. Log: `/tmp/opencode/tabui-audit-groups-28-30-browser-rerun.log`.
  Independent recheck approved the separate-beat fixture and preserved normal
  pointer, label/style/count, and unchanged-path guarantees without blockers.
- Final repository-wide lint, changed-test/new-helper formatting, audit formatting,
  and diff checks passed. All three groups are implemented and independently
  reviewed. The original full run remains failed; no later clean full run is claimed.
- Net scope change: three fewer declarations, four more generated unit cases
  (95 suites/980 tests). No production/dependency changes or commits were made.
  Prior checkpoint work remains intact. The reproduced two-edit bend redo failure
  remains a separate production follow-up. Groups 31–55 are not started.

### Groups 31–33: implemented and reviewed

- Started with a clean working tree on `test-audit` after the user's checkpoint.
  Separate Sol agents own repeats, tempo, and shared notation-dialog routing;
  each implementation receives an independent review.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-31-33-before/`. Shared files use disjoint
  declarations mapped from original baseline titles rather than current lines.
- Existing audit improvements, cleanup, and production fixes are preserved.
  The coordinator owns this document and combined browser/full verification.
  Current `AGENTS.md` specifies no-framework integration in full verification.

### Group 32: assessment and implementation

Independent review passed. Sixteen owned declarations/cases become fifteen:
unit eleven to ten, browser five unchanged. Seven substantial replacements.

- Tempo controls use real DOM events/model/history for all four buttons, clamping,
  disabled states, wheel direction/scroll prevention, submit, dialog closure and
  reopening, nested-button/backdrop behavior, and repeated bind/unbind/rebind.
- Renderer tests create required real SVG nodes and dispatch against rebuilt bar
  elements, preserving current context, handler replacement, unmatched targets,
  detachment/reattachment, and listener removal. Explicit affected-model and tempo
  visibility contracts remain; hash/diff checks become model/public tempo output.
- Controller tests require tempo/visibility, later-line movement, undo geometry,
  matching redo geometry, and exactly one corresponding tempo bar. Browser edits
  cover existing text and visible history as well as hover/context/cancel.
- Announcements require live-region semantics, complete selection text, and
  controlled deferred work before silence assertions. Repeat-focus behavior stays.
- Direct removal: noneditable displayed tempo corrupted through fake input. Given
  up: corrupted-DOM reset, internal hash/diff membership and collaborator counts.
- Eight whole-file tests, two owned controller tests, and the latest shared
  controller suite (76 tests) passed; scoped lint/format/diff passed. Initial test
  compilation is blocked by concurrent edits in Groups 31/33. No source bug found.
- Implementation used checkpoint HEAD `078f6f4737e04050686b12619fe21f71d62cd352`
  because access to external before snapshots was denied.
- Independent review approved all owned declarations/removal, confirmed the browser
  supplies visible tempo-update coverage beyond model-backed getters, and passed
  eight whole-file tests plus both owned controller tests and scoped checks.
  Applied optional direct callback-identity assertions and a more accurate confirm
  title; no additional coverage is claimed for refreshing a changed draft.

### Group 31: assessment and implementation

Independent review passed. Owned declarations decrease 25 to 24; generated
cases decrease 27 to 25. Eight files changed; no production bug established.

- Repeat commands retain state/history and explicit affected-model anchors;
  supplied counts now run through the command, and undo/redo preserve counts and
  independent start/end state. Geometry retains clearance/validity coverage and
  requires repeat rectangles to exist before width-preservation assertions.
- Controls use real notation/DOM/controller state, dialogs, keyboard ownership,
  insertion order/selection/history, repeated binding, and unbinding. Count controls
  require real validation, disabled state, unchanged invalid model, committed four,
  closure, undo/redo. Keyboard start toggles use actual state/history in both rows.
- Controller checks existing count 5 to 4 with history, selected bar/note indices,
  and real view-only rejection. Mouse start removal preserves non-target marks and
  selection while checking secondary-button rejection and undo.
- Direct removals: repeat-end mock-only routing declaration (real clicked-bar
  browser editing remains), and fake-player generated rejection row (real browser
  playback rejection remains). Given up: internal forwarding/order, child binding
  counts, forced-false setter choreography, isolated fake-player rejection.
- All three repeat browser cases remain; Enter confirmation adds rendered x4.
- Focused seven-suite execution passed 23 tests (21 owned unit cases plus two
  shared meter cases). Scoped lint/diff passed; owned formatting passed while
  shared Group 33 edits remained in progress. Compilation reported `Note.fret`
  typing errors in the earlier rest/bend regression; combined checks will resolve
  these after concurrent implementation completes.
- Independent review approved all owned declarations and both removals, confirming
  retained browser playback/clicked-bar coverage and real state/history/lifecycle
  assertions. Seven-suite filtered run passed 26 tests including nearby cases.
  No audit blockers or important lost user-facing guarantees were found.

### Group 33: assessment and implementation

Independent review passed after the explicit empty-selection coverage disposition.
Fifteen declarations/49 generated cases become
fourteen/42. Eleven declarations are replaced or strengthened; three browser
declarations/ten cases remain unchanged. New shared notation-dialog fixture.

- Reopening uses real cancelled drafts/current displayed tempo, meter, and tuplet
  ratios. Mouse routing uses real controller/dialog owners, active voice two,
  clicked-bar selection/values, one open dialog, and refresh notification.
- Deliberate missing-beat/missing-note malformed inputs retain documented errors
  with unchanged selection, closed dialogs, and no render. Secondary, playback,
  and view-only rejection use unchanged real selection/dialog state.
- Five real SVG renderer lifecycle rows check repeated bind/reconcile/rebind/unbind
  outcomes. SVG bar tests use actual repeat/signature targets, current-element
  forwarding, replacement/cleanup, and ignored borders.
- Keyboard tests check real named dialogs, consumed events, preserved model and no
  rendering; public empty selection retains four no-op keys and default 3:2 tuplet
  opening. Browser gating, parity, cancellation/focus and confirm/undo remain.
- Direct removal: seven-case empty-selection mocked routing table. It hid real
  controller exceptions; routing, prevention/render-once/no-throw claims are given
  up. Review is explicitly checking whether that loss and fixture are justified.
- Four focused suites passed 128 cases, scoped lint/format/diff. Initial test
  compilation reported three earlier rest/bend regression `Note.fret` accesses.
- Independent review approved all eleven rewrites and three retained browser
  declarations. Its documentation recheck approved the explicit deferred production
  requirement below; no audit blockers remain. Applied optional direct SVG callback
  identity and exactly-one selection notification checks; both affected suites
  passed afterward.

### Group 33 open contract finding: empty-selection shortcut exceptions

- **Required follow-up before closing the full audit:** the user accepts the
  current throwing behavior and requested no fix for now. Revisit/document the
  selection precondition, supported API boundary, and UI reachability before
  declaring the entire audit complete. No no-op behavior has been agreed.
- `TrackController` is internal to the package: it is not exported by the package
  entry point or exposed through `TabUIEditor`. A TypeScript-public method is not
  necessarily a supported consumer API. The probes below demonstrate internal
  reachability, not an established normal keyboard/UI path. The original bug
  classification was too strong; this is an unresolved contract/coverage finding.
- Independent review confirmed empty selection is a valid public state, reached
  through `selectBeat(beatElement)` followed by `clearSelection()`. The retained
  no-op test uses that setup. These are internal controller methods, not a supported
  consumer entry point. No equivalent surviving boundary coverage is claimed.
- Its runtime probe confirmed all seven failures: Shift+X throws selection length
  zero; A, Shift+A, and Delete access undefined `voiceBar`; I, Shift+I, and
  Shift+Delete throw selected bar undefined. Keyboard callbacks route without an
  empty-selection guard, so the exception prevents event consumption and rendering.
- Intentionally removed: the fake table's seven no-throw/default-handling and
  render-once assertions. It could not prove those behaviors with real controllers.
  Selected-note/range tests do not cover this boundary; no equivalent coverage is
  claimed. Deferred requirement: decide the intended precondition/error contract
  and appropriate regression coverage, including model/history effects and keyboard
  handling for these seven shortcuts. Throwing remains acceptable for now.
- No production fix or exception-characterization test was added in this audit.
  The eleven rewritten declarations and retained browser scenarios passed review;
  final documentation recheck approved this explicit disposition.

### Groups 31–33 repository verification

- Corrected three missing `GuitarNote` narrowings in the supervisor's final
  rest/bend assertion additions from the previous round. Runtime assertions remain;
  the prior full verification had started before those final additions, and focused
  runtime checks did not expose these type errors. This is a test typing correction.
- `npm run verify` is running after that correction; log:
  `/tmp/opencode/tabui-audit-groups-31-33-verify.log`.
- Full verification passed: production/test type checks, package build, all 95 unit
  suites/971 tests, configured integration consumer smoke, Chromium/Firefox (249
  passed, one skipped), and demo build. The executed integration script still
  reports packed-consumer smoke; this records actual command output despite the
  updated AGENTS description.
- Final assertion-only review follow-ups passed their focused suites and scoped
  lint/format/diff. Repository-wide lint, changed-test/new-fixture formatting and
  audit formatting passed. No production changes, dependencies, or commits.
- All three groups are implemented and independently reviewed. Net reduction:
  three declarations and ten generated unit cases (981 to 971). The seven-key
  empty-selection failure and coverage requirement remain explicit follow-ups.
  Prior checkpoint work is preserved. Groups 34–55 are not started.

### Groups 34–36: implemented and reviewed

- Separate Sol agents own range anchors/traversal, drag selection, and selection
  announcements. Each group receives an independent review and combined verification.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-34-36-before/`. Groups 31–33 remain uncommitted
  and are preserved, so HEAD alone is not this round's before-reference.
- Shared files use disjoint original-baseline declarations mapped by title. The
  coordinator owns this document and combined browser/full verification.
- User accepts empty-selection exceptions for now. The API/precondition/reachability
  decision is explicitly required before closing the full audit; no production fix
  or assumed no-op requirement is part of this round.

### Group 35: assessment and implementation

Independent review passed. All twelve owned declarations/cases remain.

- Seven drag-state tests use real beat elements and retain idle/pending, exact
  quarter-width threshold, original anchor, continuing movement, reset, and pointer
  ownership. Another-voice controller selection coverage remains unchanged.
- Three mouse declarations replace private injection/mock calls with real DOM,
  controller and SVG behavior. Drag replaces/extends ranges, requires literal SVG
  widths, stops after release, and edits only selected beats through history.
  Pointer-event rejection includes mouse/touch/pen and compatibility mouse movement.
- A shared drag fixture owns real layout, events, rendering and transport. Playback
  rejection uses actual Starting state and preserves an existing two-beat range;
  it gives up the fabricated Playing row and does not claim a distinct Playing
  guarantee. Exact internal call ordering/counts are also given up.
- Browser observation is typed and reliably disconnected/disposed; live-region
  semantics, zero held-drag mutations, exact final range and one insertion remain.
- Three focused suites passed 130 tests; test compilation, scoped lint/format/diff
  passed. No production edits or confirmed bugs. Browser verification is pending.
- Independent review approved every owned declaration/fixture and passed all three
  focused suites (130 tests). It confirmed independent drag-width/history checks
  and the documented Starting versus Playing tradeoff. Applied its optional title
  correction to describe startup range preservation precisely. No blockers.

### Group 34: assessment and implementation

Independent review passed after two coverage corrections. All 24 declarations/27 generated cases remain;
eleven callback declarations are rewritten. No production or shared setup edits.

- Controller traversal requires real multi-beat first-beat identities, unchanged
  serialized scores, and exact ranges before shortening/reversing/collapsing.
  Existing edge, anchor, string-lane, and rejected-target guarantees remain.
- Keyboard tests use real boundaries, consumed events, rejected/successful
  movement, range collapse/extension in both directions, view-only preservation,
  Ctrl bar traversal, and Escape range clear/anchor restoration/second rejection.
- Mouse tests use real cursor/string selection, visible SVG preview, actual ranges,
  release-button behavior, public anchors, and idle-click unchanged state.
  Transport controls require actual bar destinations and range anchor/clear state.
- Browser transport range requires exact two-beat announcement and positive growing
  widths. Existing keyboard range/clear/navigation scenario remains unchanged.
- Given up: internal routing/counts, old Up-routing assertion, mocked scroll-follow
  counts. Observable selection, event consumption, preview and score state remain.
- Four focused files passed 205 tests; test compilation, scoped lint/format/diff
  passed. No production findings; accepted empty-selection behavior is unchanged.
- Reviewer passed four focused suites/205 tests and approved remaining scope, but
  found lost rendering notifications in three successful keyboard selection tests
  (including view-only) and a hover-preview visibility check insensitive to the
  hovered note. Corrections retain real state and add notification plus matching
  hovered-note SVG geometry checks. These are test-review gaps, not source bugs.
- Reviewer used baseline titles and HEAD because before-snapshot access was denied;
  it did not claim the saved pre-edit comparison. Prior G31–33 changes were excluded.
- Correction now checks default render notifications after every successful action
  in all three keyboard tests, retaining boundary silence. Hover requires all SVG
  attributes, positive dimensions, and x/y/width/height matching the hovered third
  string's selection rectangle before clicking. No declarations/cases changed.
- Test-process-only sensitivity probes failed all three keyboard tests when render
  notifications were suppressed, and failed hover geometry at y 30.03 versus
  expected 78.03 when redirected to string one. Focused execution passed 124 tests,
  test compilation, scoped lint/format/diff. Independent recheck is running.
- Independent recheck confirmed both blockers resolved, with exact destinations,
  consumed events, view-only score preservation, boundary silence, and hover/click
  guarantees retained. It passed diff checking and approved the corrected scope;
  it did not rerun the reported focused checks.

### Group 36: assessment and implementation

Independent review passed. All 22 declarations/27 generated cases remain.
Twelve owned declarations move into real integration-style lifecycle coverage in
`tests/unit/lifecycle/selection-announcements.spec.ts`; no direct removals.

- Formatter coverage retains normalized range bounds/endpoints, singular wording,
  full/concise movement, incomplete-range rejection, and captured previous position.
  Cursor object identity is given up while position/output guarantees remain.
- Eight callbacks and four lifecycle declarations use real shell/editor/controller
  and DOM. Focus/unbind/rebind, fret/rhythm full output, deduplication, flushed
  silence with positive control, concise string movement, range/focus repeats, and
  held-drag release require exact announcement output, with real live-region checks.
  Some callback cases observe a forwarding announcement spy alongside real shell
  integration; no claim is made that every oracle directly reads the live region.
- Real drag cancellation covers refresh/note click/unbind. Parent moves/disposal,
  explicit clear/reinsert, stale repeat cancellation, deferred latest host state,
  subscription notification and disposal flushing retain timing/cleanup guarantees.
  Platform shims supply missing jsdom SVG rectangle and mouse page coordinates.
- Browser keyboard output uses controlled work flushing/exact text; skip/Tab entry
  requires fixture-specific context and real focus; mouse entry remains unchanged.
- Given up: internal render, frame/timer, automatic-check invocation counts, and
  cursor identity. Four focused suites passed 56 tests; scoped lint/format/diff
  passed. Latest compilation was blocked by a concurrent hover-note type access;
  the current Group 34 correction includes the explicit tablature-slot guard.
- Independent review approved every owned declaration and cleanup/timing fixtures,
  passed four suites/56 tests, and passed test compilation including Group 34's
  current guard. No blockers; applied its documentation precision correction above.

### Groups 34–36 repository verification

- Full `npm run verify` is running after all implementations and Group 34 review
  corrections. Log: `/tmp/opencode/tabui-audit-groups-34-36-verify.log`.
- Full execution passed production/test type checks, package build, 96 unit suites
  (971 tests), and consumer smoke. Browser result: 247 passed, one skipped, two
  failures. Group 34's changed transport-range exact announcement expects two beats
  through bar 2 beat 1; both browsers report three through bar 2 beat 2. Fixture and
  actions are being checked before correcting the oracle. No clean full-run pass
  is claimed. Separate demo build passed; log:
  `/tmp/opencode/tabui-audit-groups-34-36-demo.log`.
- Browser correction selects bar 2 beat 1 string 1 by rendered bar wrapper/beat ID,
  not geometric ordering. Fixture counts are independently checked: one whole beat
  in bar 1, two half beats in bar 2, four quarters in bar 3. Controller checks agree
  on two beats after the click and four after Next bar; exact announcements and
  positive growing selection widths remain.
- Complete range browser spec passed six cases across Chromium and Firefox after
  correction. Log: `/tmp/opencode/tabui-audit-groups-34-36-range-rerun.log`.
  Independent final browser-target recheck passed with no blockers. The original full-run
  failure remains recorded; targeted success is not a clean full-run pass.
- Reviewer confirmed rendered identity is only the click target, not a copy of
  range calculation, and that normal event binding plus all announcement/width/
  clearing/context guarantees remain. All three groups are complete and reviewed.
- Final repository-wide lint, changed-test/new-file formatting, audit formatting,
  and diff checks passed after the browser correction.
- The user subsequently reported that verification passes and approved committing
  the combined Groups 31–36 work. Earlier execution results remain recorded above.
- This round changes no declaration or generated-case counts (96 suites/971 unit
  tests); the new announcement suite accounts for the suite-count increase.
  No production/dependency changes or commits were made. Prior uncommitted work
  is preserved. Groups 37–55 are not started. Empty-selection contract follow-up
  remains required before closing the full audit, with throwing accepted for now.

### Groups 37–39: implemented and reviewed

- Started from clean `test-audit` checkpoint `65fa914a`. The existing imperative
  commit subject is retained; the user allowed explanation instead of rewording.
- Separate Sol agents own keyboard ownership/modes, playback transport/loops/seeking,
  and traversal/scheduling. Each group receives an independent review.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-37-39-before/`. Ownership uses original baseline
  declarations mapped by title. Prior audit/production/cleanup work is preserved.
- The coordinator owns this document and combined browser/full verification.
  Empty-selection throwing remains accepted pending the required closing follow-up.

### Group 39: assessment and implementation

Independent review passed. All 25 declarations remain; generated cases increase
from 25 to 27. Only traversal and scheduler specs changed.

- Scheduler uses real audio engine/traversal/sample/note scheduling with a local
  Web Audio boundary recorder. Exact returned timing and actual source starts,
  stops, and automation replace internal `scheduleBeat` calls/arguments.
- Traversal strengthens bounded exclusion/timing, restored mid-bar loops and repeat
  containment across passes, bounded complete repeat termination, and independent
  unmatched start/end fixtures. The old shared-boundary fixture was adjacent repeat
  sections; its exact sequence remains under an accurate title.
- Scheduler fixtures require actual populated voices, overflow exclusion, explicit
  silent preview, cross-voice end clipping, accepted fretted LetRing, worked dotted
  and changed-tempo timing, full-bar lookahead without duplicates, loop offsets,
  restart/truncation, and two new slide-pair clipping rows with source automation.
- Direct removal: deliberately corrupted missing staff-bar invariant. Given up:
  internal invariant error and mid-run track mutation, replaced by supported edits
  between runs/reset; ordinary score editing is blocked during playback.
- Two focused suites passed 27 tests; test compilation, scoped lint/format/diff
  passed. No source changes. Independent review assesses all owned declarations,
  the boundary recorder, and coverage tradeoffs.
- Independent review approved every declaration/removal and the boundary recorder,
  confirmed independent worked timing and useful slide clipping/target suppression
  coverage, and passed both suites/27 cases, scoped lint/format/diff. No blockers.

### Group 39 open finding: shared repeat boundary

- User clarified that nearest-boundary pairing is an explicit v0.5.0 design choice.
  The earlier probe assumed a combined boundary should chain two multi-bar repeat
  sections; that assumption is not an agreed requirement. Do not treat this as a
  confirmed bug or change pairing semantics without agreement. A bar bearing both
  flags is currently accepted as self-contained; intervening boundaries can
  invalidate outer pairings, as shown in the user's demo example.
- A separate true shared-boundary probe uses three bars: bar 0 starts a repeat,
  bar 1 ends and starts repeats, bar 2 ends. Completing bar 1 advances/repeats to
  index 1 instead of repeating from 0. Reported validation checks a following
  repeat-start before its repeat-end and rejects bar 0's pairing.
- No production fix or failing test was left. Decide shared-boundary support and
  document the intended pairing contract separately; the old adjacent-repeat test
  did not cover this scenario. Existing design takes precedence over the probe's
  proposed expectation.

### Group 37: assessment and implementation

Independent static review passed. Owned declarations decrease 17 to 16, generated
cases 28 to 23: unit 12/23 to 10/16, browser 5/5 to 6/7. No production edits.

- Real cleared/populated controllers and native events check unavailable actions,
  invalid modifiers, prevented events, unchanged score/cursor/dialogs and defaults.
  Actual shell/viewport/descendant/sibling/body focus has positive digit-entry
  controls rather than fabricated focus objects.
- View-only checks protect model/history and copy. Mode-routing mock tables merge
  into real view-only tests and two browser transport cases: actual Starting with
  held external audio resume, and Playing with controlled time. Both preserve
  score/selection/dialogs/clipboard and Space transport behavior; idle navigation,
  ranges and Escape retain prior real coverage.
- Binding/capture/rebind/two-editor ownership use native dispatch, actual focus,
  dot/fret results and undo, replacing listener arrays/call counts. Browser focus
  has post-dialog Palm Mute positive output and view-only start/stop; Tab exit focus
  is explicit. Existing two-editor and modifier browser declarations remain.
- Given up: exact internal routing/listener counts, aggregate render choreography,
  and some former mocked mode-specific default-prevention assertions. Review checks
  that replacements retain important behavior; no unsupported API claim is made.
- Keyboard file passed 70 tests; test compilation, scoped lint/format/diff passed.
  Browser execution awaits combined supervisor verification.
- Independent review approved all owned declarations and replacement-dependent
  removals, confirmed native ownership positive controls and valid external audio
  startup/time boundaries. It did not rerun tests; actual browser execution remains
  required. No test-quality/coverage blockers.

### Group 38: assessment and implementation

Independent review passed after one coverage correction. All 36 declarations/cases remain: 34 replacements
or strengthenings and two unchanged browser cases. No production edits.

- A shared transport fixture replaces external Web Audio/time only; score player
  tests now run real scheduler, traversal, samples, notes, cursor and audio engine.
  Anchors, actual-audio cursor timing, preload/lazy samples, stop/pending startup,
  newest overlapping start, retry and initial/rolling failure cleanup, completion,
  live loops, retargeting, mix and terminal disposal use public outcomes.
- Controller tests require actual loop passes and boundaries, explicit versus
  selection-owned looping during seeks, stable live runs, mutation rejection with
  populated history/clipboard, view-only history protection, cleared edit selection,
  and all navigation variants including startup/missing voice/staff fallback.
- Playback controls use DOM clicks/binding and public rendered states instead of
  routing/private renderer setup. Mouse seeks use distinct actual targets without
  score mutation/edit selection; fabricated paused transport becomes real startup.
- Given up: internal calls/order and fabricated paused-state routing. Existing two
  browser transport/cursor cases remain unchanged. Review checks all original
  guarantees, lifecycle cleanup, and the new boundary fixture.
- Four focused suites passed 142 tests; production/test compilation, scoped
  lint/format/diff passed. Implementation compared checkpoint HEAD because external
  snapshot access was denied.
- Reviewer approved 35 cases/fixture but found single-beat looping insensitive to
  full-score looping: one populated beat remained last-started at 550ms either way.
  Correction will require distinct populated neighbors and repeated audio starts
  only for the selected beat beyond its end. This restores selection-boundary
  coverage, not a production fix. Other lifecycle/transport guarantees are approved.
- Corrected single-beat case anchors G4 between populated E4/B4, requires only G4
  sources and five starts at 0.05/0.55/1.05/1.55/2.05 seconds. Process-only probes
  ignoring the start, end, or both boundaries fail on E4/B4 rather than G4, proving
  both boundaries are meaningful. Existing loop/cursor/playing checks remain.
- Optional disposal strengthening requires construction/resume/oscillator/sample
  counts unchanged after post-disposal start/time advance. Both focused suites
  passed 90 tests, test compilation, scoped lint/format/diff; independent recheck
  is running. No declaration/case count change or production edits.
- Independent recheck approved the fix and optional terminal-disposal strengthening,
  confirming literal frequencies/times, buffered-source boundary discrimination,
  repeat positive control, and fixture clock consistency. No remaining blockers;
  it did not rerun reported checks. Pending-resume disposal remains separate.

### Group 38 open finding: disposal during pending audio resume

- User requested a Luna fix with existing regression coverage extended where
  suitable. Implementation is in progress. The distinction is stale startup work
  continuing after disposal, not proof that disposal fails to close the context.
- Reported reproduction with real playback collaborators: dispose while external
  `AudioContext.resume()` is pending, then resolve it. `prepareAudio()` proceeds to
  load samples after disposal removed the sample manager, causing unhandled
  `Playback sample manager is not initialized` rejection.
- No source fix or failing test was left in the passing audit patch. Independent
  review assesses this separately; a lifecycle regression/fix needs follow-up.
- Review confirmed the defect by source: after awaited resume, sample loading can
  reject following disposal; with `waitForSamples === false` that promise is not
  handled. No baseline disposal-during-resume guarantee was removed by the audit.

### Group 38 pending-resume disposal follow-up: fixed and reviewed

- Luna added a disposed-state check after awaited audio resume. Disposed startup
  returns before loading samples from released resources; context cleanup remains
  owned by disposal. No active-run error behavior was intentionally changed.
- One new focused regression configures samples and holds external resume, starts,
  disposes, resolves resume, then flushes work. It requires no fetch/scheduling,
  exactly one context close, and idle state. Existing stop-during-start and
  ready-player disposal tests remain; this is their previously uncovered crossing.
- Red run failed with the unhandled missing-sample-manager error against old source;
  green passed. All 96 unit suites/967 tests, production/test compilation, scoped
  lint/format/diff passed. Prior Group 37–39 work is preserved.
- Independent Sol review and full verify are running. Log:
  `/tmp/opencode/tabui-pending-audio-disposal-verify.log`.
- Independent review approved the three-line guard and justified separate regression,
  passed fifteen ScorePlayer tests, and confirmed stale rejection handling, later
  start rejection, single cleanup, and unchanged preload path. No blockers.
  Applied optional empty sample-source assertion alongside empty oscillators.
- Full `npm run verify` passed: production/test compilation, package build, 96 unit
  suites/967 tests, consumer smoke, Chromium/Firefox (253 passed, one skipped), and
  demo build. The final sample-source assertion also passed its focused regression.
  Repository-wide lint, scoped source/test/audit formatting, and diff checks passed.
  User-requested lifecycle fix is complete; no dependency changes or commits.

### Groups 37–39 repository verification

- `npm run verify` passed: production/test type checks, package build, all 96 unit
  suites/966 tests, consumer smoke, Chromium/Firefox (253 passed, one skipped), and
  demo build. Log: `/tmp/opencode/tabui-audit-groups-37-39-verify.log`.
- Group 38's final assertion/fixture-only review correction passed two focused
  suites/90 tests and test compilation. Full verification ran alongside that review;
  those final assertions have separate focused evidence. Final repository-wide
  lint, changed-test/new-helper formatting, audit formatting, and diff checks passed.
- All three groups are independently reviewed. Net change: one fewer declaration,
  five fewer generated unit cases (971 to 966), with two new browser transport
  cases per browser (249 to 253 passing browser executions).
- No production/dependency changes or commits were made. Prior work is preserved.
  Shared repeat-boundary validation and pending-resume disposal need separate
  follow-up. Accepted empty-selection exceptions still require contract/reachability
  review before final audit closure. Groups 40–55 are not started.

### Groups 40–42: implemented and reviewed

- Started from clean `test-audit` checkpoint `2dda19bc`. Separate Sol agents own
  note synthesis/teardown, audio buses/samples, and playback cursor/overlays. Each
  implementation receives an independent review.
- Before-round files are saved at
  `/tmp/opencode/tabui-audit-groups-40-42-before/`. Prior audit and production fixes,
  including pending-resume disposal, are preserved. No auto-commit is requested.
- Web Audio, clocks and networking are valid external test boundaries. Coverage
  value is assessed separately from test quality; no target case count applies.
- The coordinator owns this document and full verification. Empty-selection throws
  remain accepted pending audit-closing contract/reachability review; repeat pairing
  follows the user's nearest-boundary design, not the earlier probe's assumption.

### Group 40: assessment and implementation

Independent review passed. All twelve declarations remain; generated cases
increase twelve to seventeen. Only the note-scheduler spec changed.

- Independent fretted A4/B4/880Hz expectations replace production-derived pitch
  oracles. Oscillator profiles, envelope/routing/times/handles, no-resource dead
  notes, harmonic gain, slide pitch/sustain, mute caps/boundaries, bend timing,
  continuation Hold/Release, LetRing/legato/vibrato and repeat-gain negative controls
  require explicit boundary output. Failure preserves the expected error message and
  stops/disconnects the source/envelope at the current clock.
- Sample tests use the real manager with network/decode fakes, including plain and
  harmonic rates. Given up: artificial loaded-without-root state, replaced by
  supported configured-but-unloaded fallback. Internal collaborator mocks, weak
  numeric matchers, unasserted setup/actions and mutable-loop fixtures are removed.
- Seventeen focused tests, scoped lint/format/diff passed. Test compilation reported
  only a concurrent Group 41 readonly-clock assignment. No source bug confirmed.
- Independent review approved all owned declarations/tradeoffs and passed seventeen
  cases, scoped lint/format/diff. It confirmed valid external boundary assertions,
  independent worked pitch/time/gain and sufficient AudioParam recording. Corrected
  wording: thrown error message is checked, not strict error-object identity.

### Group 42: assessment and implementation

Independent review passed after one sensitivity correction. All twelve declarations/cases remain. Only cursor
coordinator and overlay specs changed; no source bugs found or shared helper edits.

- Coordinator output uses public subscriptions, nonzero audio origin and 499/500ms
  timing, scoped payloads, stale-generation rejection/new positive output, inclusive
  truncation/query exclusion, track retargeting/old cancellation, and reset/new-run
  output. The constructor's missing-staff invariant remains for review.
- All six overlays use real player/controller/rendered SVG instead of fake DOM,
  private methods/field injection, prototype elements or collaborator mocks. They
  require attack/vertical/full-line geometry, visible subscription lifetime and
  frozen detached output, two-player isolation positives, and real stop clearing.
- Interpolation uses audio-clock progress and independently rendered fret spacing;
  cross-line snap, distant materialization/follow, final-beat progression, unresolved
  events and captured stale stop/restart callbacks retain boundary coverage.
- Only external audio/time/frames are faked. Given up: internal call counts; all
  prior behavior is claimed through observable replacements, subject to review.
- Twelve focused tests, scoped lint/format/diff passed. Test compilation reported
  only Group 41's concurrent readonly-clock assignment.
- Reviewer approved the other behavior and passed focused/static checks, but stale
  frame rejection used an unchanged audio clock, so an accepted stale callback
  could appear stationary or queue hidden frame work. Correction will require
  captured callbacks, clock advancement, unchanged position and no new queued frames
  before any render can clear them. This is a test gap, not a source bug finding.
- Corrected case requires captured callbacks, advances audio 25ms before the new
  run's first beat, invokes stale callbacks before render, and requires unchanged
  center/zero queued frames. Process-only bypass of the stale-run guard fails at
  center 123.24 versus 120.9. Reset now clears a genuinely populated last-started
  beat, retaining pending cancellation and new-run positives. Twelve tests, test
  compilation and scoped lint/format/diff passed; independent recheck is pending.
- Independent recheck confirmed both nonvacuous corrections and passed twelve
  focused tests/scoped diff. It approved the reported guard-only probe mechanism,
  but could not inspect its temporary artifact due to access denial. No blockers.

### Group 41: assessment and implementation

Independent review passed. Seven declarations/cases become eleven declarations
and fifteen cases: engine five/five to eight/nine, samples two/two to three/six.
No direct removals or source changes; only the two owned specs changed.

- Real scheduling replaces internal mocks/fabricated nodes. Lazy single context,
  clock/topology/master state, master/track setup failure cleanup/retry, naturally
  ended resources, inclusive cancellation and harmless stop failure require actual
  external boundary output. Buffered notes exercise mute/solo reversibility,
  independent master controls and removed-track bus cleanup.
- Samples require deduplicated concurrent requests, pending decode, exact URL/bytes,
  publication only after decode, identity/root/cache; network/HTTP/body/decode
  failures leave one tone unavailable without blocking another configured tone.
- Four new declarations cover resume failure/retry, engine disposal during pending
  resume, used-score sample scheduling/routing/cleanup, and unconfigured no-fetch.
  Review explicitly checks added value versus existing transport/disposal coverage.
- Given up: internal collaborator mocking and fabricated-node fixtures; no behavior
  guarantees intentionally dropped. Fifteen focused cases, test compilation,
  scoped lint/format/diff passed; concurrent readonly-clock issue is resolved.
- Independent review approved all original/new coverage, distinct engine-level
  value versus transport tests, and external boundary recorders. It passed both
  suites/fifteen cases and confirmed the separate failed-load retry finding. No
  blockers; no retained baseline guarantee claimed retry recovery.

### Group 41 open finding: failed sample load prevents retry

- User requested a Luna fix. Implementation and regression coverage are running,
  preferably extending existing failure cases while preserving concurrent loading,
  successful cache behavior and independent-tone isolation.
- Public sample-manager probe: fail a configured tone's first network request,
  request it again; only one fetch occurs and the sample remains unavailable.
  Failed completed loads remain in `_sampleLoads` and are reused indefinitely.
- No source fix or failing test was left. Failed-load eviction/retry needs separate
  follow-up; independent review assesses the finding and baseline coverage.

### Group 41 sample retry follow-up: fixed and reviewed

- Luna removes a completed in-flight load only if it is still the cached promise.
  Failed loads no longer block later fetches; pending requests deduplicate and
  successfully decoded buffers remain cached separately.
- Existing four-stage failure cases now require successful retry, cached retry
  result, and independent-tone isolation, using URL-based fetch fakes. All four
  failed against original production code before passing with the fix.
- No declarations/cases were added. All 96 unit suites/980 tests, production/test
  compilation, scoped lint/format/diff passed. Existing Group 40–42 work is retained.
- Independent Sol review and full verify are running. Log:
  `/tmp/opencode/tabui-sample-retry-verify.log`.
- Independent Sol review approved the root fix, pending-load identity cleanup,
  fulfilled failure promises, concurrent deduplication and successful buffer cache.
  It passed six focused cases; no blockers. Before-snapshot access was denied, so
  review separated retry additions from earlier audit rewrites using HEAD/current.
- Full `npm run verify` passed: production/test compilation, package build, all
  96 unit suites/980 tests, consumer smoke, Chromium/Firefox (253 passed, one
  skipped), and demo build. Repository-wide lint, scoped source/test/audit
  formatting and diff checks passed. The requested retry fix is complete and
  independently reviewed, with no added test cases, dependencies, or commits.
- At the user's request, simplified completion cleanup to plain `await sampleLoad`
  followed by conditional cache deletion. `fetchSample()` already catches expected
  load failures, so no separate `.then()`/`void` or `try` block is needed here.
  Both focused sample/engine suites passed fifteen cases; production type checking,
  scoped lint/format and diff checks passed after this control-flow simplification.

### Groups 40–42 repository verification

- `npm run verify` passed: production/test type checks, package build, all 96 unit
  suites/980 tests, consumer smoke, Chromium/Firefox (253 passed, one skipped), and
  demo build. Log: `/tmp/opencode/tabui-audit-groups-40-42-verify.log`.
- Group 42's final review corrections also passed both focused suites/twelve tests
  and test compilation; full verification ran alongside review, so those final
  assertions have separate focused evidence. Final repository-wide lint,
  changed-test/audit formatting and diff checks passed.
- All three groups are implemented and independently reviewed. Net additions:
  four declarations and thirteen generated unit cases (967 to 980), with no direct
  declaration removals. No production/dependency changes or commits were made.
- Failed sample-load retry is a separate source follow-up. Accepted empty-selection
  throwing still requires contract/reachability review before full audit closure;
  nearest repeat-boundary pairing remains the user's intended design. Prior work
  is preserved. Groups 43–55 are not started.

### Groups 43–45: complete

- User requested a checkpoint commit and the next three groups. Committed Groups
  40–42 and the sample retry fix as `4de06950`,
  **Improve audio tests and fix sample retries**. Nothing pushed.
- Separate Sol implementations own track/score controls and switching, lifecycle
  and subscription cleanup, and responsive sizing. Each receives an independent
  Sol review. Shared lifecycle ownership is declaration-level, mapped from original
  baseline titles; other groups’ changes and prior guarantees must be preserved.
- Before-round files and checkpoint hash are saved at
  `/tmp/opencode/tabui-audit-groups-43-45-before/`. The coordinator owns this record
  and combined browser/full verification. No further commit is requested.
- Approved seams remain public behavior, real controls/rendering and browser output;
  external clocks, audio and resize observers may be faked. Coverage value and test
  quality are separate; no count target applies. Empty-selection preconditions and
  reachability remain an audit-closing follow-up. Nearest repeat pairing is intended.

### Group 43: assessment and implementation

- All thirteen unit and three browser declarations remain. Twelve unit declarations
  replace mocked dispatch/render choreography with real controls/model changes,
  disabled states, dialogs/deletion, unbind behavior, and persisted master/track mix.
- Track controls cover only-track removal, playback edit restrictions with working
  selection/mix, view-only rejection, selection/reorder/rename/dialogs. Given up:
  mocked setter dispatch in view-only mode, which falsely implied edits succeeded.
- Notation tests retain no-track constructor rejection and require player/run/loop
  identity and buffered audio across switches, disposal, offscreen cursor
  materialization/following, range-endpoint following, and explicit refresh reflow
  without score mutation. Internal constructor/call-order/count assertions removed.
- Track-switch browser coverage keeps active-state/single-view checks, strengthens
  populated notation on both tracks/restoration, and requires keyboard cancellation
  of delete confirmation to preserve the track and all three controls.
- No direct declaration removals or shared-helper/source edits; no source bug found.
  Thirteen focused unit cases and scoped lint/format/diff passed. Test compilation
  was blocked only by parallel Group 44/45 work. Independent review is running.
- Independent review passed thirteen focused cases and approved the other retained
  and replacement guarantees. One blocker: buffered cursor x reused production's
  `attackXGlobal`, while y only exceeded 200. Correction must match both axes to a
  required rendered target note/rest in the same coordinate space. No source bug.
  Snapshot access was denied; review compared checkpoint/original Git baselines.
- Correction now requires the unique rendered `9` and matching SVG hit rectangle;
  root-SVG coordinates come from DOM attributes/ancestor translations. Cursor x
  aligns and its vertical extent must contain the target rectangle. Scrolling,
  materialization and positive cursor width remain. A process-only 200-unit upward
  cursor shift fails containment. Mute/solo now toggle back explicitly; layout
  refresh also preserves serialized score content. Thirteen unit cases, test
  compilation, scoped lint/format/diff passed; independent recheck is running.
- Independent recheck approved the corrected rendered-target oracle, mix reversal
  and serialized score preservation, and passed thirteen tests/scoped static checks.
  Reviewer inspected the assertions/probe mechanism but did not rerun the mutation.

### Group 45: assessment and implementation

- All twenty-one declarations remain: fifteen lifecycle, four configuration, two
  browser. Nineteen strengthen replacements; combined-layout merge and invalid
  runtime mode validation remain. Generated cases increase twenty-one to twenty-eight.
- Real components/DOM replace internal layout mocks. External measurement, resize
  observation and time fakes exercise explicit/measured/fixed width, actual SVG
  output and notifications, latest-width coalescing/reuse/disconnect, host-width
  restrictions, keyboard/dialog transitions, initial blocked state, invalid-width
  recovery, observer setup rollback/remount and pending-work disposal.
- Window fallback uses native resize events, coalescing and listener removal.
  Rollback uses a throwing public change listener; listener disposal/throw retains
  captured dimensions, empty root and terminal state. Given up: injected internal
  notation-refresh failure at original line 1027, replaced by host-callback rollback.
  Invalid refresh cases cover -1, NaN and Infinity without state/output/events.
- Configuration tests retain fixed-width minimum boundaries and add equal,
  reversed, negative/non-finite thresholds and custom limits. Browser tests require
  populated notation, SVG size and matching-coordinate geometry across host-only
  resizing, restriction recovery and side-panel collapse/expand restoration.
- No direct removals/source edits or new bug reports. Fifty-eight focused cases
  including shared-file tests passed. Owned formatting/lint/diff passed; compilation
  and shared lifecycle unused imports awaited parallel Group 44 completion.
  Independent review is running; browser/full verification is supervisor-owned.
- Independent review approved the other coverage and explicit internal-failure
  tradeoff, but requested two corrections: restricted keyboard checks must focus
  notation before each event; host-only resize must require matching bar IDs to
  move and restore geometry. Window-resize movement must also compare shared IDs,
  not merely unequal arrays. Fifty-eight focused cases passed. Snapshot denied;
  Git baselines used. Shared lint/format results reflected in-flight cleanup.
- Corrected keyboard case requires focus before each restricted and unrestricted
  key event. Separate process-only mutations enabling blocked/view-only edits each
  fail the expected unchanged fret (`null` becomes `5`). No source file edits.
- Window and host-only resize now require at least one matching bar ID to move
  over 0.5 CSS pixels; recovery requires every baseline ID to return within 0.5px.
  Bounds, positive output, SVG sizes and restriction classes remain. Unused shared
  imports removed. Fifty-eight tests, test compilation and scoped lint/format/diff
  passed. No count delta. Independent recheck is running.
- Independent recheck approved both corrections and all twenty-one declarations,
  passing fifty-eight cases, test compilation and scoped lint/format/diff. Browser
  run then passed nine of ten cases; Chromium side-panel expansion read SVG 1171px
  versus notation 1185.609375px immediately after detecting width growth. Agent
  investigates the measurement/wait before final browser recheck. Log:
  `/tmp/opencode/tabui-audit-groups-43-45-responsive.log`.
- Browser-width correction compares SVG width to viewport `clientWidth`, measured
  together and required positive, rather than the bounding rectangle which includes
  the reserved scrollbar gutter. Production uses client width. Existing growth,
  controls, expansion and restored width remain. Scoped lint/format/test compilation/
  diff passed. No source bug found; independent recheck is running.
- Independent recheck approved matching CSS-pixel content-width measurement,
  simultaneous sampling, positive widths and repeated 0.5px convergence. Collapse
  growth/control state/expansion restoration remain. No remaining review blockers.

### Group 44: assessment and implementation

- Twenty-two declarations remain: twenty replacements and two strengthened keeps.
  Nine owned lifecycle declarations move to `ui-callbacks.spec.ts`; repeated
  bind/unbind delegation moves from that file to `tabui-callbacks.spec.ts`.
- Mounted editors exercise disposal of retained controls/keyboard/DOM, scoped theme
  removal, fresh remount without revived controls, partial-init rollback/remount,
  snapshots for real selection/edits/loop/playback, isolated disposable subscriptions,
  snapshot identity until changes, owned startup errors, and terminal state APIs.
- TabUI callback tests require scroll materialization after renderer replacement,
  dialog keyboard capture across repeated cycles/UI refresh/final unbind, exact-once
  observable top/side edits after binding cycles, edit notifications with silent
  scrolling, and externally changed note content after explicit refresh.
- UI/top tests require playback side-edit restrictions/recovery, isolated removable
  and rebindable player-state subscriptions, and stable listener order across two
  emissions. Mouse tests exercise native SVG selection/global release, inactive
  unbound callbacks/working rebind, old targets before/after renderer replacement
  and working new targets. Browser containment strengthens three remounts, page-wide
  tree containment and working keyboard edits each time.
- Given up: internal bind/render/dispose counts, private render-mode invocation,
  render-option objects and synthetic ContextStart error payload. Real startup
  failure now covers ContextInit/Failed to prepare audio. No direct removals or
  source bug; unused fake note-renderer helper/imports removed.
- Five focused suites/eighty-eight cases, test compilation and scoped callback/
  browser lint/format/diff passed. Shared lifecycle declarations/import cleanup were
  formatted by the coordinator after both owners completed. Independent review runs.
- Independent review passed sixty-six focused cases and approved twenty-one
  declarations. Partial-init failure occurred before notation ownership, losing
  baseline teardown coverage. Correction must fail at a later browser boundary and
  require owned-resource cleanup (preloaded audio context closure), while retaining
  terminal state/remount. No source bug. Reviewer used Git because snapshot access
  was denied. Toggle notification counts and subscription wording were optional.
- Corrected failure occurs at browser `appendChild` during top-control rendering
  after notation ownership. Preloaded audio provides a required live/open context
  at failure; rollback closes it exactly once, including repeated disposal and
  settled async work. Terminal state, empty root and successful remount remain.
- Binding cycles now require exact observable change notification totals 1/2 then
  3/4 after rebind, remaining 2 while unbound. Disposal wording now claims only
  inactive controls and terminal APIs, not unproved stored-subscriber clearing.
  Sixty-six tests, test compilation and scoped lint/format/diff passed; no count
  change. Independent recheck is running. No mutation probe was run for rollback.
- Independent recheck approved all twenty-two declarations, including owned audio
  context cleanup and exact notification counts; two suites/seventeen tests and
  scoped diff passed. No remaining Group 44 blockers.

### Groups 43–45 combined verification

- The initial full `npm run verify` exited with code 1 while Group 44/45 review
  corrections were pending. Its log was lost when temporary storage reset; cause
  and completed phases are unknown. This is a failed run, not a clean result.
- Both correction agents hit usage limits. The user requested resumption after
  limits reset; implementations/reviews resume from the existing worktree and Git
  checkpoint because before-round snapshots are also no longer available.
- A fresh full verification will run after final corrections, with new evidence
  recorded separately from the failed initial run.
- Fresh `npm run verify` passed with all review/browser corrections included:
  production/test compilation, package build, all 96 unit suites/987 tests,
  packed-consumer smoke, Chromium/Firefox (253 passed, one skipped), and demo build.
  Log: `/tmp/opencode/tabui-audit-groups-43-45-final-verify.log`.
- Repository-wide ESLint, changed-test/audit formatting and diff checks passed.
  All three groups are implemented and independently reviewed. Declaration counts
  remain unchanged: Group 43 sixteen, Group 44 twenty-two, Group 45 twenty-one.
  Generated unit cases increase seven (980 to 987) through distinct validation
  rows. No direct declaration removals, source/dependency changes, or new source
  bug findings. Previous fixes and guarantees are preserved with explicit seam
  tradeoffs above. No further commit or push was made.
- Groups 46–55 are not started. Empty-selection preconditions/API boundary/UI
  reachability still need review before full audit closure; nearest-boundary repeat
  pairing remains the intended design.

### Groups 46–48: complete

- User requested a checkpoint commit and the next three groups. Committed Groups
  43–45 as `c5953010`, **Improve editor controls and lifecycle tests**. Nothing pushed.
- Separate Sol implementations own panels/accessibility, configuration/assets/
  cleanup, and confirmation-dialog focus. Each receives an independent Sol review.
  Shared configuration ownership is declaration-level, mapped from original titles.
- Before-round files and checkpoint hash are saved at
  `/tmp/opencode/tabui-audit-groups-46-48-before/`. Group 47's asset resolver spec
  now lives at `tests/unit/assets/asset-url-resolver.spec.ts`; the original manifest
  path records its former location. Existing moves and cleanup are preserved.
- Approved seams and review discipline remain unchanged. The coordinator owns this
  record and combined browser/full verification. No further commit is requested.

### Group 47: assessment and implementation

- All original owned declarations and current asset replacements/additions reviewed.
  Checkpoint ownership grows twenty-one to twenty-three declarations and thirty-four
  to thirty-six cases; two additions cover independent resolved configuration and
  successful ordered cleanup. No direct declaration removals. Original nineteen/
  thirty-one differs because bundled assets were already changed before this round.
- Configuration strengthens literal defaults/playback, partial merges/untouched
  defaults/linked colors, two independent C3/E2 sample root expectations, non-positive
  and non-finite fields, and accepted zero padding. Runtime validation of modes,
  asset variants, panel positions and invalid sample keys/entries/URLs remains.
  Mutating one resolved result must preserve caller input, another result and fresh
  defaults; base normalization must not mutate the caller.
- Assets use actual URL resolution instead of normalization-helper calls, covering
  whitespace/slashes/root/dark/custom roots, actual bundled light/dark SVG content,
  shorthand output and missing-icon rejection. Prior asset moves/behavior preserved.
  Cleanup requires ordered effects, exact final error identity, a successful step
  after the last failure, thrown undefined, and all-success completion.
- Tradeoffs: direct helper calls become observable URL resolution; exact pitch bits
  become numeric tolerance. These are approved module seams, not additional package
  API claims. No source bugs found. Forty-seven cases across three whole files,
  test compilation and scoped lint/format/diff passed. Independent review runs.
- Independent review approved all owned declarations and both additions as distinct
  contracts, preserving earlier bundled-asset behavior. It confirmed independent
  literal oracles, meaningful pitch tolerance and public module seams, and passed
  forty-seven cases, test compilation and scoped lint/format/diff. No blockers or
  optional changes. Snapshot access denied; comparison used both Git baselines.

### Group 46: assessment and implementation

- All seventeen original declarations assessed; fifteen remain after merging two
  duplicate callback declarations into real lifecycle coverage. The callback file
  is deleted only after collapse/refresh, rollback and listener-removal guarantees
  have observable replacements. No direct behavior coverage removals intended.
- Real editor/DOM tests require panel placement/visibility, synchronous collapse/
  expansion SVG widths, initial collapsed expansion, rollback/recovery through a
  throwing public subscriber, non-collapsible controls without a toggle, and a
  retained detached toggle remaining inactive after disposal. Old internal mocks
  and fake DOM are removed. Internal refresh injection becomes host-callback failure
  coverage; exact counts/setter choreography become state/render assertions.
- Three config contracts remain unchanged: view-only hides the editing panel by
  default and despite an explicit override, and collapsible initial state resolves.
- Browser placement requires positive panel/notation boxes and correct row/column
  overlap. Three-track view-only coverage checks disabled names, keyboard track and
  notation navigation, playback availability and hidden editing controls. Accessible
  icons require populated selection, exact initial states, keyboard toggles/focus;
  controls require nonempty named inventory after expansion. Tooltips require actual
  pseudo-element visibility/content for hover and uncontaminated keyboard focus.
- Twenty-three lifecycle and thirty-seven config tests, test compilation and scoped
  lint/format/diff passed. No source edits; prior real tests/fixes preserved.
  Independent review is running; browser/full verification remains supervisor-owned.
- Independent review approved all seventeen original declarations and the two
  merges, with no lost behavior scenario. It passed twenty-three lifecycle and
  thirty-seven config cases, test compilation and scoped lint/format/diff. It
  confirmed independent geometry and uncontaminated keyboard tooltip checks. The
  rollback title now names the throwing subscriber to make the accepted seam
  tradeoff clear; only the title changed after review.

### Group 48: assessment and implementation

- All six declarations remain: one unit replacement and five strengthened browser
  tests. Only yes/no callbacks and owned contained-dialog browser declarations change.
  Group 31 repeat-count (`x4`) and the entire Group 49 suffix remain byte-identical
  to checkpoint. Original ownership uses the documented baseline ending a761.
- Real DOM, YesNoComponent, ContainedDialog and notation replace fabricated Node/
  elements and mocked containment/component shapes. Public consumer callbacks check
  inside/cancel/backdrop, disabled/closed guards, confirmation, duplicate binding,
  unbind and rebind. Exact internal render counts are given up.
- Enter tests require real string addition/exactly one track, non-confirming button
  behavior and denominator persistence. Modal announcements require one original
  live region, hidden styling, real tuning output and correct placement at focus
  across two cycles. Containment requires positive root-sized bounds before/after
  scrolling, inert editor controls and a working host disclosure.
- Focus tests cover initial/normal/both-wrap tab navigation, Escape draft rejection,
  return focus, reopening and actual backdrop dismissal without track creation.
  Given up: all-sibling inert enumeration, native cancel/close flags and internal
  mode-marker cleanup, replaced by named controls, actual focus/dismissal and reuse.
- One focused unit case, test compilation and scoped lint/format/diff passed.
  No source/shared-helper changes. Independent review is running.
- Independent review approved all six declarations and stated tradeoffs. It
  confirmed independent DOM/browser oracles and preserved byte-identical Group 31
  and Group 49 declarations. No blockers; scoped diff passed. Runtime browser/full
  verification remains supervisor-owned. Draft-field reset on reopening is optional
  additional coverage, not a removed baseline guarantee.

### Groups 46–48 combined verification

- Full `npm run verify` is running after all three implementations. Log:
  `/tmp/opencode/tabui-audit-groups-46-48-verify.log`. Final review corrections, if
  needed, receive separately recorded checks when they postdate the full run.
- Full run failed: all 95 unit suites/987 cases and packed-consumer passed; browser
  output was 250 passed, one skipped, three failed. Both browsers reject the new
  track-name prefix expectation on ordinary beat navigation (actual output names
  Bar 2/Beat 1/fret 15). Firefox serializes tooltip pseudo-content as
  `attr(data-tooltip)` rather than resolved `"Play"`. Group 46 corrects these
  browser expectations while preserving active-track identity, navigation and
  independently specified visible tooltip behavior. Demo phase not reached.
- Corrections require Lead track pressed states and exact Bar 2/Beat 1/fret 15
  then Bar 1/Beat 1/fret 12 announcements without an unsupported repeated track
  prefix. Tooltip resolution accepts only the exact `attr(data-tooltip)` expression
  as an alternate browser serialization, resolves its attribute and still requires
  independent expected text; visibility/focus/title/data-attribute checks remain.
  This observes the computed CSS/attribute relationship, not pixel-rendered text.
  Test compilation and scoped lint/format/diff passed; no count/source changes.
- Independent recheck and fresh full verification are running. Fresh log:
  `/tmp/opencode/tabui-audit-groups-46-48-final-verify.log`.
- Independent static recheck approved both fixes with no remaining changes needed:
  announcements match actual track-change/bar-context behavior, and exact CSS
  expression handling retains literal tooltip/visibility/focus requirements. Fresh
  runtime verification is pending; the earlier failed run remains failed.
- Fresh full `npm run verify` passed with both browser corrections included:
  production/test compilation, package build, all 95 unit suites/987 tests,
  packed-consumer smoke, Chromium/Firefox (253 passed, one skipped), and demo build.
  Repository-wide lint, changed-test/audit formatting and diff checks passed.
- All three groups are implemented and independently reviewed. Relative to the
  round checkpoint, Group 46 merges two duplicate declarations and Group 47 adds
  two distinct declarations; Group 48 retains all six. Net declarations and unit
  cases are unchanged. Suite count falls from 96 to 95 because the obsolete shell
  callback spec was replaced by real lifecycle coverage. No production/dependency
  changes or new source bugs. No further commit or push was made.
- Groups 49–55 are not started. Empty-selection preconditions/API boundary/UI
  reachability remain an audit-closing follow-up; nearest repeat pairing is intended.

### Groups 49–51: complete

- User requested a checkpoint commit and the next three groups. Committed Groups
  46–48 as `dc9d17fb`, **Improve panels, configuration, and dialog tests**. Nothing
  pushed. Separate Sol implementations own multi-editor dialog behavior,
  serialization round trips, and invalid serialized input. Each receives an
  independent Sol review.
- Before-round files and checkpoint hash are saved at
  `/tmp/opencode/tabui-audit-groups-49-51-before/`. Shared serialization ownership is
  declaration-level, mapped from original baseline titles. Prior dialog improvements,
  intentional user cleanup, and production fixes are preserved.
- Approved seams and review discipline remain unchanged. The coordinator owns this
  record and combined browser/full verification. No further commit is requested.
  Empty-selection contract/API boundary/reachability remains an audit-closing item;
  nearest-boundary repeat pairing remains the intended design.

### Group 49: assessment and implementation

- Five owned declarations become four; twelve generated cases become ten. The fake
  DOM unit declaration/two cases is removed only with real-browser replacements;
  browser cases remain ten. Earlier Group 48/31 browser prefix is byte-identical
  to checkpoint. Only owned dialog specs changed; no source edits or confirmed bug.
- Instance contract adds real cancel/close events and values, prevention, open
  setters, repeated modeless stability, stale-close no-ops and visible/hidden output.
  Six cross-mode cases retain DOM/focus/announcement ownership, add repeated/same-
  instance rejection and successful second opening after release.
- Two release cases retain four closing routes/prevention, restore actual editor
  controls and require stale close/requestClose/open=false to preserve the second
  owner's dialog/announcer. Two-editor coverage uses real clicks/keys, track creation
  before/after isolation, Escape preserving the other draft, and disposal of one
  editor while the other's draft remains confirmable, with focus/count guarantees.
- Given up: exact exception text, method-shape/patching assertions, activeDialog
  identity, mock mount/focus calls, internal mode flags and artificially pre-set
  inert sibling restoration. Actual control restoration is retained for review.
- Scoped browser TypeScript, lint/format/diff and unowned-prefix comparison passed.
  Whole test compilation awaited parallel serialization work. Independent review
  is running; browser/full runtime checks remain supervisor-owned.
- Independent review approved all owned declarations/removal replacements and
  confirmed the unchanged browser prefix, counts and scoped lint/format/diff.
  Explicit reduction: arbitrary host-written inert states on editor-owned direct
  root children are no longer tested. Natural read-only/playback inert states live
  on nested controls; no current natural-state hole was found. Normal editor
  restoration remains covered. Runtime browser verification is still pending.
- Supervisor ran the whole contained-dialog browser spec: all thirty-two cases
  passed across Chromium/Firefox, including earlier unchanged dialog coverage. Log:
  `/tmp/opencode/tabui-audit-groups-49-51-dialogs.log`.

### Group 51: assessment and implementation

- All sixteen original declarations assessed; seventeen remain after splitting a
  runtime table. Owned cases fall fifty-eight to fifty-six. Only owned serialization
  and reader tests changed; no source bugs/shared helper edits.
- Existing malformed root/field/prototype enum, alignment/empty voice/mix/tone,
  fifteen invariants, seven ownership levels and sparse runtime cases remain.
  Otherwise-valid controls, explicit setup guards and specific reasons make failure
  paths meaningful. Octave construction errors retain cause plus a one-field fix
  control; continuation bend rejects pitch below preceding bend and passes after
  correcting only pitch from one to two.
- Four public-model runtime rows remain; six fabricated runtime rows become wire
  cases for fractional/unsafe repeats, unsafe tuplets, null technique and unexpected
  options. Two duplicate minimum-tuplet/maximum-repeat rows are directly removed,
  with values retained in wire-invariant cases. Explicitly given up: serializer
  rejection of fabricated private runtime states, including private repeat/bend
  writes. Malformed wire rejection and valid public-model validation remain.
- Reader declarations retain paths, inherited enum/array rejection, unknown/missing
  keys and error causes, adding valid controls, specific reasons, integer/finite/
  inclusive bounds, existing error identity, missing-versus-null and successful
  model operations. These are approved module seams, not new npm API claims.
- Sixty-one cases across both files (including five Group 50 cases), test compilation
  and scoped lint/format/diff passed. Independent review is running.
- Independent review approved all owned tests, positive controls, exact paths/causes
  and documented serializer-defense tradeoffs. It passed sixty-one cases, test
  compilation and scoped lint/format/diff. Error helpers still fail on unexpected
  errors or successful operations; no blockers or optional changes.

### Group 50: assessment and implementation

- Nine declarations/eighteen generated cases remain: eight strengthen, the clear
  self-contained both-repeat-boundaries test remains unchanged. No removals, source
  changes or confirmed bugs. Shared helpers unchanged.
- Metadata/mix/meter/tempo and serialized beats have independent expectations;
  public staff construction replaces private clef injection. Invalid lone-repeat-
  end setup becomes a valid self-contained repeat under intended pairing rules.
  Dotted beats require exact duration/no tuplet/six empty slots and restored dots.
- Sparse voices/chord slots distinguish absent voices, rests and six-empty-slot note
  beats; the installed voice containing beats is explicitly nonempty. Serialized
  tuplet/tuning/fret/bend mutations must preserve source and restored model values.
- Ten instrument/tone cases require known names/dimensions/literal tuning/program/
  serialized values. Seven bend shapes require literal serialized and restored
  options plus owners. Non-bend techniques require successful setup, literal wire
  values and reconstructed owners/transition targets. Multi-track reconstruction
  requires separate fresh identities, dimensions, second-bar tempo/meter and worked
  triplet timing, retaining timing-equality/beaming assertions.
- Eighteen focused cases, test compilation and scoped lint/format/diff passed;
  earlier whole-file run passed sixty-six. No coverage intentionally given up.
  Independent review is running.
- Independent review approved all nine declarations/eighteen cases, valid fixtures,
  independent wire/restored oracles and retained ownership/timing. It passed both
  suites/sixty-six cases and scoped diff. Fresh identities cover representative
  nodes at each listed level, not every node. Optional serialized name/tuning
  assertions would strengthen paired-bug detection; restored literal values already
  provide independent checks. No blockers, source bugs or lost owned coverage.

### Groups 49–51 combined verification

- Whole contained-dialog browser spec passed thirty-two cases across both browsers.
- Full `npm run verify` passed after all implementations and shared-file format:
  production/test compilation, package build, all 94 unit suites/983 tests,
  packed-consumer smoke, Chromium/Firefox (253 passed, one skipped), and demo build.
  Log: `/tmp/opencode/tabui-audit-groups-49-51-verify.log`.
- All three groups are implemented and independently reviewed. Repository-wide
  lint, changed-test/audit formatting and diff checks passed. Net declarations are
  unchanged: Group 49 removes one with browser replacements, Group 51 adds one by
  splitting a table, Group 50 retains all nine. Unit cases fall four (987 to 983):
  two replaced fake-dialog cases and two duplicate validation rows. Suite count
  falls one because dialog-unit coverage moved to the real browser boundary.
- Explicit coverage tradeoffs remain above: arbitrary host-written direct-child
  inert state restoration and serializer defense against fabricated private runtime
  corruption are no longer covered. Normal editor restoration, malformed wire
  rejection and public-model validation remain. No production/dependency changes,
  new source bugs, further commit or push.
- Groups 52–55 remain. Before declaring the whole audit complete, resolve/document
  empty-selection preconditions, package API boundary, UI reachability and coverage
  disposition. Nearest-boundary repeat pairing remains intended and needs consistent
  documentation rather than an assumed semantic fix.
