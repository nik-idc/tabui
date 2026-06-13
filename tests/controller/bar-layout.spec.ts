import { TrackElement } from "../../src/notation/controller/element/track-element";
import {
  calculateMasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_UNITS,
} from "../../src/notation/controller/layout/bar-layout";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
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
import { ensureLayoutConfigured } from "./helpers";

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
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("combines actual duration and rhythm column count", () => {
    const { track, bar } = createGraph();
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter, NoteDuration.Quarter]);
    replaceVoiceBeats(bar, 2, [
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);

    const metrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(metrics.rhythmColumnCount).toBe(4);
    expect(metrics.contentMinWidth).toBe(
      Math.max(
        0.5 * EditorLayoutDimensions.WIDTH_MAPPING[NoteDuration.Quarter] * 4,
        4 * EditorLayoutDimensions.MIN_RHYTHM_COLUMN_GAP
      ) +
        EditorLayoutDimensions.RHYTHM_ATTACK_PADDING * 2
    );
  });

  test("counts unique rhythm columns across staves", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    replaceVoiceBeats(bar, 1, [NoteDuration.Quarter, NoteDuration.Quarter]);
    replaceVoiceBeats(secondBar, 1, [NoteDuration.Eighth, NoteDuration.Eighth]);

    const metrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(metrics.rhythmColumnCount).toBe(3);
  });

  test("keeps structural width separate from content minimum", () => {
    const { track } = createGraph();
    const masterBar = track.score.masterBars[0];
    masterBar.repeatStatus = BarRepeatStatus.Start;

    const metrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(metrics.structuralWidth).toBe(
      EditorLayoutDimensions.TIME_SIG_RECT_WIDTH +
        EditorLayoutDimensions.REPEAT_SIGN_WIDTH
    );
    expect(metrics.minWidth).toBe(
      metrics.structuralWidth + metrics.contentMinWidth
    );
  });
});

describe("musical beat layout", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("aligns same-time beats across voices", () => {
    const { track, bar } = createGraph();
    const voiceOneBeats = replaceVoiceBeats(bar, 1, [NoteDuration.Quarter]);
    const voiceTwoBeats = replaceVoiceBeats(bar, 2, [NoteDuration.Quarter]);
    const trackElement = new TrackElement(track);

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
        beatsCount: TRACK_LINE_DURATION_BUDGET_UNITS,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      })
      .bars.get(track.staves[0].uuid)!;
    replaceVoiceBeats(secondBar, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    const trackElement = new TrackElement(track);

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
    for (let i = 0; i < TRACK_LINE_DURATION_BUDGET_UNITS; i++) {
      const nextBar = score
        .appendMasterBar({
          tempo: 120,
          beatsCount: TRACK_LINE_DURATION_BUDGET_UNITS,
          duration: NoteDuration.Quarter,
          repeatStatus: BarRepeatStatus.None,
          repeatCount: null,
        })
        .bars.get(track.staves[0].uuid)!;
      replaceVoiceBeats(nextBar, 1, [
        NoteDuration.Quarter,
        NoteDuration.Quarter,
        NoteDuration.Quarter,
        NoteDuration.Quarter,
      ]);
    }
    const trackElement = new TrackElement(track);

    trackElement.update();

    const firstLineBarElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;
    const lastBar = firstLineBarElements[firstLineBarElements.length - 1];
    expect(lastBar.boundingBox.right).toBeCloseTo(EditorLayoutDimensions.WIDTH);
  });

  test("shorter voice-bar columns do not widen duration-dominated bars", () => {
    const { track, bar } = createGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondBar = secondStaff.bars[0];
    replaceVoiceBeats(bar, 1, [NoteDuration.Half, NoteDuration.Half]);
    replaceVoiceBeats(secondBar, 1, [NoteDuration.Half, NoteDuration.Half]);
    const halfMetrics = calculateMasterBarLayoutMetrics(track, 0);

    replaceVoiceBeats(bar, 1, [NoteDuration.Half]);
    const shorterVoiceMetrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(shorterVoiceMetrics.contentMinWidth).toBe(
      halfMetrics.contentMinWidth
    );
  });

  test("keeps dense uneven attack columns from colliding", () => {
    const { track, bar } = createGraph();
    const beats = replaceVoiceBeats(bar, 1, [
      NoteDuration.ThirtySecond,
      NoteDuration.ThirtySecond,
      NoteDuration.Half,
    ]);
    const metrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(metrics.contentMinWidth).toBeGreaterThan(
      beats.length * EditorLayoutDimensions.MIN_RHYTHM_COLUMN_GAP +
        EditorLayoutDimensions.RHYTHM_ATTACK_PADDING * 2
    );

    const trackElement = new TrackElement(track);
    trackElement.update();
    const attackXs = beats.map((beat) => {
      const beatElement = findBeatElement(trackElement, beat);
      expect(beatElement).toBeDefined();
      return beatElement!.barLocalCoords.x;
    });

    for (let i = 1; i < attackXs.length; i++) {
      expect(attackXs[i] - attackXs[i - 1]).toBeGreaterThanOrEqual(
        EditorLayoutDimensions.MIN_RHYTHM_COLUMN_GAP
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
    const metrics = calculateMasterBarLayoutMetrics(track, 0);

    expect(metrics.minWidth).toBeGreaterThan(EditorLayoutDimensions.WIDTH);

    const trackElement = new TrackElement(track);
    trackElement.update();
    const barElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0];

    expect(barElement.boundingBox.width).toBe(EditorLayoutDimensions.WIDTH);

    const firstBeatElement = findBeatElement(trackElement, beats[0]);
    const secondBeatElement = findBeatElement(trackElement, beats[1]);
    expect(firstBeatElement).toBeDefined();
    expect(secondBeatElement).toBeDefined();
    expect(
      secondBeatElement!.barLocalCoords.x - firstBeatElement!.barLocalCoords.x
    ).toBeLessThan(EditorLayoutDimensions.MIN_RHYTHM_COLUMN_GAP);
  });
});
