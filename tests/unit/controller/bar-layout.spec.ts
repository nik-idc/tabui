import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { ScoreLayoutPlanner } from "../../../src/notation/controller/layout/score-layout-plan";
import { BeatElement } from "../../../src/notation/controller/element/beat/beat-element";
import {
  Bar,
  Beat,
  Guitar,
  MasterBarData,
  NoteDuration,
  Score,
  Staff,
  Track,
} from "../../../src/notation/model";
import { createTestLayoutDimensions, TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { TabUILayoutMode } from "../../../src/config/tabui-config";
import { required } from "../required";

function createGraph(masterBarData?: Partial<MasterBarData>): {
  score: Score;
  track: Track<Guitar>;
  staff: Staff<Guitar>;
  bar: Bar<Guitar>;
} {
  const score = new Score();
  const track = score.tracks[0] as Track<Guitar>;
  const staff = track.staves[0] as Staff<Guitar>;
  const masterBar = score.masterBars[0];
  masterBar.tempo = masterBarData?.tempo ?? 120;
  masterBar.beatsCount = masterBarData?.beatsCount ?? 4;
  masterBar.duration = masterBarData?.duration ?? NoteDuration.Quarter;
  masterBar.isRepeatStart = masterBarData?.isRepeatStart ?? false;
  masterBar.isRepeatEnd = masterBarData?.isRepeatEnd ?? false;

  return { score, track, staff, bar: staff.bars[0] as Bar<Guitar> };
}

function replaceVoiceBeats(
  bar: Bar<Guitar>,
  voiceNumber: 1 | 2 | 3 | 4,
  durations: NoteDuration[]
) {
  const voiceBar =
    bar.getVoiceBar(voiceNumber) ?? bar.insertVoiceBar(voiceNumber);
  const beats = durations.map(
    (duration) => new Beat(voiceBar, bar.trackContext, [], duration)
  );
  voiceBar.replaceBeats(beats);
  return beats;
}

function findBeatElement(
  trackElement: TrackElement,
  beat: Beat<Guitar>
): BeatElement | undefined {
  return trackElement.trackLineElements
    .flatMap((line) => line.staffLineContainers)
    .flatMap((staffLine) => staffLine.styleLinesAsArray)
    .flatMap((styleLine) => styleLine.barElements)
    .flatMap((barElement) => barElement.beatElements)
    .find((beatElement) => beatElement.beat === beat);
}

describe("bar spacing", () => {
  test("reserves the full measure width for underfilled voices", () => {
    const { track, bar } = createGraph();
    const quarters = [NoteDuration.Quarter, NoteDuration.Quarter];
    const eighths = [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ];
    const underfilledBeats = replaceVoiceBeats(bar, 1, quarters);
    replaceVoiceBeats(bar, 2, eighths);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const before = required(findBeatElement(trackElement, underfilledBeats[1]));
    const width = required(before.owningBarElement).boundingBox.width;
    const secondAttackX = before.barLocalCoords.x;

    const filledBeats = replaceVoiceBeats(bar, 1, [
      ...quarters,
      NoteDuration.Half,
    ]);
    replaceVoiceBeats(bar, 2, [...eighths, NoteDuration.Half]);
    trackElement.update();

    const after = required(findBeatElement(trackElement, filledBeats[1]));
    expect(required(after.owningBarElement).boundingBox.width).toBe(width);
    expect(after.barLocalCoords.x).toBe(secondAttackX);
  });

  test("keeps overflowing content inside a wrapped bar", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Whole,
      NoteDuration.Quarter,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const elements = beats.map((b) =>
      required(findBeatElement(trackElement, b))
    );
    for (let i = 1; i < elements.length; i++) {
      expect(elements[i].barLocalCoords.x).toBeGreaterThan(
        elements[i - 1].barLocalCoords.x
      );
    }
    const last = elements[elements.length - 1];
    expect(last.barLocalBoundingBox.right).toBeLessThanOrEqual(
      required(last.owningBarElement).boundingBox.width
    );
  });

  test("shares attack columns across staves with different rhythms", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    const quarters = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const eighths = replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const quarterXs = quarters.map(
      (b) => required(findBeatElement(trackElement, b)).globalCoords.x
    );
    const eighthXs = eighths.map(
      (b) => required(findBeatElement(trackElement, b)).globalCoords.x
    );
    expect(eighthXs[0]).toBe(quarterXs[0]);
    expect(eighthXs[1]).toBeGreaterThan(quarterXs[0]);
    expect(eighthXs[1]).toBeLessThan(quarterXs[1]);
    expect(eighthXs[2]).toBe(quarterXs[1]);
  });

  test("leaves space for the time signature before musical content", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [NoteDuration.Whole]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beatElement = required(findBeatElement(trackElement, beats[0]));
    const barElement = required(beatElement.owningBarElement);
    expect(beatElement.barLocalCoords.x).toBeGreaterThan(
      required(barElement.timeSigRect).right
    );
    expect(beatElement.barLocalBoundingBox.right).toBeLessThanOrEqual(
      barElement.boundingBox.width
    );
  });

  test("adding repeat signs preserves bar width and attack positions", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Half,
      NoteDuration.Half,
    ]);
    const masterBar = track.score.masterBars[0];
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const first = required(findBeatElement(trackElement, beats[0]));
    const width = required(first.owningBarElement).boundingBox.width;
    const attackXs = beats.map(
      (b) => required(findBeatElement(trackElement, b)).barLocalCoords.x
    );

    masterBar.isRepeatStart = true;
    trackElement.update();
    const afterStart = required(
      required(findBeatElement(trackElement, beats[0])).owningBarElement
    );
    expect(afterStart.repeatStartRect).toBeDefined();
    expect(afterStart.boundingBox.width).toBe(width);
    expect(
      beats.map(
        (b) => required(findBeatElement(trackElement, b)).barLocalCoords.x
      )
    ).toEqual(attackXs);

    masterBar.isRepeatEnd = true;
    trackElement.update();
    const afterEnd = required(
      required(findBeatElement(trackElement, beats[0])).owningBarElement
    );
    expect(afterEnd.repeatEndRect).toBeDefined();
    expect(afterEnd.boundingBox.width).toBe(width);
    expect(
      beats.map(
        (b) => required(findBeatElement(trackElement, b)).barLocalCoords.x
      )
    ).toEqual(attackXs);
  });
});

