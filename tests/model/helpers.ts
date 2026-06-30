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

type LegacyBarTestSurface = Bar<Guitar> & {
  bar: Bar<Guitar>;
  beats: Beat<Guitar>[];
  beamingGroups: number[];
  tupletGroups: VoiceBar<Guitar>["tupletGroups"];
  tickResolution: number;
  barTicks: number;
  actualTicks: number;
  rebuildTiming: () => void;
  computeBeaming: () => void;
  computeBarTupletGroups: () => void;
  appendBeats: VoiceBar<Guitar>["appendBeats"];
  prependBeats: VoiceBar<Guitar>["prependBeats"];
  insertBeat: VoiceBar<Guitar>["insertBeat"];
  insertBeats: VoiceBar<Guitar>["insertBeats"];
  removeBeat: VoiceBar<Guitar>["removeBeat"];
  removeBeats: VoiceBar<Guitar>["removeBeats"];
};

function getPrimaryVoiceBar(bar: Bar<Guitar>): VoiceBar<Guitar> {
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected test bar to include voice 1");
  }
  return voiceBar;
}

function installLegacyBarTestSurface(): void {
  const proto = Bar.prototype as LegacyBarTestSurface;
  if (Object.prototype.hasOwnProperty.call(proto, "beats")) {
    return;
  }

  Object.defineProperties(proto, {
    bar: {
      get: function () {
        return this;
      },
    },
    beats: {
      get: function () {
        return getPrimaryVoiceBar(this).beats;
      },
    },
    beamingGroups: {
      get: function () {
        return getPrimaryVoiceBar(this).beamingGroups;
      },
    },
    tupletGroups: {
      get: function () {
        return getPrimaryVoiceBar(this).tupletGroups;
      },
    },
    tickResolution: {
      get: function () {
        return getPrimaryVoiceBar(this).tickResolution;
      },
    },
    barTicks: {
      get: function () {
        return getPrimaryVoiceBar(this).barTicks;
      },
    },
    actualTicks: {
      get: function () {
        return getPrimaryVoiceBar(this).actualTicks;
      },
    },
  });

  proto.rebuildTiming = function () {
    getPrimaryVoiceBar(this).rebuildTiming();
  };
  proto.computeBeaming = function () {
    getPrimaryVoiceBar(this).computeBeaming();
  };
  proto.computeBarTupletGroups = function () {
    getPrimaryVoiceBar(this).computeBarTupletGroups();
  };
  proto.appendBeats = function (...args) {
    return getPrimaryVoiceBar(this).appendBeats(...args);
  };
  proto.prependBeats = function (...args) {
    return getPrimaryVoiceBar(this).prependBeats(...args);
  };
  proto.insertBeat = function (...args) {
    return getPrimaryVoiceBar(this).insertBeat(...args);
  };
  proto.insertBeats = function (...args) {
    return getPrimaryVoiceBar(this).insertBeats(...args);
  };
  proto.removeBeat = function (...args) {
    return getPrimaryVoiceBar(this).removeBeat(...args);
  };
  proto.removeBeats = function (...args) {
    return getPrimaryVoiceBar(this).removeBeats(...args);
  };
}

installLegacyBarTestSurface();

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
  voiceBar: VoiceBar<Guitar> | Bar<Guitar> | null,
  baseDuration: NoteDuration,
  dots: BeatDots = 0,
  tupletSettings: TupletSettings | null = null
): Beat<Guitar> {
  if (voiceBar === null) {
    throw Error("Cannot create beat for an empty voice slot");
  }
  const targetVoiceBar =
    voiceBar instanceof Bar ? getPrimaryVoiceBar(voiceBar) : voiceBar;

  return new Beat(
    targetVoiceBar,
    targetVoiceBar.trackContext,
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
