import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import {
  DEFAULT_MASTER_BAR,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  Track,
  VoiceNumber,
} from "../../../src/notation/model";
import { createBeat, createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command";
import { createMultiVoiceTwoStaffScoreFixture } from "../../../demo/data/multi-voice-score";
import { TabUILayoutMode } from "../../../src/config/tabui-config";
import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { GuitarTechniqueElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";

const FINAL_STAFF_VOICE_CASES: Array<[VoiceNumber[]]> = [
  [[1]],
  [[1, 2]],
  [[1, 2, 3]],
  [[1, 2, 3, 4]],
  [[1, 3]],
];

function getLineOwnershipKeys(trackElement: TrackElement): string[] {
  return trackElement.trackLineElements.map((line) =>
    line.trackLineBars.map((bar) => bar.masterBarUUID).join(":")
  );
}

function getAllNoteX(trackElement: TrackElement): number[] {
  return trackElement.trackLineElements.flatMap((trackLineElement) =>
    trackLineElement.staffLineContainers.flatMap((staffLineContainer) =>
      staffLineContainer.styleLinesAsArray.flatMap((styleLineElement) =>
        styleLineElement.barElements.flatMap((barElement) =>
          barElement.beatElements.map((beatElement) => {
            const noteElement = beatElement.noteElements[0];
            if (!(noteElement instanceof TabNoteSlotElement)) {
              throw Error("Expected tab note element");
            }

            return noteElement.textCoordsGlobal.x;
          })
        )
      )
    )
  );
}

function getTrackLineY(trackElement: TrackElement): number[] {
  return trackElement.trackLineElements.map((line) => line.boundingBox.y);
}

function updateMasterBars(
  trackElement: TrackElement,
  masterBarIndices: number[]
): void {
  trackElement.update({ affectedMasterBarIndices: masterBarIndices });
}

function setFinalStaffVoices(voiceNumbers: VoiceNumber[]) {
  const score = createMultiVoiceTwoStaffScoreFixture();
  const track = score.tracks[0] as Track<Guitar>;
  const finalStaff = track.staves[track.staves.length - 1];

  for (const bar of finalStaff.bars) {
    for (const voiceNumber of [1, 2, 3, 4] as VoiceNumber[]) {
      bar.removeVoiceBar(voiceNumber);
    }
    for (const voiceNumber of voiceNumbers) {
      const voiceBar = bar.insertVoiceBar(voiceNumber);
      voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);
    }
  }

  return { track, finalStaff };
}

function expectOutlineToMatchTabStaffLines(trackElement: TrackElement): void {
  const trackLine = trackElement.trackLineElements[0];
  const outline = trackLine.outlineLinesLineLocal;
  if (outline === undefined) {
    throw Error("Expected multi-staff outline");
  }

  const firstStyleLine = trackLine.staffLineContainers[0].styleLinesAsArray[0];
  const finalStaffLine =
    trackLine.staffLineContainers[trackLine.staffLineContainers.length - 1];
  const finalStyleLine = finalStaffLine.styleLinesAsArray[0];
  const firstBar = firstStyleLine.barElements[0];
  const lastBar =
    finalStyleLine.barElements[finalStyleLine.barElements.length - 1];
  const firstRenderedStaffLine = firstBar.staffLinesLineLocal[0];
  const lastRenderedStaffLine =
    lastBar.staffLinesLineLocal[lastBar.staffLinesLineLocal.length - 1];

  expect(outline.left.x).toBeCloseTo(firstRenderedStaffLine.x1);
  expect(outline.right.x).toBeCloseTo(lastRenderedStaffLine.x2);
  expect(outline.left.y1).toBeCloseTo(firstRenderedStaffLine.y);
  expect(outline.right.y1).toBeCloseTo(firstRenderedStaffLine.y);
  expect(outline.left.y2).toBeCloseTo(lastRenderedStaffLine.y);
  expect(outline.right.y2).toBeCloseTo(lastRenderedStaffLine.y);
}

function expectTargetedUpdateToMatchFullRebuild(
  trackElement: TrackElement,
  fullRebuildTrackElement: TrackElement
): void {
  expect(getLineOwnershipKeys(trackElement)).toEqual(
    getLineOwnershipKeys(fullRebuildTrackElement)
  );
  expect(trackElement.trackLineElements.length).toBe(
    fullRebuildTrackElement.trackLineElements.length
  );
  expect(getTrackLineY(trackElement)).toEqual(
    getTrackLineY(fullRebuildTrackElement)
  );
  expect(getAllNoteX(trackElement)).toEqual(
    getAllNoteX(fullRebuildTrackElement)
  );
}

function findBarElement(trackElement: TrackElement, barUUID: number) {
  for (const trackLine of trackElement.trackLineElements) {
    for (const staffLine of trackLine.staffLineContainers) {
      for (const styleLine of staffLine.styleLinesAsArray) {
        const barElement = styleLine.barElements.find(
          (element) => element.bar.uuid === barUUID
        );
        if (barElement !== undefined) {
          return barElement;
        }
      }
    }
  }

  return undefined;
}

describe("TrackElement tree", () => {
  test("horizontal updates refresh multi-staff outline geometry", () => {
    const { track, bar } = createScoreGraph();
    track.insertStaff(1);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const beforeLine = trackElement.trackLineElements[0];
    const beforeOutline = beforeLine.outlineLinesLineLocal;
    const voiceBar = bar.getVoiceBar(1);
    if (beforeOutline === undefined || voiceBar === null) {
      throw Error("Expected multi-staff outline and voice bar");
    }
    const beforeRightX = beforeOutline.right.x;

    voiceBar.replaceBeats(
      Array.from({ length: 16 }, () =>
        createBeat(voiceBar, NoteDuration.Sixteenth)
      )
    );
    updateMasterBars(trackElement, [0]);

    const afterLine = trackElement.trackLineElements[0];
    const afterOutline = afterLine.outlineLinesLineLocal;
    if (afterOutline === undefined) {
      throw Error("Expected multi-staff outline after update");
    }

    expect(afterOutline.right.x).toBeGreaterThan(beforeRightX);
    expectOutlineToMatchTabStaffLines(trackElement);
  });

  test("multi-voice two-staff outline matches rendered staff-line geometry", () => {
    const score = createMultiVoiceTwoStaffScoreFixture();
    const trackElement = new TrackElement(
      score.tracks[0],
      TEST_LAYOUT_DIMENSIONS
    );

    trackElement.update();

    expectOutlineToMatchTabStaffLines(trackElement);
  });

  test.each(FINAL_STAFF_VOICE_CASES)(
    "outline matches rendered staff lines for final-staff voices %j",
    (voiceNumbers) => {
      const { track } = setFinalStaffVoices(voiceNumbers);
      const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

      trackElement.update();

      expectOutlineToMatchTabStaffLines(trackElement);
    }
  );

  test("voice additions and removals refresh outline from staff-line geometry", () => {
    const { track, finalStaff } = setFinalStaffVoices([1]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    expectOutlineToMatchTabStaffLines(trackElement);

    for (const bar of finalStaff.bars) {
      const voiceBar = bar.insertVoiceBar(3);
      voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);
    }
    updateMasterBars(trackElement, [0, 1, 2]);
    expectOutlineToMatchTabStaffLines(trackElement);

    for (const bar of finalStaff.bars) {
      bar.removeVoiceBar(3);
    }
    updateMasterBars(trackElement, [0, 1, 2]);
    expectOutlineToMatchTabStaffLines(trackElement);
  });

  test("builds the expected hierarchy for a single default bar", () => {
    const { track, staff, bar } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(1);

    const line = trackElement.trackLineElements[0];
    expect(line.staffLineContainers).toHaveLength(1);

    const staffLine = line.staffLineContainers[0];
    expect(staffLine.staff).toBe(staff);
    expect(staffLine.styleLinesAsArray).toHaveLength(1);

    const styleLine = staffLine.styleLinesAsArray[0];
    expect(styleLine.barElements).toHaveLength(1);
    expect(styleLine.barElements[0].beatElements).toHaveLength(1);
    const barElement = styleLine.barElements[0];
    const beatElement = barElement.beatElements[0];
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected a tablature beat");
    }
    expect(barElement.bar).toBe(bar);
    expect(beatElement.beat).toBe(bar.voiceBarsAsArray[0].beats[0]);
    expect(beatElement.noteElements.map((v) => v.stringNumber)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    beatElement.noteElements.forEach((v, i) => {
      expect(v.note).toBe(beatElement.beat.notes?.[i]);
    });
  });

  test("line-local geometry excludes the preceding line height for immediate children", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    score.masterBars[4].tempo = 144;
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(2);
    const trackLine = trackElement.trackLineElements[1];
    const trackLineInfo = trackLine.trackLineInfoElement;
    const staffLine = trackLine.staffLineContainers[0];

    // Six 24px string slots, a 60px rhythm row, and 30px tempo space = 234px.
    expect(trackLine.globalCoords).toEqual({ x: 0, y: 234 });
    expect(trackLine.lineLocalCoords).toEqual({ x: 0, y: 0 });
    expect(trackLine.lineLocalBoundingBox).toEqual({
      x: 0,
      y: 0,
      width: 1200,
      height: 234,
    });

    if (trackLineInfo === null) throw Error("Expected tempo information");
    expect(trackLineInfo.lineLocalCoords).toEqual({ x: 0, y: 0 });
    expect(trackLineInfo.lineLocalBoundingBox).toEqual({
      x: 0,
      y: 0,
      width: 1200,
      height: 30,
    });
    expect(trackLineInfo.globalCoords).toEqual({ x: 0, y: 234 });

    expect(staffLine.lineLocalCoords).toEqual({ x: 0, y: 30 });
    expect(staffLine.lineLocalBoundingBox).toEqual({
      x: 0,
      y: 30,
      width: 1200,
      height: 204,
    });
    expect(staffLine.globalCoords).toEqual({ x: 0, y: 264 });
  });

  test("line-local geometry composes through bar beat note and label descendants", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const staffLine = trackLine.staffLineContainers[0];
    const styleLine = staffLine.styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];
    const gapLine = styleLine.techGapContainer.techGapLinesAsArray.find(
      (line) => line.labelElements.length > 0
    );
    if (gapLine === undefined) throw Error("Expected technique gap line");
    const labelElement = gapLine.labelElements[0];

    // The 30px tempo row precedes a 24px palm-mute label row.
    expect(styleLine.lineLocalCoords).toEqual({ x: 0, y: 30 });
    expect(barElement.lineLocalCoords).toEqual({ x: 0, y: 54 });

    // The first attack is 12px beyond the 85.5px signature/repeat reserve.
    expect(beatElement.voiceBarContainer.boundingBox.x).toBeCloseTo(85.5);
    expect(beatElement.lineLocalCoords).toEqual({ x: 97.5, y: 54 });
    expect(beatElement.globalCoords).toEqual({ x: 97.5, y: 54 });
    expect(beatElement.lineLocalCoords.x).toBeCloseTo(
      barElement.lineLocalCoords.x + beatElement.barLocalCoords.x
    );
    expect(beatElement.lineLocalCoords?.y).toBeCloseTo(
      barElement.lineLocalCoords.y + beatElement.barLocalCoords.y
    );
    expect(beatElement.globalCoords.x).toBeCloseTo(
      barElement.globalCoords.x + beatElement.barLocalCoords.x
    );
    expect(beatElement.globalCoords.y).toBeCloseTo(
      barElement.globalCoords.y + beatElement.barLocalCoords.y
    );

    expect(noteElement.lineLocalCoords).toEqual({ x: 97.5, y: 54 });
    expect(labelElement.lineLocalCoords).toEqual({ x: 97.5, y: 30 });
  });

  test("tempo and technique origins include the preceding line height only in global space", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    score.masterBars[4].tempo = 144;
    const bar = track.staves[0].bars[4];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(2);
    const trackLine = trackElement.trackLineElements[1];
    const trackLineInfo = trackLine.trackLineInfoElement;
    if (trackLineInfo === null) {
      throw Error("Expected track line info element");
    }
    const barElement =
      trackLine.staffLineContainers[0].styleLinesAsArray[0].barElements[0];
    const noteElement = barElement.beatElements[0].noteElements[0];
    const techniqueElement = noteElement.techniqueElements[0];
    const gapLine =
      trackLine.staffLineContainers[0].styleLinesAsArray[0].techGapContainer.techGapLinesAsArray.find(
        (line) => line.labelElements.length > 0
      );
    if (gapLine === undefined) {
      throw Error("Expected technique gap line");
    }
    const labelElement = gapLine.labelElements[0];

    const tempoRectGlobal = trackLineInfo.getBarTempoRectGlobal(barElement);
    const tempoRectLineLocal =
      trackLineInfo.getBarTempoRectLineLocal(barElement);
    if (tempoRectGlobal === undefined || tempoRectLineLocal === undefined) {
      throw Error("Expected tempo rectangles");
    }
    // The first line is 234px tall; the new tempo occupies the next 30px.
    expect(trackLine.globalCoords).toEqual({ x: 0, y: 234 });
    expect(tempoRectLineLocal).toEqual({ x: 0, y: 0, width: 30, height: 30 });
    expect(tempoRectGlobal).toEqual({ x: 0, y: 234, width: 30, height: 30 });

    const tempoTextGlobal =
      trackLineInfo.getBarTempoTextCoordsGlobal(barElement);
    const tempoTextLineLocal =
      trackLineInfo.getBarTempoTextCoordsLineLocal(barElement);
    if (tempoTextGlobal === undefined || tempoTextLineLocal === undefined) {
      throw Error("Expected tempo text coordinates");
    }
    expect(tempoTextLineLocal).toEqual({ x: 30, y: 24 });
    expect(tempoTextGlobal).toEqual({ x: 30, y: 258 });

    // This line has no time signature: 49.5px repeat reserve + 12px attack padding.
    expect(techniqueElement.pathOriginLineLocal).toEqual({ x: 61.5, y: 54 });
    expect(techniqueElement.pathOrigin).toEqual({ x: 61.5, y: 288 });
    expect(labelElement.descriptorOriginLineLocal).toEqual({ x: 61.5, y: 30 });
    expect(labelElement.descriptorOrigin).toEqual({ x: 61.5, y: 264 });
  });

  test("staff outlines borders and note text use the owning line coordinate space", () => {
    const { score, track } = createScoreGraph();
    track.insertStaff(1);
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    score.masterBars[4].tempo = 144;
    const bar = track.staves[0].bars[4];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 7;

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(2);
    const trackLine = trackElement.trackLineElements[1];
    const barElement =
      trackLine.staffLineContainers[0].styleLinesAsArray[0].barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    if (!(noteElement instanceof TabNoteSlotElement)) {
      throw Error("Expected tab note element");
    }

    const outlineGlobal = trackLine.outlineLinesGlobal;
    const outlineLineLocal = trackLine.outlineLinesLineLocal;
    if (outlineGlobal === undefined || outlineLineLocal === undefined) {
      throw Error("Expected a two-staff outline");
    }

    // Two 204px staves and 30px tempo space precede this line (438px).
    // Its first string is 12px below its own 30px tempo row.
    expect(trackLine.globalCoords).toEqual({ x: 0, y: 438 });
    expect(outlineLineLocal.left).toEqual({ x: 0, y1: 42, y2: 366 });
    expect(outlineGlobal.left).toEqual({ x: 0, y1: 480, y2: 804 });
    expect(outlineLineLocal.right.y2).toBe(366);
    expect(outlineGlobal.right.y2).toBe(804);

    expect(barElement.barLeftBorderLineLineLocal).toEqual({
      x: 0,
      y1: 42,
      y2: 162,
    });
    expect(barElement.barLeftBorderLineGlobal).toEqual({
      x: 0,
      y1: 480,
      y2: 600,
    });
    expect(barElement.barRightBorderLineLineLocal.y1).toBe(42);
    expect(barElement.barRightBorderLineGlobal.y1).toBe(480);
    expect(barElement.staffLinesLineLocal.map((v) => v.y)).toEqual([
      42, 66, 90, 114, 138, 162,
    ]);
    expect(barElement.staffLinesGlobal.map((v) => v.y)).toEqual([
      480, 504, 528, 552, 576, 600,
    ]);
    expect(barElement.staffLinesLineLocal[0].x1).toBe(0);
    expect(barElement.staffLinesGlobal[0].x1).toBe(0);

    // A 12px fret glyph is centered on the 61.5px attack and first string.
    expect(noteElement.textRectLineLocal).toEqual({
      x: 55.5,
      y: 36,
      width: 12,
      height: 12,
    });
    expect(noteElement.textRectGlobal).toEqual({
      x: 55.5,
      y: 474,
      width: 12,
      height: 12,
    });
    expect(noteElement.textCoordsLineLocal).toEqual({ x: 61.5, y: 42 });
    expect(noteElement.textCoordsGlobal).toEqual({ x: 61.5, y: 480 });
  });

  test("registry lookup returns the beat element by model beat", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beat = bar.voiceBarsAsArray[0].beats[0];
    const beatElement = trackElement.getBeatElement(beat);
    expect(beatElement).toBeDefined();
    expect(beatElement?.beat).toBe(beat);
  });

  test("no-op update preserves stable identities for renderer reconciliation", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const staffLine = trackLine.staffLineContainers[0];
    const styleLine = staffLine.styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];
    const barIdentity = barElement.getStableIdentity();
    const beatIdentity = beatElement.getStableIdentity();
    const noteIdentity = noteElement.getStableIdentity();

    trackElement.update();

    expect(trackElement.trackLineElements[0]).toBe(trackLine);
    const afterBar =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const afterBeat = afterBar.beatElements[0];
    expect(afterBar.getStableIdentity()).toBe(barIdentity);
    expect(afterBeat.getStableIdentity()).toBe(beatIdentity);
    expect(afterBeat.noteElements[0].getStableIdentity()).toBe(noteIdentity);
  });

  test("beat lookup includes added beats and drops removed beats after updates", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const addedBeat = voiceBar.appendBeats().beats[0];
    trackElement.update();

    expect(trackElement.getBeatElement(addedBeat)?.beat).toBe(addedBeat);
    expect(findBarElement(trackElement, bar.uuid)?.beatElements).toHaveLength(
      2
    );

    voiceBar.removeBeat(1);
    trackElement.update();

    expect(trackElement.getBeatElement(addedBeat)).toBeUndefined();
    expect(findBarElement(trackElement, bar.uuid)?.beatElements).toHaveLength(
      1
    );
  });

  test("targeted duration update matches full rebuild when line ownership stays the same", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const finalVoiceBar = track.staves[0].bars[12].getVoiceBar(1);
    if (finalVoiceBar === null) throw Error("Expected final voice bar");
    for (let i = 0; i < 3; i++) {
      finalVoiceBar.appendBeats();
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const fullRebuildTrackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS
    );
    trackElement.update();
    fullRebuildTrackElement.update();

    const beforeOwnership = getLineOwnershipKeys(trackElement);
    const beforeNoteX = getAllNoteX(trackElement);

    const lastLineIndex = trackElement.trackLineElements.length - 1;
    const affectedMasterBarIndex =
      trackElement.trackLineElements[lastLineIndex].trackLineBars[0]
        .masterBarIndex;
    const affectedBar = track.staves[0].bars[affectedMasterBarIndex];
    const affectedVoiceBar = affectedBar.getVoiceBar(1);
    if (affectedVoiceBar === null) {
      throw Error("Expected voice 1 in affected bar");
    }
    affectedVoiceBar.beats[0].baseDuration = NoteDuration.Eighth;
    affectedVoiceBar.rebuildTiming();

    updateMasterBars(trackElement, [affectedMasterBarIndex]);
    fullRebuildTrackElement.update();

    expect(getLineOwnershipKeys(trackElement)).toEqual(beforeOwnership);
    expect(getAllNoteX(trackElement)).not.toEqual(beforeNoteX);
    expectTargetedUpdateToMatchFullRebuild(
      trackElement,
      fullRebuildTrackElement
    );
  });

  test("targeted update matches full rebuild when an expanded late bar regroups lines", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const fullRebuildTrackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS
    );
    trackElement.update();
    fullRebuildTrackElement.update();

    const beforeOwnership = getLineOwnershipKeys(trackElement);

    const secondLastLineIndex = trackElement.trackLineElements.length - 2;
    const affectedMasterBarIndex =
      trackElement.trackLineElements[secondLastLineIndex].trackLineBars[0]
        .masterBarIndex;
    const affectedBar = track.staves[0].bars[affectedMasterBarIndex];
    const affectedVoiceBar = affectedBar.getVoiceBar(1);
    if (affectedVoiceBar === null) {
      throw Error("Expected voice 1 in affected bar");
    }
    affectedVoiceBar.beats[0].baseDuration = NoteDuration.Whole;
    for (let i = 0; i < 16; i++) {
      affectedVoiceBar.insertBeat(i + 1);
    }
    affectedVoiceBar.rebuildTiming();

    updateMasterBars(trackElement, [affectedMasterBarIndex]);
    fullRebuildTrackElement.update();

    expect(getLineOwnershipKeys(trackElement)).not.toEqual(beforeOwnership);
    expectTargetedUpdateToMatchFullRebuild(
      trackElement,
      fullRebuildTrackElement
    );
  });

  test("bars retain stable identities when wrapping moves them to another line", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const lineIdentities = trackElement.trackLineElements.map((line) =>
      line.getStableIdentity()
    );

    const beforeByBarUUID = new Map(
      track.staves[0].bars.map((bar) => {
        const barElement = findBarElement(trackElement, bar.uuid);
        expect(barElement).toBeDefined();
        if (barElement === undefined) throw Error("Expected bar element");
        return [
          bar.uuid,
          {
            lineIndex: trackElement.trackLineElements.findIndex((l) =>
              l.trackLineBars.some(
                (b) => b.masterBarUUID === bar.masterBar.uuid
              )
            ),
            beatIdentity: barElement.beatElements[0].getStableIdentity(),
            noteIdentity:
              barElement.beatElements[0].noteElements[0].getStableIdentity(),
            stableIdentity: barElement.getStableIdentity(),
          },
        ];
      })
    );

    const firstLine = trackElement.trackLineElements[0];
    const affectedMasterBarIndex =
      firstLine.trackLineBars[firstLine.trackLineBars.length - 1]
        .masterBarIndex;
    const affectedBar = track.staves[0].bars[affectedMasterBarIndex];

    const affectedVoiceBar = affectedBar.getVoiceBar(1);
    if (affectedVoiceBar === null) {
      throw Error("Expected voice 1 in affected bar");
    }
    for (let i = 0; i < 16; i++) {
      affectedVoiceBar.insertBeat(i + 1);
    }

    updateMasterBars(trackElement, [affectedMasterBarIndex]);

    expect(
      trackElement.trackLineElements.map((line) => line.getStableIdentity())
    ).toEqual(lineIdentities);

    const movedBarUUID = track.staves[0].bars.find((bar) => {
      const before = beforeByBarUUID.get(bar.uuid);
      const after = findBarElement(trackElement, bar.uuid);
      return (
        before !== undefined &&
        after !== undefined &&
        trackElement.trackLineElements.findIndex((l) =>
          l.trackLineBars.some((b) => b.masterBarUUID === bar.masterBar.uuid)
        ) !== before.lineIndex
      );
    })?.uuid;
    expect(movedBarUUID).toBeDefined();
    if (movedBarUUID === undefined) throw Error("Expected moved bar UUID");

    const before = beforeByBarUUID.get(movedBarUUID);
    if (before === undefined) throw Error("Expected original bar element");
    const after = findBarElement(trackElement, movedBarUUID);
    expect(after?.getStableIdentity()).toBe(before.stableIdentity);
    expect(after?.beatElements[0].getStableIdentity()).toBe(
      before.beatIdentity
    );
    expect(after?.beatElements[0].noteElements[0].getStableIdentity()).toBe(
      before.noteIdentity
    );
  });

  test("targeted update matches full rebuild after deleting a bar in the middle", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const fullRebuildTrackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS
    );
    trackElement.update();

    const removeIndex = 4;
    score.removeMasterBar(removeIndex);

    updateMasterBars(trackElement, [removeIndex]);
    fullRebuildTrackElement.update();

    expectTargetedUpdateToMatchFullRebuild(
      trackElement,
      fullRebuildTrackElement
    );
  });

  test("targeted update matches full rebuild after inserting a bar in the middle", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const fullRebuildTrackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS
    );
    trackElement.update();

    const insertIndex = 4;
    score.insertMasterBar(insertIndex, DEFAULT_MASTER_BAR);

    updateMasterBars(trackElement, [insertIndex]);
    fullRebuildTrackElement.update();

    expectTargetedUpdateToMatchFullRebuild(
      trackElement,
      fullRebuildTrackElement
    );
  });

  test("horizontal append keeps earlier beats in model registry", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const firstVoiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (firstVoiceBar === null) {
      throw Error("Expected voice 1 in first bar");
    }
    const firstBeat = firstVoiceBar.beats[0];
    const affectedMasterBarIndex = score.masterBars.length;
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    updateMasterBars(trackElement, [affectedMasterBarIndex]);

    expect(trackElement.getBeatElement(firstBeat)?.beat).toBe(firstBeat);
  });

  test("vertical palm mute command reports the affected note", () => {
    const { track } = createScoreGraph();
    const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in first bar");
    }
    const affectedNote = voiceBar.beats[0].notes?.[0];
    if (!(affectedNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    affectedNote.fret = 5;
    const setTechCommand = new SetTechniqueCommand(
      [affectedNote],
      GuitarTechniqueType.PalmMute
    );
    setTechCommand.execute();

    expect(setTechCommand.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: affectedNote.uuid },
    ]);
  });

  test("wraps whole bars onto next track line and keeps line navigation/selection consistent", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const lines = trackElement.trackLineElements;
    expect(lines.length).toBeGreaterThan(1);
    const renderedBars = lines.flatMap((l) =>
      l.staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (b) => b.bar
      )
    );
    expect(renderedBars).toEqual(track.staves[0].bars);

    const firstLine = lines[0];
    const secondLine = lines[1];
    expect(trackElement.getPrevTrackLineElement(firstLine)).toBeNull();
    expect(trackElement.getNextTrackLineElement(firstLine)).toBe(secondLine);
    expect(trackElement.getPrevTrackLineElement(secondLine)).toBe(firstLine);
    expect(secondLine.boundingBox.y).toBeCloseTo(firstLine.boundingBox.bottom);

    const secondLineStyle =
      secondLine.staffLineContainers[0].styleLinesAsArray[0];
    expect(secondLineStyle.barElements[0].boundingBox.x).toBeCloseTo(0);

    const firstLineStyle =
      firstLine.staffLineContainers[0].styleLinesAsArray[0];
    expect(
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeCloseTo(TEST_LAYOUT_DIMENSIONS.width);
    expect(
      secondLineStyle.barElements[secondLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeLessThanOrEqual(TEST_LAYOUT_DIMENSIONS.width);

    for (const line of lines) {
      const styleLine = line.staffLineContainers[0].styleLinesAsArray[0];
      expect(styleLine.barElements).toHaveLength(line.trackLineBars.length);
      expect(styleLine.barElements[0].boundingBox.x).toBeCloseTo(0);

      for (let i = 0; i < line.trackLineBars.length; i++) {
        const masterBarIndex = line.trackLineBars[i].masterBarIndex;
        expect(styleLine.barElements[i].bar).toBe(
          track.staves[0].bars[masterBarIndex]
        );

        if (i > 0) {
          expect(styleLine.barElements[i].boundingBox.x).toBeCloseTo(
            styleLine.barElements[i - 1].boundingBox.right
          );
        }
      }
    }

    const firstLineVoiceBar =
      track.staves[0].bars[
        firstLine.trackLineBars[0].masterBarIndex
      ].getVoiceBar(1);
    if (firstLineVoiceBar === null) {
      throw Error("Expected voice 1 in first line bar");
    }
    const secondLineVoiceBar =
      track.staves[0].bars[
        secondLine.trackLineBars[0].masterBarIndex
      ].getVoiceBar(1);
    if (secondLineVoiceBar === null) {
      throw Error("Expected voice 1 in second line bar");
    }
    const firstLineBeat = firstLineVoiceBar.beats[0];
    const secondLineBeat = secondLineVoiceBar.beats[0];
    const selectionRects = trackElement.getSelectionRects([
      firstLineBeat,
      secondLineBeat,
    ]);
    const firstLineBeatElement = trackElement.getBeatElement(firstLineBeat);
    const secondLineBeatElement = trackElement.getBeatElement(secondLineBeat);

    expect(firstLineBeatElement).toBeDefined();
    expect(secondLineBeatElement).toBeDefined();
    if (firstLineBeatElement === undefined)
      throw Error("Expected first line beat element");
    if (secondLineBeatElement === undefined)
      throw Error("Expected second line beat element");
    expect(selectionRects).toHaveLength(2);
    expect(selectionRects[0].width).toBeGreaterThan(0);
    expect(selectionRects[1].width).toBeGreaterThan(0);
    expect(selectionRects[1].y).toBeGreaterThan(selectionRects[0].y);
    expect(selectionRects[0].x).toBeLessThan(
      firstLineBeatElement.barElement.globalCoords.x +
        firstLineBeatElement.barLocalBoundingBox.x
    );
    expect(selectionRects[1].x).toBeLessThan(
      secondLineBeatElement.barElement.globalCoords.x +
        secondLineBeatElement.barLocalBoundingBox.x
    );
    const selectedElements = [firstLineBeatElement, secondLineBeatElement];
    for (const [i, beatElement] of selectedElements.entries()) {
      const noteElement = beatElement.noteElements[0];
      if (!(noteElement instanceof TabNoteSlotElement))
        throw Error("Expected tab note slot");
      const noteBounds = noteElement.textRectGlobal;
      expect(selectionRects[i].x).toBeLessThanOrEqual(noteBounds.x);
      expect(selectionRects[i].right).toBeGreaterThanOrEqual(noteBounds.right);
      expect(selectionRects[i].y).toBeLessThanOrEqual(noteBounds.y);
      expect(selectionRects[i].bottom).toBeGreaterThanOrEqual(
        noteBounds.bottom
      );
    }
  });

  test("initializes whole-track shell geometry without materializing every line", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 20; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const lines = trackElement.trackLineElements;

    expect(lines.length).toBeGreaterThan(2);
    expect(trackElement.materializedLineIndices.size).toBe(0);
    expect(lines[0].boundingBox.y).toBe(0);
    for (const [i, line] of lines.entries()) {
      expect(line.staffLineContainers).toEqual([]);
      expect(line.boundingBox.height).toBeGreaterThan(0);
      if (i > 0) {
        expect(line.boundingBox.y).toBe(lines[i - 1].boundingBox.bottom);
      }
    }
    expect(trackElement.height).toBe(
      lines[lines.length - 1].boundingBox.bottom
    );

    const predictedBounds = lines.map((v) => v.globalBoundingBox);
    trackElement.update();

    expect(trackElement.materializedLineIndices.size).toBe(lines.length);
    expect(
      trackElement.trackLineElements.map((v) => v.globalBoundingBox)
    ).toEqual(predictedBounds);
  });

  test("viewport materialization preserves shell positions and total height", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 20; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const initialHeight = trackElement.height;
    const initialBounds = trackElement.trackLineElements.map(
      (v) => v.globalBoundingBox
    );
    expect(initialBounds.length).toBeGreaterThan(2);

    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 1 },
      rebuildSkeleton: false,
      forceElements: false,
      dematerializeOutsideRange: {
        startLineIndex: 0,
        endLineIndex: 1,
      },
    });

    expect([...trackElement.materializedLineIndices]).toEqual([0, 1]);
    for (const line of trackElement.trackLineElements.slice(2)) {
      expect(line.staffLineContainers).toEqual([]);
    }
    expect(
      trackElement.trackLineElements.map((v) => v.globalBoundingBox)
    ).toEqual(initialBounds);
    expect(trackElement.height).toBe(initialHeight);
  });

  test("retains skeleton rebuild provenance until the diff is consumed", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    trackElement.consumeDiff();

    trackElement.update({ affectedMasterBarIndices: [0] });
    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
      rebuildSkeleton: false,
      forceElements: false,
    });

    expect(trackElement.skeletonWasRebuilt).toBe(true);
    trackElement.consumeDiff();
    expect(trackElement.skeletonWasRebuilt).toBe(false);
  });

  test("materializes and dematerializes single-line master-bar ranges", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 8; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const trackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      TabUILayoutMode.SingleLine
    );
    const firstBeat = track.staves[0].bars[1].getVoiceBar(1)?.beats[0];
    const laterBeat = track.staves[0].bars[6].getVoiceBar(1)?.beats[0];
    if (firstBeat === undefined || laterBeat === undefined) {
      throw Error("Expected beats in materialization test bars");
    }

    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
      masterBarRange: { startMasterBarIndex: 1, endMasterBarIndex: 2 },
      rebuildSkeleton: false,
      dematerializeOutsideRange: { startLineIndex: 0, endLineIndex: 0 },
      dematerializeOutsideMasterBarRange: {
        startMasterBarIndex: 1,
        endMasterBarIndex: 2,
      },
    });
    const firstIdentity = trackElement
      .getBeatElement(firstBeat)
      ?.getStableIdentity();
    expect(firstIdentity).toBeDefined();
    const firstMaterializedBars =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(firstMaterializedBars.map((b) => b.bar)).toEqual(
      track.staves[0].bars.slice(1, 3)
    );
    expect(firstMaterializedBars[0].boundingBox.x).toBe(
      trackElement.trackLineElements[0].trackLineBars[1].x
    );
    expect(firstMaterializedBars[0].boundingBox.x).toBeGreaterThan(0);

    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
      masterBarRange: { startMasterBarIndex: 5, endMasterBarIndex: 6 },
      rebuildSkeleton: false,
      dematerializeOutsideRange: { startLineIndex: 0, endLineIndex: 0 },
      dematerializeOutsideMasterBarRange: {
        startMasterBarIndex: 5,
        endMasterBarIndex: 6,
      },
    });

    expect(trackElement.getBeatElement(firstBeat)).toBeUndefined();
    expect(trackElement.getBeatElement(laterBeat)).toBeDefined();
    expect(
      trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (b) => b.bar
      )
    ).toEqual(track.staves[0].bars.slice(5, 7));

    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
      masterBarRange: { startMasterBarIndex: 1, endMasterBarIndex: 2 },
      rebuildSkeleton: false,
      dematerializeOutsideRange: { startLineIndex: 0, endLineIndex: 0 },
      dematerializeOutsideMasterBarRange: {
        startMasterBarIndex: 1,
        endMasterBarIndex: 2,
      },
    });
    expect(trackElement.getBeatElement(firstBeat)?.getStableIdentity()).toBe(
      firstIdentity
    );
    expect(trackElement.getBeatElement(laterBeat)).toBeUndefined();
  });

  test("keeps descendant identities stable after single-line rematerialization", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 5; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const targetVoice = track.staves[0].bars[1].getVoiceBar(1);
    if (targetVoice === null) {
      throw Error("Expected target voice bar");
    }
    targetVoice.replaceBeats([
      createBeat(targetVoice, NoteDuration.Eighth, 0, {
        normalCount: 3,
        tupletCount: 2,
      }),
      createBeat(targetVoice, NoteDuration.Eighth, 0, {
        normalCount: 3,
        tupletCount: 2,
      }),
      createBeat(targetVoice, NoteDuration.Eighth, 0, {
        normalCount: 3,
        tupletCount: 2,
      }),
    ]);
    const note = targetVoice.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected target guitar note");
    }
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));
    const trackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      TabUILayoutMode.SingleLine
    );
    const materialize = (startMasterBarIndex: number): void => {
      trackElement.update({
        lineRange: { startLineIndex: 0, endLineIndex: 0 },
        masterBarRange: {
          startMasterBarIndex,
          endMasterBarIndex: startMasterBarIndex + 1,
        },
        rebuildSkeleton: false,
        dematerializeOutsideRange: {
          startLineIndex: 0,
          endLineIndex: 0,
        },
        dematerializeOutsideMasterBarRange: {
          startMasterBarIndex,
          endMasterBarIndex: startMasterBarIndex + 1,
        },
      });
    };
    const classes = [
      TabBeatElement,
      TabNoteSlotElement,
      GuitarTechniqueElement,
      GuitarTechniqueLabelElement,
      BeamSegmentElement,
      BarTupletGroupElement,
    ];
    const identitySnapshot = (): string[] => {
      return trackElement.trackLineElements[0].drawableNotationElements
        .filter((element) => classes.some((c) => element instanceof c))
        .map((element) => element.getStableIdentity())
        .sort();
    };

    materialize(1);
    const before = identitySnapshot();
    for (const elementClass of classes) {
      expect(
        trackElement.trackLineElements[0].drawableNotationElements.some(
          (e) => e instanceof elementClass
        )
      ).toBe(true);
    }

    materialize(4);
    expect(trackElement.getBeatElement(targetVoice.beats[0])).toBeUndefined();
    materialize(1);

    expect(identitySnapshot()).toEqual(before);
  });

  test("second-line tempo info shifts down when first line grows from technique labels", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const secondLineStartIndex =
      trackElement.trackLineElements[1].trackLineBars[0].masterBarIndex;
    score.masterBars[secondLineStartIndex].tempo = 160;

    trackElement.update();

    const beforeLine = trackElement.trackLineElements[1];
    const beforeBar =
      beforeLine.staffLineContainers[0].styleLinesAsArray[0].barElements[0];
    const beforeInfo = beforeLine.trackLineInfoElement;
    const beforeTempo = beforeInfo?.getBarTempoRectGlobal(beforeBar);
    const beforeLocalTempo = beforeInfo?.getBarTempoRectLineLocal(beforeBar);
    if (beforeTempo === undefined || beforeLocalTempo === undefined) {
      throw Error("Expected second-line tempo rectangle");
    }
    const beforeFirstLineHeight =
      trackElement.trackLineElements[0].boundingBox.height;

    const firstLineVoiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (firstLineVoiceBar === null) {
      throw Error("Expected voice 1 in first bar");
    }
    const firstLineNote = firstLineVoiceBar.beats[0].notes?.[0];
    if (!(firstLineNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    firstLineNote.fret = 5;
    firstLineNote.addTechnique(
      new GuitarTechnique(firstLineNote, GuitarTechniqueType.Vibrato)
    );

    trackElement.update();

    const afterLine = trackElement.trackLineElements[1];
    const afterBar =
      afterLine.staffLineContainers[0].styleLinesAsArray[0].barElements[0];
    const afterInfo = afterLine.trackLineInfoElement;
    const afterTempo = afterInfo?.getBarTempoRectGlobal(afterBar);
    if (afterTempo === undefined) {
      throw Error(
        "Expected second-line tempo rectangle after technique update"
      );
    }

    const rowHeight = TEST_LAYOUT_DIMENSIONS.techLabelHeight;
    expect(trackElement.trackLineElements[0].boundingBox.height).toBe(
      beforeFirstLineHeight + rowHeight
    );
    expect(afterTempo.y).toBe(beforeTempo.y + rowHeight);
    expect(afterTempo.x).toBe(beforeTempo.x);
    expect(afterInfo?.getBarTempoRectLineLocal(afterBar)).toEqual(
      beforeLocalTempo
    );
  });
});