describe("musical beat layout", () => {
  test("aligns same-time beats across voices", () => {
    const { track, bar } = createGraph();
    const voiceOneBeats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const voiceTwoBeats = replaceVoiceBeats(bar, 2, [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const first = required(findBeatElement(trackElement, voiceOneBeats[0]));
    const quarter = required(findBeatElement(trackElement, voiceOneBeats[1]));
    const eighth = required(findBeatElement(trackElement, voiceTwoBeats[2]));
    expect(quarter.barLocalCoords.x).toBeGreaterThan(first.barLocalCoords.x);
    expect(quarter.barLocalCoords.x).toBe(eighth.barLocalCoords.x);
  });

  test("gives shorter bars less width than longer bars on the last line", () => {
    const { score, track, bar } = createGraph({
      beatsCount: 1,
      duration: NoteDuration.Quarter,
    });
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    const secondBar = score
      .appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      })
      .bars.get(track.staves[0].uuid) as Bar<Guitar>;
    replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(1);
    const barElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(barElements).toHaveLength(2);

    expect(barElements[0].boundingBox.width).toBeLessThan(
      barElements[1].boundingBox.width
    );
  });

  test("fills the available width on non-final lines", () => {
    const { score, track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    for (let i = 0; i < 4; i++) {
      const nextBar = score
        .appendMasterBar({
          tempo: 120,
          beatsCount: 4,
          duration: NoteDuration.Quarter,
          isRepeatStart: false,
          isRepeatEnd: false,
          repeatCount: null,
        })
        .bars.get(track.staves[0].uuid) as Bar<Guitar>;
      replaceVoiceBeats(nextBar, 1, [
        NoteDuration.Quarter,
        NoteDuration.Quarter,
        NoteDuration.Quarter,
        NoteDuration.Quarter,
      ]);
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(2);
    const firstLineBarElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    const lastBar = firstLineBarElements[firstLineBarElements.length - 1];
    expect(firstLineBarElements).toHaveLength(4);
    expect(lastBar.lineLocalBoundingBox.right).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.width
    );
  });

  test("shorter voice-bar columns do not widen duration-dominated bars", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    replaceVoiceBeats(bar, 1, [NoteDuration.Half, NoteDuration.Half]);
    const secondBeats = replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Half,
      NoteDuration.Half,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const before = required(findBeatElement(trackElement, secondBeats[1]));
    const width = required(before.owningBarElement).boundingBox.width;
    const attackX = before.globalCoords.x;

    replaceVoiceBeats(bar, 1, [NoteDuration.Half]);
    trackElement.update();

    const after = required(findBeatElement(trackElement, secondBeats[1]));
    expect(required(after.owningBarElement).boundingBox.width).toBe(width);
    expect(after.globalCoords.x).toBe(attackX);
  });

  test("keeps dense uneven attack columns from colliding", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Sixteenth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const attackXs = beats.map((beat) => {
      const beatElement = findBeatElement(trackElement, beat);
      expect(beatElement).toBeDefined();
      return required(beatElement).barLocalCoords.x;
    });

    for (let i = 1; i < attackXs.length; i++) {
      expect(attackXs[i] - attackXs[i - 1]).toBeGreaterThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.minRhythmColumnGap
      );
    }
  });

  test("compresses a single bar that is too dense to fit collision-free", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(
      bar,
      1,
      Array.from({ length: 64 }, () => NoteDuration.SixtyFourth)
    );
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const barElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];

    // The first line reserves 18px for tuning and 61.875px for appending a bar.
    expect(barElement.boundingBox.width).toBeCloseTo(1120.125);

    const elements = beats.map((b) =>
      required(findBeatElement(trackElement, b))
    );
    for (let i = 1; i < elements.length; i++) {
      const gap =
        elements[i].barLocalCoords.x - elements[i - 1].barLocalCoords.x;
      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeLessThan(TEST_LAYOUT_DIMENSIONS.minRhythmColumnGap);
    }
    for (const element of elements) {
      expect(element.barLocalBoundingBox.right).toBeLessThanOrEqual(
        barElement.boundingBox.width
      );
    }
  });
});

