import { BeamSegmentElement } from "../../src/notation/controller/element/bar/beam-segment-element";
import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { NoteDuration, ScoreEditor } from "../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

function getBarElement(trackElement: TrackElement) {
  return trackElement.trackLineElements[0].staffLineElements[0]
    .styleLinesAsArray[0].barElements[0];
}

function getBarElementAt(trackElement: TrackElement, index: number) {
  return trackElement.trackLineElements[0].staffLineElements[0]
    .styleLinesAsArray[0].barElements[index];
}

function getBeamSegments(trackElement: TrackElement): BeamSegmentElement[] {
  return getBarElementAt(trackElement, 0)
    .refreshOwnedNotationNodes()
    .filter(
      (element): element is BeamSegmentElement =>
        element instanceof BeamSegmentElement
    );
}

function getTupletElements(trackElement: TrackElement, barIndex = 0) {
  return getBarElementAt(trackElement, barIndex)
    .refreshOwnedNotationNodes()
    .filter((element) => element.constructor.name === "BarTupletGroupElement");
}

function getVoiceBarRhythmElement(trackElement: TrackElement) {
  return getBarElement(trackElement)
    .refreshOwnedNotationNodes()
    .find(
      (element) => element.constructor.name === "VoiceBarRhythmElement"
    ) as any;
}

describe("BeamSegmentElement", () => {
  test("creates one long rect per shared beam level and no short tails for equal flag counts", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beamSegments = getBeamSegments(trackElement);

    expect(beamSegments).toHaveLength(2);
    expect(beamSegments[0].longRects).toHaveLength(2);
    expect(beamSegments[0].shortRects).toHaveLength(0);
    expect(beamSegments[1].longRects).toHaveLength(0);
    expect(beamSegments[1].shortRects).toHaveLength(0);
  });

  test("long rect width equals half current beat plus half next beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const segment = getBeamSegments(trackElement)[0];
    const curBeat = segment.curBeatElement;
    const nextBeat = segment.nextBeatElement as TabBeatElement;
    const stemX = curBeat.durationStemLine?.x ?? 0;
    const expectedWidth = nextBeat.attackX - curBeat.attackX;

    expect(segment.longRects).toHaveLength(2);
    expect(segment.longRects[0].width).toBeCloseTo(expectedWidth);
    expect(segment.longRects[1].width).toBeCloseTo(expectedWidth);
    expect(segment.longRects[0].x).toBeCloseTo(curBeat.boundingBox.x + stemX);
  });

  test("uses a right-facing short tail when the next beat has fewer flags", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const segment = getBeamSegments(trackElement)[0];
    const longX =
      segment.curBeatElement.boundingBox.x +
      (segment.curBeatElement.durationStemLine?.x ?? 0);

    expect(segment.longRects).toHaveLength(1);
    expect(segment.shortRects).toHaveLength(1);
    expect(segment.shortRects[0].x).toBeCloseTo(longX);
  });

  test("terminal segment places remaining short tails to the left", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const segment = getBeamSegments(trackElement)[2];
    const longX =
      segment.curBeatElement.boundingBox.x +
      (segment.curBeatElement.durationStemLine?.x ?? 0);

    expect(segment.nextBeatElement).toBeUndefined();
    expect(segment.longRects).toHaveLength(0);
    expect(segment.shortRects).toHaveLength(1);
    expect(segment.shortRects[0].x).toBeCloseTo(longX - 10);
  });

  test("beam levels stack upward by two flag heights per level", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const segment = getBeamSegments(trackElement)[0];

    expect(segment.longRects).toHaveLength(3);
    expect(segment.longRects[0].height).toBe(
      TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT
    );
    expect(segment.longRects[1].height).toBe(
      TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT
    );
    expect(segment.longRects[0].y - segment.longRects[1].y).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT * 2
    );
    expect(segment.longRects[1].y - segment.longRects[2].y).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT * 2
    );
  });

  test("throws when constructing a beam segment for a non-beamable duration", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const beatElement = getBarElement(trackElement)
      .beatElements[0] as TabBeatElement;

    expect(
      () =>
        new BeamSegmentElement(
          getVoiceBarRhythmElement(trackElement),
          beatElement
        )
    ).toThrow("Beam segment for a beat with a non-beamable duration");
  });

  test("width-affecting updates keep complete beam coordinates aligned with legacy rebuild", () => {
    const { track, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const legacyTrackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    beats[0].baseDuration = NoteDuration.ThirtySecond;
    beats[1].baseDuration = NoteDuration.ThirtySecond;
    voiceBar.rebuildTiming();

    trackElement.update();
    legacyTrackElement.update();

    const segment = getBeamSegments(trackElement)[0];
    const legacySegment = getBeamSegments(legacyTrackElement)[0];

    expect(segment.longRectsGlobal).toEqual(legacySegment.longRectsGlobal);
    expect(segment.shortRectsGlobal).toEqual(legacySegment.shortRectsGlobal);
  });

  test("complete tuplets expose a stable non-empty state hash", () => {
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 3; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const bar2 = staff.bars[1];
    const bar2VoiceBar = bar2.getVoiceBar(1);
    if (bar2VoiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const bar2Beats = [
      createBeat(bar2VoiceBar, NoteDuration.Eighth),
      createBeat(bar2VoiceBar, NoteDuration.Eighth),
    ];
    bar2VoiceBar.beats.splice(0, bar2VoiceBar.beats.length, ...bar2Beats);
    bar2VoiceBar.rebuildTiming();

    ScoreEditor.setTuplet(bar2Beats, { normalCount: 2, tupletCount: 4 });

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElements(trackElement, 1)[0] as any;
    expect(tupletElement.stateHash).not.toBe("");
    expect(tupletElement.completeText).toBe("2:4");
  });
});
