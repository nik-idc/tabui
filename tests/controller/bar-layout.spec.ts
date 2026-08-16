import {
  DiffPart,
  TrackElement,
} from "../../src/notation/controller/element/track-element";
import {
  calculateMasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES,
} from "../../src/notation/controller/layout/bar-layout";
import { ScoreLayoutPlanner } from "../../src/notation/controller/layout/score-layout-plan";
import { BeatElement } from "../../src/notation/controller/element/beat/beat-element";
import {
  Bar,
  BarRepeatStatus,
  Beat,
  Guitar,
  MasterBarData,
  NoteDuration,
  Score,
  Staff,
  Track,
} from "../../src/notation/model";
import { createTestLayoutDimensions, TEST_LAYOUT_DIMENSIONS } from "./helpers";

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
  masterBar.repeatStatus = masterBarData?.repeatStatus ?? BarRepeatStatus.None;

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
    .flatMap((line) => line.staffLineElements)
    .flatMap((staffLine) => staffLine.styleLinesAsArray)
    .flatMap((styleLine) => styleLine.barElements)
    .flatMap((barElement) => barElement.beatElements)
    .find((beatElement) => beatElement.beat === beat);
}

describe("bar layout metrics", () => {
  test("uses canonical master-bar duration with rhythm column count", () => {
    const { track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter, NoteDuration.Quarter]);
    replaceVoiceBeats(bar, 2, [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);

    const metrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(metrics.rhythmColumnCount).toBe(4);
    expect(metrics.contentMinWidth).toBe(
      Math.max(
        TEST_LAYOUT_DIMENSIONS.WIDTH_MAPPING[NoteDuration.Quarter] * 4,
        4 * TEST_LAYOUT_DIMENSIONS.MIN_RHYTHM_COLUMN_GAP,
        TEST_LAYOUT_DIMENSIONS.MIN_RHYTHM_COLUMN_GAP / 0.125
      ) +
        TEST_LAYOUT_DIMENSIONS.RHYTHM_ATTACK_PADDING * 2
    );
  });

  test("does not shorten or lengthen canonical duration for invalid content", () => {
    const { track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);

    expect(
      calculateMasterBarLayoutMetrics(track, 0, TEST_LAYOUT_DIMENSIONS)
        .durationFraction
    ).toBe(1);

    replaceVoiceBeats(bar, 1, [NoteDuration.Whole, NoteDuration.Whole]);

    expect(
      calculateMasterBarLayoutMetrics(track, 0, TEST_LAYOUT_DIMENSIONS)
        .durationFraction
    ).toBe(1);
  });

  test("counts unique rhythm columns across staves", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter, NoteDuration.Quarter]);
    replaceVoiceBeats(secondBar, 1, [NoteDuration.Eighth, NoteDuration.Eighth]);

    const metrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(metrics.rhythmColumnCount).toBe(3);
  });

  test("keeps structural width separate from content minimum", () => {
    const { track } = createGraph();

    const metrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(metrics.structuralWidth).toBe(
      TEST_LAYOUT_DIMENSIONS.TIME_SIG_RECT_WIDTH +
        TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH * 3
    );
    expect(metrics.minWidth).toBe(
      metrics.structuralWidth + metrics.contentMinWidth
    );
  });

  test("repeat status does not affect layout metrics", () => {
    const { track } = createGraph();
    const masterBar = track.score.masterBars[0];
    const before = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    masterBar.repeatStatus = BarRepeatStatus.Start;
    const afterStart = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );
    masterBar.repeatStatus = BarRepeatStatus.End;
    const afterEnd = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(afterStart).toEqual(before);
    expect(afterEnd).toEqual(before);
  });
});