describe("score-wide bar layout", () => {
  test("shares wrapped widths and ranges across tracks with different rhythms", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    replaceVoiceBeats(
      secondBar,
      1,
      Array.from({ length: 16 }, () => NoteDuration.Sixteenth)
    );
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
    }

    const planner = new ScoreLayoutPlanner(score, TEST_LAYOUT_DIMENSIONS);
    const firstTrackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      planner
    );
    firstTrackElement.update();

    const secondTrackElement = new TrackElement(
      secondTrack,
      TEST_LAYOUT_DIMENSIONS,
      planner
    );
    secondTrackElement.update();

    expect(firstTrackElement.trackLineElements.length).toBeGreaterThan(1);
    expect(
      secondTrackElement.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    ).toEqual(
      firstTrackElement.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    );
    expect(
      secondTrackElement.trackLineElements.flatMap((l) =>
        l.trackLineBars.map((b) => b.finalizedWidth)
      )
    ).toEqual(
      firstTrackElement.trackLineElements.flatMap((l) =>
        l.trackLineBars.map((b) => b.finalizedWidth)
      )
    );
  });

  test("recomputes shared wrapped ranges after a responsive width change", () => {
    const { score, track } = createGraph({
      beatsCount: 1,
      duration: NoteDuration.Quarter,
    });
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    for (let i = 0; i < 5; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 1,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
    }

    const layoutDimensions = createTestLayoutDimensions();
    const planner = new ScoreLayoutPlanner(score, layoutDimensions);
    const firstTrackElement = new TrackElement(
      track,
      layoutDimensions,
      planner
    );
    const secondTrackElement = new TrackElement(
      secondTrack,
      layoutDimensions,
      planner
    );
    firstTrackElement.update();
    secondTrackElement.update();
    const beforeRanges = firstTrackElement.trackLineElements.map((l) =>
      l.trackLineBars.map((b) => b.masterBarIndex)
    );

    layoutDimensions.setWidth(400);
    firstTrackElement.refreshLayout();
    secondTrackElement.refreshLayout();

    const firstRanges = firstTrackElement.trackLineElements.map((l) =>
      l.trackLineBars.map((b) => b.masterBarIndex)
    );
    const secondRanges = secondTrackElement.trackLineElements.map((l) =>
      l.trackLineBars.map((b) => b.masterBarIndex)
    );
    expect(firstRanges.length).toBeGreaterThan(beforeRanges.length);
    expect(secondRanges).toEqual(firstRanges);
  });

  test("shares wrapped ranges and equal-time beat coordinates across tracks", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    const firstBeats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const secondBeats = replaceVoiceBeats(
      secondBar,
      1,
      Array.from({ length: 8 }, () => NoteDuration.Eighth)
    );
    for (let i = 0; i < 4; i++) {
      const appended = score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
      replaceVoiceBeats(
        appended.bars.get(track.staves[0].uuid) as Bar<Guitar>,
        1,
        [NoteDuration.Quarter, NoteDuration.Quarter]
      );
      replaceVoiceBeats(
        appended.bars.get(secondTrack.staves[0].uuid) as Bar<Guitar>,
        1,
        Array.from({ length: 8 }, () => NoteDuration.Eighth)
      );
    }

    const firstTrackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const secondTrackElement = new TrackElement(
      secondTrack,
      TEST_LAYOUT_DIMENSIONS
    );
    firstTrackElement.update();
    secondTrackElement.update();

    expect(
      firstTrackElement.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    ).toEqual(
      secondTrackElement.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    );
    const quarter = required(findBeatElement(firstTrackElement, firstBeats[1]));
    const eighth = required(
      findBeatElement(secondTrackElement, secondBeats[2])
    );
    const intervening = required(
      findBeatElement(secondTrackElement, secondBeats[1])
    );
    expect(quarter.globalCoords.x).toBe(eighth.globalCoords.x);
    expect(intervening.globalCoords.x).toBeLessThan(quarter.globalCoords.x);
    expect(intervening.globalCoords.x).toBeGreaterThan(
      required(findBeatElement(firstTrackElement, firstBeats[0])).globalCoords.x
    );
  });

  test("refreshes beat geometry when another track changes shared wrapped widths", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const firstBeats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Half,
      NoteDuration.Half,
    ]);
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const beforeX = required(findBeatElement(trackElement, firstBeats[1]))
      .globalCoords.x;
    const beforeRanges = trackElement.trackLineElements.map((l) =>
      l.trackLineBars.map((b) => b.masterBarIndex)
    );
    const secondTrackBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    replaceVoiceBeats(
      secondTrackBar,
      1,
      Array.from({ length: 16 }, () => NoteDuration.Sixteenth)
    );

    trackElement.update({ affectedMasterBarIndices: [0] });

    const after = required(findBeatElement(trackElement, firstBeats[1]));
    expect(after.globalCoords.x).toBeGreaterThan(beforeX);
    expect(
      trackElement.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    ).not.toEqual(beforeRanges);
    expect(after.barLocalBoundingBox.right).toBeLessThanOrEqual(
      required(after.owningBarElement).boundingBox.width
    );
  });
});

