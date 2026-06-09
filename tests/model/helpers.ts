import {
  Bar,
  BarRepeatStatus,
  Beat,
  BeatDots,
  DEFAULT_MASTER_BAR,
  Guitar,
  MasterBar,
  MasterBarData,
  NoteDuration,
  Score,
  Staff,
  Track,
  TupletSettings,
  VoiceBar,
} from "../../src/notation/model";

export function createScoreGraph(
  masterBarData: MasterBarData = DEFAULT_MASTER_BAR
): {
  score: Score;
  track: Track<Guitar>;
  staff: Staff<Guitar>;
  masterBar: MasterBar;
  bar: Bar<Guitar>;
} {
  const score = new Score();
  const track = score.tracks[0] as Track<Guitar>;
  const staff = track.staves[0] as Staff<Guitar>;
  const masterBar = score.masterBars[0];

  masterBar.tempo = masterBarData.tempo;
  masterBar.beatsCount = masterBarData.beatsCount;
  masterBar.duration = masterBarData.duration;
  masterBar.repeatStatus = masterBarData.repeatStatus;
  if (masterBarData.repeatCount !== null) {
    masterBar.repeatCount = masterBarData.repeatCount;
  }

  const bar = staff.bars[0] as Bar<Guitar>;
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected default score graph to include voice 1");
  }

  const seedBeat = createBeat(voiceBar, NoteDuration.Quarter);
  voiceBar.beats.splice(0, voiceBar.beats.length, seedBeat);
  voiceBar.computeBarTupletGroups();

  return { score, track, staff, masterBar, bar };
}

export function createBeat(
  voiceBar: VoiceBar<Guitar> | null,
  baseDuration: NoteDuration,
  dots: BeatDots = 0,
  tupletSettings: TupletSettings | null = null
): Beat<Guitar> {
  if (voiceBar === null) {
    throw Error("Cannot create beat for an empty voice slot");
  }

  return new Beat(
    voiceBar,
    voiceBar.trackContext,
    [],
    baseDuration,
    dots,
    tupletSettings
  );
}

export function createBarWithBeats(
  beatConfigs: Array<{
    baseDuration: NoteDuration;
    dots?: BeatDots;
    tupletSettings?: TupletSettings | null;
  }>,
  masterBarData: MasterBarData = {
    tempo: 120,
    beatsCount: 4,
    duration: NoteDuration.Quarter,
    repeatStatus: BarRepeatStatus.None,
    repeatCount: null,
  }
): {
  score: Score;
  track: Track<Guitar>;
  staff: Staff<Guitar>;
  masterBar: MasterBar;
  bar: Bar<Guitar>;
  beats: Beat<Guitar>[];
} {
  const graph = createScoreGraph(masterBarData);
  const voiceBar = graph.bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected default score graph to include voice 1");
  }

  const beats = beatConfigs.map((config) =>
    createBeat(
      voiceBar,
      config.baseDuration,
      config.dots ?? 0,
      config.tupletSettings ?? null
    )
  );

  voiceBar.beats.splice(0, voiceBar.beats.length, ...beats);
  voiceBar.computeBarTupletGroups();

  return { ...graph, beats };
}