describe("musical beat layout", () => {
  test("aligns same-time beats across voices", () => {
    const { track, bar } = createGraph();
    const voiceOneBeats = replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    const voiceTwoBeats = replaceVoiceBeats(bar, 2, [NoteDuration.Quarter]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    expect(
      findBeatElement(trackElement, voiceOneBeats[0])?.barLocalCoords.x
    ).toBe(findBeatElement(trackElement, voiceTwoBeats[0])?.barLocalCoords.x);
  });

  test("gives shorter bars less width than longer bars on the last line", () => {
    const { score, track, bar } = createGraph({
      beatsCount: 1,
      duration: NoteDuration.Quarter,
      repeatStatus: BarRepeatStatus.None,
    });
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    const secondBar = score
      .appendMasterBar({
        tempo: 120,
        beatsCount: TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
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

    const barElements = trackElement.trackLineElements.flatMap((line) =>
      line.staffLineElements.flatMap((staffLine) =>
        staffLine.styleLinesAsArray.flatMap(
          (styleLine) => styleLine.barElements
        )
      )
    );

    expect(barElements[0].boundingBox.width).toBeLessThan(
      barElements[1].boundingBox.width
    );
  });

  test("finalizes non-last line width without post-layout scaling", () => {
    const { score, track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    for (let i = 0; i < TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES; i++) {
      const nextBar = score
        .appendMasterBar({
          tempo: 120,
          beatsCount: TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES,
          duration: NoteDuration.Quarter,
          repeatStatus: BarRepeatStatus.None,
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

    const firstLineBarElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;
    const lastBar = firstLineBarElements[firstLineBarElements.length - 1];
    expect(lastBar.boundingBox.right).toBeCloseTo(TEST_LAYOUT_DIMENSIONS.WIDTH);
  });

  test("shorter voice-bar columns do not widen duration-dominated bars", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    replaceVoiceBeats(bar, 1, [NoteDuration.Half, NoteDuration.Half]);
    replaceVoiceBeats(secondBar, 1, [NoteDuration.Half, NoteDuration.Half]);
    const halfMetrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    replaceVoiceBeats(bar, 1, [NoteDuration.Half]);
    const shorterVoiceMetrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(shorterVoiceMetrics.contentMinWidth).toBe(
      halfMetrics.contentMinWidth
    );
  });

  test("keeps dense uneven attack columns from colliding", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [
      NoteDuration.Sixteenth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
    ]);
    const metrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(metrics.contentMinWidth).toBeGreaterThan(
      beats.length * TEST_LAYOUT_DIMENSIONS.MIN_RHYTHM_COLUMN_GAP +
        TEST_LAYOUT_DIMENSIONS.RHYTHM_ATTACK_PADDING * 2
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const attackXs = beats.map((beat) => {
      const beatElement = findBeatElement(trackElement, beat);
      expect(beatElement).toBeDefined();
      return beatElement!.barLocalCoords.x;
    });

    for (let i = 1; i < attackXs.length; i++) {
      expect(attackXs[i] - attackXs[i - 1]).toBeGreaterThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.MIN_RHYTHM_COLUMN_GAP
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
    const metrics = calculateMasterBarLayoutMetrics(
      track,
      0,
      TEST_LAYOUT_DIMENSIONS
    );

    expect(metrics.minWidth).toBeGreaterThan(TEST_LAYOUT_DIMENSIONS.WIDTH);

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const barElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0];

    expect(barElement.boundingBox.width).toBe(TEST_LAYOUT_DIMENSIONS.WIDTH);

    const firstBeatElement = findBeatElement(trackElement, beats[0]);
    const secondBeatElement = findBeatElement(trackElement, beats[1]);
    expect(firstBeatElement).toBeDefined();
    expect(secondBeatElement).toBeDefined();
    expect(
      secondBeatElement!.barLocalCoords.x - firstBeatElement!.barLocalCoords.x
    ).toBeLessThan(TEST_LAYOUT_DIMENSIONS.MIN_RHYTHM_COLUMN_GAP);
  });
});

describe("score-wide bar layout", () => {
  test("uses shared widths and ranges after replacing the active track", () => {
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
        repeatStatus: BarRepeatStatus.None,
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

    expect(secondTrackElement.scoreLayoutPlanner).toBe(
      firstTrackElement.scoreLayoutPlanner
    );
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
        repeatStatus: BarRepeatStatus.None,
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
    expect(firstRanges).not.toEqual(beforeRanges);
    expect(secondRanges).toEqual(firstRanges);
  });

  test("uses the widest track requirement for every track", () => {
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

    const plan = new ScoreLayoutPlanner(score, TEST_LAYOUT_DIMENSIONS).plan;
    const firstTrackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const secondTrackElement = new TrackElement(
      secondTrack,
      TEST_LAYOUT_DIMENSIONS
    );
    firstTrackElement.update();
    secondTrackElement.update();

    expect(plan.metrics[0].minWidth).toBe(
      calculateMasterBarLayoutMetrics(secondTrack, 0, TEST_LAYOUT_DIMENSIONS)
        .minWidth
    );
    expect(
      firstTrackElement.trackLineElements[0].trackLineBars[0].finalizedWidth
    ).toBe(
      secondTrackElement.trackLineElements[0].trackLineBars[0].finalizedWidth
    );
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
    const secondBeats = replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    for (let i = 0; i < 4; i++) {
      const appended = score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
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
    expect(
      findBeatElement(firstTrackElement, firstBeats[1])?.barLocalCoords.x
    ).toBe(
      findBeatElement(secondTrackElement, secondBeats[1])?.barLocalCoords.x
    );
  });

  test("keeps materialized descendants updated during shared-width regrouping", () => {
    const { score, track, bar } = createGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2")
      .tracks[0] as Track<Guitar>;
    const firstBeats = replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    for (let i = 0; i < 4; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      });
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    trackElement.consumeDiff();
    const secondTrackBar = secondTrack.staves[0].bars[0] as Bar<Guitar>;
    replaceVoiceBeats(
      secondTrackBar,
      1,
      Array.from({ length: 16 }, () => NoteDuration.Sixteenth)
    );

    trackElement.update({ affectedMasterBarIndices: [0] });

    const diff = trackElement.elementDiff;
    const added = new Set(
      [...diff[DiffPart.Added].values()].flatMap((identities) => [
        ...identities,
      ])
    );
    const removed = new Set(
      [...diff[DiffPart.Removed].values()].flatMap((identities) => [
        ...identities,
      ])
    );
    const updated = new Set(
      [...diff[DiffPart.Updated].values()].flatMap((identities) => [
        ...identities,
      ])
    );
    const firstBeatIdentity = findBeatElement(
      trackElement,
      firstBeats[0]
    )?.getStableIdentity();

    expect(firstBeatIdentity).toBeDefined();
    if (firstBeatIdentity === undefined) {
      throw Error("Expected first beat to remain materialized");
    }
    expect(updated.has(firstBeatIdentity)).toBe(true);
    expect(added.has(firstBeatIdentity)).toBe(false);
    expect(removed.has(firstBeatIdentity)).toBe(false);
  });
});