describe("wrapped and intrinsic bar widths", () => {
  test("places intrinsic bars contiguously with duration-sensitive widths", () => {
    const { score, track, bar } = createGraph({
      beatsCount: 1,
      duration: NoteDuration.Quarter,
    });
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      isRepeatStart: false,
      isRepeatEnd: false,
      repeatCount: null,
    });

    const trackElement = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      TabUILayoutMode.SingleLine
    );
    trackElement.update();

    const bars =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(bars).toHaveLength(2);
    expect(bars[0].lineLocalBoundingBox.x).toBe(
      TEST_LAYOUT_DIMENSIONS.noteTextSize * 1.5
    );
    expect(bars[1].lineLocalBoundingBox.x).toBeCloseTo(
      bars[0].lineLocalBoundingBox.right
    );
    expect(bars[0].boundingBox.width).toBeLessThan(bars[1].boundingBox.width);
  });

  test("keeps dense single-line attacks collision-free while wrapped bars fit the page", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(
      bar,
      1,
      Array.from({ length: 64 }, () => NoteDuration.SixtyFourth)
    );

    const singleLine = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      TabUILayoutMode.SingleLine
    );
    const wrapped = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    singleLine.update();
    wrapped.update();

    const intrinsicBar = required(
      required(findBeatElement(singleLine, beats[0])).owningBarElement
    );
    const wrappedBar = required(
      required(findBeatElement(wrapped, beats[0])).owningBarElement
    );
    expect(intrinsicBar.boundingBox.width).toBeGreaterThan(
      TEST_LAYOUT_DIMENSIONS.width
    );
    expect(wrappedBar.boundingBox.width).toBeCloseTo(1120.125);
    const attacks = beats.map(
      (b) => required(findBeatElement(singleLine, b)).globalCoords.x
    );
    for (let i = 1; i < attacks.length; i++) {
      expect(attacks[i] - attacks[i - 1]).toBeGreaterThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.minRhythmColumnGap
      );
    }
  });

  test("stretches non-final wrapped lines and keeps the final line intrinsic", () => {
    const { score, track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    for (let i = 0; i < 4; i++) {
      const appended = score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
      const appendedBar = appended.bars.get(track.staves[0].uuid);
      if (appendedBar === undefined) {
        throw Error("Expected appended bar for track");
      }
      replaceVoiceBeats(appendedBar as Bar<Guitar>, 1, [NoteDuration.Quarter]);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const firstLine =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    const finalLine =
      trackElement.trackLineElements[1].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;

    expect(firstLine).toHaveLength(4);
    expect(firstLine[3].lineLocalBoundingBox.right).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.width
    );
    expect(finalLine).toHaveLength(1);
    const singleLine = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      TabUILayoutMode.SingleLine
    );
    singleLine.update();
    const intrinsicFinal =
      singleLine.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[4];
    expect(finalLine[0].boundingBox.width).toBe(
      intrinsicFinal.boundingBox.width
    );
    expect(finalLine[0].lineLocalBoundingBox.right).toBeLessThan(
      TEST_LAYOUT_DIMENSIONS.width
    );
  });

  test("widens both tracks when one track gains denser attacks", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    const sparse = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    sparse.update();
    const beforeWidth =
      sparse.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0]
        .barElements[0].boundingBox.width;
    replaceVoiceBeats(
      secondBar,
      1,
      Array.from({ length: 16 }, () => NoteDuration.Sixteenth)
    );

    sparse.update();
    const dense = new TrackElement(secondTrack, TEST_LAYOUT_DIMENSIONS);
    dense.update();
    const sparseWidth =
      sparse.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0]
        .barElements[0].boundingBox.width;
    const denseWidth =
      dense.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0]
        .barElements[0].boundingBox.width;
    expect(sparseWidth).toBeGreaterThan(beforeWidth);
    expect(sparseWidth).toBe(denseWidth);
  });

  test("preserves intrinsic widths while responsive wrapping changes", () => {
    const { score, track } = createGraph({
      beatsCount: 1,
      duration: NoteDuration.Quarter,
    });
    for (let i = 0; i < 5; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 1,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
    }
    const layoutDimensions = createTestLayoutDimensions();
    const singleLine = new TrackElement(
      track,
      layoutDimensions,
      undefined,
      TabUILayoutMode.SingleLine
    );
    const wrapped = new TrackElement(track, layoutDimensions);
    singleLine.update();
    wrapped.update();
    const initialIntrinsicWidths =
      singleLine.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (b) => b.boundingBox.width
      );
    const initialRanges = wrapped.trackLineElements.map((l) =>
      l.trackLineBars.map((b) => b.masterBarIndex)
    );

    layoutDimensions.setWidth(200);
    singleLine.refreshLayout();
    wrapped.refreshLayout();

    expect(
      singleLine.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (b) => b.boundingBox.width
      )
    ).toEqual(initialIntrinsicWidths);
    expect(
      wrapped.trackLineElements.map((l) =>
        l.trackLineBars.map((b) => b.masterBarIndex)
      )
    ).not.toEqual(initialRanges);
  });
});

