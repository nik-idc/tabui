import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import {
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { NoteDuration } from "../../src/notation/model";
import { ensureLayoutConfigured } from "./helpers";

describe("TrackElement tree", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("builds the expected hierarchy for a single default bar", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(1);

    const line = trackElement.trackLineElements[0];
    expect(line.staffLineElements).toHaveLength(1);

    const staffLine = line.staffLineElements[0];
    expect(staffLine.styleLinesAsArray).toHaveLength(1);

    const styleLine = staffLine.styleLinesAsArray[0];
    expect(styleLine.barElements).toHaveLength(1);
    expect(styleLine.barElements[0].beatElements).toHaveLength(1);
    expect(styleLine.barElements[0].beatElements[0]).toBeInstanceOf(
      TabBeatElement
    );
  });

  test("line-local geometry is exposed for track line and immediate children", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const trackLineInfo = trackLine.trackLineInfoElement;
    const staffLine = trackLine.staffLineElements[0];

    expect(trackLine.lineLocalCoords?.x).toBeCloseTo(0);
    expect(trackLine.lineLocalCoords?.y).toBeCloseTo(0);
    expect(trackLine.lineLocalBoundingBox?.x).toBeCloseTo(0);
    expect(trackLine.lineLocalBoundingBox?.y).toBeCloseTo(0);
    expect(trackLine.lineLocalBoundingBox?.width).toBeCloseTo(
      trackLine.boundingBox.width
    );
    expect(trackLine.lineLocalBoundingBox?.height).toBeCloseTo(
      trackLine.boundingBox.height
    );

    expect(trackLineInfo).not.toBeNull();
    expect(trackLineInfo?.lineLocalCoords?.x).toBeCloseTo(
      trackLineInfo?.boundingBox.x ?? 0
    );
    expect(trackLineInfo?.lineLocalCoords?.y).toBeCloseTo(
      trackLineInfo?.boundingBox.y ?? 0
    );
    expect(trackLineInfo?.lineLocalBoundingBox?.x).toBeCloseTo(
      trackLineInfo?.boundingBox.x ?? 0
    );
    expect(trackLineInfo?.lineLocalBoundingBox?.y).toBeCloseTo(
      trackLineInfo?.boundingBox.y ?? 0
    );
    expect(trackLineInfo?.globalCoords.x).toBeCloseTo(
      trackLine.globalCoords.x + (trackLineInfo?.lineLocalCoords?.x ?? 0)
    );
    expect(trackLineInfo?.globalCoords.y).toBeCloseTo(
      trackLine.globalCoords.y + (trackLineInfo?.lineLocalCoords?.y ?? 0)
    );

    expect(staffLine.lineLocalCoords?.x).toBeCloseTo(staffLine.boundingBox.x);
    expect(staffLine.lineLocalCoords?.y).toBeCloseTo(staffLine.boundingBox.y);
    expect(staffLine.lineLocalBoundingBox?.x).toBeCloseTo(
      staffLine.boundingBox.x
    );
    expect(staffLine.lineLocalBoundingBox?.y).toBeCloseTo(
      staffLine.boundingBox.y
    );
    expect(staffLine.globalCoords.x).toBeCloseTo(
      trackLine.globalCoords.x + (staffLine.lineLocalCoords?.x ?? 0)
    );
    expect(staffLine.globalCoords.y).toBeCloseTo(
      trackLine.globalCoords.y + (staffLine.lineLocalCoords?.y ?? 0)
    );
  });

  test("line-local geometry composes through bar beat note and label descendants", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const trackElement = new TrackElement(track);
    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const staffLine = trackLine.staffLineElements[0];
    const styleLine = staffLine.styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];
    const gapLine = styleLine.techGapElement.techGapLinesAsArray.find(
      (line) => line.labelElements.length > 0
    );
    expect(gapLine).toBeDefined();
    const labelElement = gapLine!.labelElements[0];

    expect(styleLine.lineLocalCoords?.x).toBeCloseTo(
      (staffLine.lineLocalCoords?.x ?? 0) + styleLine.boundingBox.x
    );
    expect(styleLine.lineLocalCoords?.y).toBeCloseTo(
      (staffLine.lineLocalCoords?.y ?? 0) + styleLine.boundingBox.y
    );

    expect(barElement.lineLocalCoords?.x).toBeCloseTo(
      (styleLine.lineLocalCoords?.x ?? 0) + barElement.boundingBox.x
    );
    expect(barElement.lineLocalCoords?.y).toBeCloseTo(
      (styleLine.lineLocalCoords?.y ?? 0) + barElement.boundingBox.y
    );

    expect(beatElement.lineLocalCoords?.x).toBeCloseTo(
      (barElement.lineLocalCoords?.x ?? 0) + beatElement.boundingBox.x
    );
    expect(beatElement.lineLocalCoords?.y).toBeCloseTo(
      (barElement.lineLocalCoords?.y ?? 0) + beatElement.boundingBox.y
    );

    expect(noteElement.lineLocalCoords?.x).toBeCloseTo(
      (beatElement.lineLocalCoords?.x ?? 0) + noteElement.boundingBox.x
    );
    expect(noteElement.lineLocalCoords?.y).toBeCloseTo(
      (beatElement.lineLocalCoords?.y ?? 0) + noteElement.boundingBox.y
    );

    expect(labelElement.lineLocalCoords?.x).toBeCloseTo(
      (beatElement.lineLocalCoords?.x ?? 0) + labelElement.boundingBox.x
    );
    expect(labelElement.lineLocalCoords?.y).toBeCloseTo(
      gapLine?.lineLocalCoords?.y ?? 0
    );
  });

  test("line-local helper origins match previous global geometry contracts", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const trackElement = new TrackElement(track);
    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const trackLineInfo = trackLine.trackLineInfoElement!;
    const barElement =
      trackLine.staffLineElements[0].styleLinesAsArray[0].barElements[0];
    const noteElement = barElement.beatElements[0].noteElements[0];
    const techniqueElement = noteElement.techniqueElements[0];
    const gapLine =
      trackLine.staffLineElements[0].styleLinesAsArray[0].techGapElement.techGapLinesAsArray.find(
        (line) => line.labelElements.length > 0
      )!;
    const labelElement = gapLine.labelElements[0];

    const tempoRectGlobal = trackLineInfo.getBarTempoRectGlobal(barElement)!;
    const tempoRectLineLocal =
      trackLineInfo.getBarTempoRectLineLocal(barElement)!;
    expect(tempoRectGlobal.x - trackLine.globalCoords.x).toBeCloseTo(
      tempoRectLineLocal.x
    );
    expect(tempoRectGlobal.y - trackLine.globalCoords.y).toBeCloseTo(
      tempoRectLineLocal.y
    );

    const tempoTextGlobal =
      trackLineInfo.getBarTempoTextCoordsGlobal(barElement)!;
    const tempoTextLineLocal =
      trackLineInfo.getBarTempoTextCoordsLineLocal(barElement)!;
    expect(tempoTextGlobal.x - trackLine.globalCoords.x).toBeCloseTo(
      tempoTextLineLocal.x
    );
    expect(tempoTextGlobal.y - trackLine.globalCoords.y).toBeCloseTo(
      tempoTextLineLocal.y
    );

    expect(
      techniqueElement.pathOrigin.x - trackLine.globalCoords.x
    ).toBeCloseTo(techniqueElement.pathOriginLineLocal.x);
    expect(
      techniqueElement.pathOrigin.y - trackLine.globalCoords.y
    ).toBeCloseTo(techniqueElement.pathOriginLineLocal.y);

    expect(
      labelElement.descriptorOrigin.x - trackLine.globalCoords.x
    ).toBeCloseTo(labelElement.descriptorOriginLineLocal.x);
    expect(
      labelElement.descriptorOrigin.y - trackLine.globalCoords.y
    ).toBeCloseTo(labelElement.descriptorOriginLineLocal.y);
  });

  test("line-local core notation geometry matches previous global contracts", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.fret = 7;

    const trackElement = new TrackElement(track);
    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const barElement =
      trackLine.staffLineElements[0].styleLinesAsArray[0].barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];

    const outlineGlobal = trackLine.outlineLinesGlobal;
    const outlineLineLocal = trackLine.outlineLinesLineLocal;
    if (outlineGlobal !== undefined && outlineLineLocal !== undefined) {
      expect(outlineGlobal.left.y1 - trackLine.globalCoords.y).toBeCloseTo(
        outlineLineLocal.left.y1
      );
      expect(outlineGlobal.right.y2 - trackLine.globalCoords.y).toBeCloseTo(
        outlineLineLocal.right.y2
      );
    }

    expect(
      barElement.barLeftBorderLineGlobal.x - trackLine.globalCoords.x
    ).toBeCloseTo(barElement.barLeftBorderLineLineLocal.x);
    expect(
      barElement.barRightBorderLineGlobal.y1 - trackLine.globalCoords.y
    ).toBeCloseTo(barElement.barRightBorderLineLineLocal.y1);
    expect(
      barElement.staffLinesGlobal[0].x1 - trackLine.globalCoords.x
    ).toBeCloseTo(barElement.staffLinesLineLocal[0].x1);
    expect(
      barElement.staffLinesGlobal[0].y - trackLine.globalCoords.y
    ).toBeCloseTo(barElement.staffLinesLineLocal[0].y);

    if (
      beatElement.durationStemLineGlobal &&
      beatElement.durationStemLineLineLocal
    ) {
      expect(
        beatElement.durationStemLineGlobal.x - trackLine.globalCoords.x
      ).toBeCloseTo(beatElement.durationStemLineLineLocal.x);
      expect(
        beatElement.durationStemLineGlobal.y1 - trackLine.globalCoords.y
      ).toBeCloseTo(beatElement.durationStemLineLineLocal.y1);
    }

    if (beatElement.dot1CircleGlobal && beatElement.dot1CircleLineLocal) {
      expect(
        beatElement.dot1CircleGlobal.centerX - trackLine.globalCoords.x
      ).toBeCloseTo(beatElement.dot1CircleLineLocal.centerX);
      expect(
        beatElement.dot1CircleGlobal.centerY - trackLine.globalCoords.y
      ).toBeCloseTo(beatElement.dot1CircleLineLocal.centerY);
    }

    expect(noteElement.textRectGlobal.x - trackLine.globalCoords.x).toBeCloseTo(
      noteElement.textRectLineLocal.x
    );
    expect(noteElement.textRectGlobal.y - trackLine.globalCoords.y).toBeCloseTo(
      noteElement.textRectLineLocal.y
    );
    expect(
      noteElement.textCoordsGlobal.x - trackLine.globalCoords.x
    ).toBeCloseTo(noteElement.textCoordsLineLocal.x);
    expect(
      noteElement.textCoordsGlobal.y - trackLine.globalCoords.y
    ).toBeCloseTo(noteElement.textCoordsLineLocal.y);
  });

  test("registry lookup returns the beat element by beat UUID", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    const beat = bar.beats[0];
    const beatElement = trackElement.getBeatElementByUUID(beat.uuid);
    expect(beatElement).toBeDefined();
    expect(beatElement?.beat.uuid).toBe(beat.uuid);
  });

  test("no-op update preserves core element object identity", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    const trackLine = trackElement.trackLineElements[0];
    const staffLine = trackLine.staffLineElements[0];
    const styleLine = staffLine.styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const beatElement = barElement.beatElements[0];
    const noteElement = beatElement.noteElements[0];

    trackElement.update();

    expect(trackElement.trackLineElements[0]).toBe(trackLine);
    expect(trackElement.trackLineElements[0].staffLineElements[0]).toBe(
      staffLine
    );
    expect(
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0]
    ).toBe(styleLine);
    expect(
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0]
    ).toBe(barElement);
    expect(
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0]
    ).toBe(beatElement);
    expect(
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0].noteElements[0]
    ).toBe(noteElement);
  });

  test("element diff reports beat additions and removals", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();
    trackElement.clearElementDiff();

    const addedBeat = bar.appendBeats().beats[0];
    trackElement.update();

    const addDiff = trackElement.getElementDiff();
    const addedBeatElement =
      trackElement.trackLineElements[0].staffLineElements[0].styleLinesAsArray[0].barElements[0].beatElements.find(
        (beatElement) => beatElement.beat === addedBeat
      );
    expect(addedBeatElement).toBeDefined();
    const addedBeatIdentity = addedBeatElement!.getStableIdentity();
    expect(addDiff.added.get(TabBeatElement)?.has(addedBeatIdentity)).toBe(
      true
    );

    trackElement.clearElementDiff();
    bar.removeBeat(1);
    trackElement.update();

    const removeDiff = trackElement.getElementDiff();
    expect(removeDiff.removed.get(TabBeatElement)?.has(addedBeatIdentity)).toBe(
      true
    );
  });

  test("width-affecting updates keep note x coordinates aligned with legacy rebuild", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const trackElement = new TrackElement(track);
    const legacyTrackElement = new TrackElement(track);

    beats[0].baseDuration = NoteDuration.Eighth;
    beats[0].bar.rebuildTiming();

    trackElement.update();
    legacyTrackElement.updateOld();

    const noteX =
      trackElement.trackLineElements[0].staffLineElements[0].styleLinesAsArray[0].barElements[0].beatElements.map(
        (beatElement) => beatElement.noteElements[0].textCoordsGlobal.x
      );
    const legacyNoteX =
      legacyTrackElement.trackLineElements[0].staffLineElements[0].styleLinesAsArray[0].barElements[0].beatElements.map(
        (beatElement) => beatElement.noteElements[0].textCoordsGlobal.x
      );

    expect(noteX).toEqual(legacyNoteX);
  });

  test("wraps whole bars onto next track line and keeps line navigation/selection consistent", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
    trackElement.update();

    const lines = trackElement.trackLineElements;
    expect(lines.length).toBeGreaterThan(1);

    const firstLine = lines[0];
    const secondLine = lines[1];
    expect(trackElement.getPrevTrackLineElement(firstLine)).toBeNull();
    expect(trackElement.getNextTrackLineElement(firstLine)).toBe(secondLine);
    expect(trackElement.getPrevTrackLineElement(secondLine)).toBe(firstLine);
    expect(secondLine.boundingBox.y).toBeCloseTo(firstLine.boundingBox.bottom);

    const secondLineStyle =
      secondLine.staffLineElements[0].styleLinesAsArray[0];
    expect(secondLineStyle.barElements[0].boundingBox.x).toBeCloseTo(0);

    const firstLineStyle = firstLine.staffLineElements[0].styleLinesAsArray[0];
    expect(
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeCloseTo(EditorLayoutDimensions.WIDTH);
    expect(
      secondLineStyle.barElements[secondLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeLessThanOrEqual(EditorLayoutDimensions.WIDTH);

    for (const line of lines) {
      const styleLine = line.staffLineElements[0].styleLinesAsArray[0];
      expect(styleLine.barElements).toHaveLength(line.trackLineData.length);
      expect(styleLine.barElements[0].boundingBox.x).toBeCloseTo(0);

      for (let i = 0; i < line.trackLineData.length; i++) {
        const masterBarIndex = line.trackLineData[i].masterBarIndex;
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

    const firstLineBeat =
      track.staves[0].bars[firstLine.trackLineData[0].masterBarIndex].beats[0];
    const secondLineBeat =
      track.staves[0].bars[secondLine.trackLineData[0].masterBarIndex].beats[0];
    const selectionRects = trackElement.getSelectionRects([
      firstLineBeat,
      secondLineBeat,
    ]);
    const firstLineBeatElement = trackElement.getBeatElementByUUID(
      firstLineBeat.uuid
    );
    const secondLineBeatElement = trackElement.getBeatElementByUUID(
      secondLineBeat.uuid
    );

    expect(firstLineBeatElement).toBeDefined();
    expect(secondLineBeatElement).toBeDefined();
    expect(selectionRects).toHaveLength(2);
    expect(selectionRects[0].width).toBeGreaterThan(0);
    expect(selectionRects[1].width).toBeGreaterThan(0);
    expect(selectionRects[1].y).toBeGreaterThan(selectionRects[0].y);
    expect(selectionRects[0].x).toBeCloseTo(
      trackElement.getBeatElementGlobalCoords(firstLineBeatElement!).x
    );
    expect(selectionRects[1].x).toBeCloseTo(
      trackElement.getBeatElementGlobalCoords(secondLineBeatElement!).x
    );
  });

  test("second-line tempo info shifts down when first line grows from technique labels", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
    trackElement.update();

    const secondLineStartIndex =
      trackElement.trackLineElements[1].trackLineData[0].masterBarIndex;
    score.masterBars[secondLineStartIndex].tempo = 160;
    track.staves[0].bars[secondLineStartIndex].rebuildTiming();

    trackElement.update();

    const beforeY =
      trackElement.trackLineElements[1].trackLineInfoElement?.globalCoords.y ??
      0;

    const firstLineNote = track.staves[0].bars[0].beats[0]
      .notes[0] as GuitarNote;
    firstLineNote.addTechnique(
      new GuitarTechnique(firstLineNote, GuitarTechniqueType.Vibrato)
    );

    trackElement.update();

    expect(
      trackElement.trackLineElements[1].trackLineInfoElement?.globalCoords.y
    ).toBeGreaterThan(beforeY);
  });
});