describe("single-line score layout", () => {
  test("uses one line with score-wide intrinsic widths", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    replaceVoiceBeats(
      secondBar,
      1,
      Array.from({ length: 16 }, () => NoteDuration.Sixteenth)
    );
    const appended = score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      isRepeatStart: false,
      isRepeatEnd: false,
      repeatCount: null,
    });
    replaceVoiceBeats(
      required(appended.bars.get(track.staves[0].uuid)) as Bar<Guitar>,
      1,
      [NoteDuration.Quarter]
    );
    const dimensions = createTestLayoutDimensions();
    dimensions.setWidth(400);
    const planner = new ScoreLayoutPlanner(score, dimensions);

    const first = new TrackElement(
      track,
      dimensions,
      planner,
      TabUILayoutMode.SingleLine
    );
    const second = new TrackElement(
      secondTrack,
      dimensions,
      planner,
      TabUILayoutMode.SingleLine
    );
    first.update();
    second.update();

    // Sixteen attacks need 576 px plus 24 px padding and 110.25 px
    // structure. The sparse bar needs 187.2 + 24 + 74.25 px.
    for (const element of [first, second]) {
      expect(element.trackLineElements).toHaveLength(1);
      const placements = element.trackLineElements[0].trackLineBars;
      expect(placements.map((b) => b.masterBarUUID)).toEqual(
        score.masterBars.map((b) => b.uuid)
      );
      expect(placements.map((b) => b.masterBarIndex)).toEqual([0, 1]);
      expect(placements.map((b) => b.x)).toEqual([18, 728.25]);
      expect(placements[0].finalizedWidth).toBeCloseTo(710.25);
      expect(placements[1].finalizedWidth).toBeCloseTo(285.45);
      expect(element.width).toBeCloseTo(1075.575);
    }
  });

  test("aligns equal-score-time beats across tracks", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    const firstBeats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const secondBeats = replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);
    const planner = new ScoreLayoutPlanner(score, TEST_LAYOUT_DIMENSIONS);
    const first = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      planner,
      TabUILayoutMode.SingleLine
    );
    const second = new TrackElement(
      secondTrack,
      TEST_LAYOUT_DIMENSIONS,
      planner,
      TabUILayoutMode.SingleLine
    );
    first.update();
    second.update();

    const firstXs = firstBeats.map(
      (b) => required(findBeatElement(first, b)).globalCoords.x
    );
    const secondXs = secondBeats.map(
      (b) => required(findBeatElement(second, b)).globalCoords.x
    );
    expect(firstXs).toEqual([secondXs[0], secondXs[2]]);
    expect(secondXs[1]).toBeGreaterThan(firstXs[0]);
    expect(secondXs[1]).toBeLessThan(firstXs[1]);
  });

  test("contains overflowing beats without changing score timing", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const secondBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    const firstBeats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Whole,
      NoteDuration.Quarter,
    ]);
    const secondBeats = replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const planner = new ScoreLayoutPlanner(score, TEST_LAYOUT_DIMENSIONS);
    const first = new TrackElement(
      track,
      TEST_LAYOUT_DIMENSIONS,
      planner,
      TabUILayoutMode.SingleLine
    );
    const second = new TrackElement(
      secondTrack,
      TEST_LAYOUT_DIMENSIONS,
      planner,
      TabUILayoutMode.SingleLine
    );
    first.update();
    second.update();

    const duration = bar.masterBar.barDurationFraction;
    expect(duration.numerator / duration.denominator).toBe(1);
    const voiceBar = required(bar.getVoiceBar(1));
    expect(firstBeats[3].endTick / voiceBar.tickResolution).toBe(1.75);
    expect(first.trackLineElements[0].trackLineBars[0].contentEndFraction).toBe(
      1.75
    );
    expect(required(findBeatElement(first, firstBeats[1])).globalCoords.x).toBe(
      required(findBeatElement(second, secondBeats[1])).globalCoords.x
    );
    const firstBarElement =
      first.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0]
        .barElements[0];
    expect(firstBarElement.beatElements.map((b) => b.beat)).toEqual(firstBeats);
    for (const beatElement of firstBarElement.beatElements) {
      expect(beatElement.barLocalBoundingBox.left).toBeGreaterThanOrEqual(0);
      expect(beatElement.barLocalBoundingBox.right).toBeLessThanOrEqual(
        firstBarElement.boundingBox.width
      );
    }
  });
});
