import { Bar, VOICE_NUMBERS } from "../../bar";
import { BarRepeatStatus } from "../../bar-repeat-status";
import { Guitar } from "../../instrument/guitar/guitar";
import {
  MasterBar,
  MAX_MASTER_BAR_BEATS_COUNT,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_BEATS_COUNT,
  MIN_MASTER_BAR_TEMPO,
} from "../../master-bar";
import { Score } from "../../score";
import { Staff } from "../../staff";
import { Track } from "../../track";
import { SerializedValueReader } from "../serialized-value-reader";
import { deserializeInstrument } from "./instrument-serialization";
import { readClefType, readNoteDuration, readRepeatStatus } from "./mappings";
import { deserializeVoiceBar } from "./voice-bar-serialization";
import {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
} from "./schema";

/** Validated root fields retained while the model graph is reconstructed. */
type ScoreData = {
  name: string;
  artist: string;
  song: string;
  masterVolume: number;
  masterPan: number;
  masterBars: SerializedValueReader[];
  tracks: SerializedValueReader[];
};

/**
 * Detached bars and their sparse voice documents, keyed by owning staff, ready
 * for atomic master-bar insertion.
 */
type PreparedMasterBar = {
  bars: Map<number, Bar>;
  voiceDocuments: Map<number, SerializedValueReader[]>;
};

/** Rejects documents not addressed to this format and schema version. */
function validateScoreHeader(reader: SerializedValueReader): void {
  const formatReader = reader.property("format");
  if (formatReader.readString() !== SCORE_SERIALIZATION_FORMAT) {
    formatReader.fail("unsupported format");
  }
  const versionReader = reader.property("version");
  if (versionReader.readInteger() !== SCORE_SERIALIZATION_VERSION) {
    versionReader.fail("unsupported version");
  }
}

/** Validates the root shape and retains child readers for ordered restoration. */
function readScoreData(reader: SerializedValueReader): ScoreData {
  reader.readObject();
  validateScoreHeader(reader);
  reader.expectKeys([
    "format",
    "version",
    "name",
    "artist",
    "song",
    "masterVolume",
    "masterPan",
    "masterBars",
    "tracks",
  ]);
  const masterBarsReader = reader.property("masterBars");
  const tracksReader = reader.property("tracks");
  const masterBars = masterBarsReader.readArray();
  const tracks = tracksReader.readArray();
  if (masterBars.length === 0) {
    masterBarsReader.fail("expected at least one master bar");
  }
  if (tracks.length === 0) {
    tracksReader.fail("expected at least one track");
  }
  return {
    name: reader.property("name").readString(),
    artist: reader.property("artist").readString(),
    song: reader.property("song").readString(),
    masterVolume: reader.property("masterVolume").readNumberInRange(0, 1),
    masterPan: reader.property("masterPan").readNumberInRange(-1, 1),
    masterBars,
    tracks,
  };
}

/** Reconstructs a master bar after validating its meter and repeat invariants. */
function deserializeMasterBar(reader: SerializedValueReader): MasterBar {
  reader.readObject();
  const repeatStatus = readRepeatStatus(reader.property("repeatStatus"));
  reader.expectKeys([
    "tempo",
    "beatsCount",
    "duration",
    "repeatStatus",
    "repeatCount",
  ]);
  const repeatCountReader = reader.property("repeatCount");
  const repeatCount = repeatCountReader.readNullableInteger();
  if (repeatStatus === BarRepeatStatus.End) {
    if (repeatCount === null || repeatCount < 2) {
      repeatCountReader.fail("repeat end requires a count of at least 2");
    }
  } else if (repeatCount !== null) {
    repeatCountReader.fail("repeat count requires repeat end status");
  }
  return new MasterBar({
    tempo: reader
      .property("tempo")
      .readIntegerInRange(MIN_MASTER_BAR_TEMPO, MAX_MASTER_BAR_TEMPO),
    beatsCount: reader
      .property("beatsCount")
      .readIntegerInRange(
        MIN_MASTER_BAR_BEATS_COUNT,
        MAX_MASTER_BAR_BEATS_COUNT
      ),
    duration: readNoteDuration(reader.property("duration")),
    repeatStatus,
    repeatCount,
  });
}

/**
 * Creates an empty staff shell after validating settings and its serialized bar
 * count; bars are attached later with their master bars.
 */
function deserializeStaff(
  reader: SerializedValueReader,
  track: Track<Guitar>,
  masterBars: MasterBar[]
): Staff<Guitar> {
  reader.readObject([
    "clefType",
    "showTablature",
    "showClassicNotation",
    "bars",
  ]);
  const clefType = readClefType(reader.property("clefType"));
  const showTablature = reader.property("showTablature").readBoolean();
  const showClassicNotation = reader
    .property("showClassicNotation")
    .readBoolean();
  const barsReader = reader.property("bars");
  if (barsReader.readArray().length !== masterBars.length) {
    barsReader.fail("bar count does not match master bars");
  }
  return new Staff(
    track,
    track.context,
    [],
    clefType,
    showTablature,
    showClassicNotation
  );
}

/**
 * Creates a score-owned track and its staff shells without restoring bar
 * content, which requires the master-bar insertion phase.
 */
function deserializeTrack(
  reader: SerializedValueReader,
  score: Score,
  masterBars: MasterBar[]
): Track<Guitar> {
  reader.readObject([
    "instrument",
    "name",
    "volume",
    "pan",
    "muted",
    "soloed",
    "staves",
  ]);
  const instrument = deserializeInstrument(reader.property("instrument"));
  const track = new Track<Guitar>(
    score,
    instrument,
    reader.property("name").readString(),
    []
  );
  track.staves.splice(0, track.staves.length);
  track.volume = reader.property("volume").readNumberInRange(0, 1);
  track.pan = reader.property("pan").readNumberInRange(-1, 1);
  track.muted = reader.property("muted").readBoolean();
  track.soloed = reader.property("soloed").readBoolean();
  const stavesReader = reader.property("staves");
  const staves = stavesReader.readArray();
  if (staves.length === 0) {
    stavesReader.fail("expected at least one staff");
  }
  for (let i = 0; i < staves.length; i++) {
    track.insertStaff(i, deserializeStaff(staves[i], track, masterBars));
  }
  return track;
}

/**
 * Validates four sparse voice slots and creates a detached bar owned by the
 * supplied staff and master bar; at least one slot must contain a voice.
 */
function prepareBar(
  reader: SerializedValueReader,
  staff: Staff<Guitar>,
  masterBar: MasterBar
): { bar: Bar<Guitar>; voices: SerializedValueReader[] } {
  reader.readObject(["voices"]);
  const voicesReader = reader.property("voices");
  const voices = voicesReader.readArray();
  if (voices.length !== 4) {
    voicesReader.fail("expected 4 voice slots");
  }
  if (voices.every((voice) => voice.rawValue() === null)) {
    voicesReader.fail("all voices are null");
  }
  return { bar: new Bar(staff, staff.trackContext, masterBar), voices };
}

/** Locates and prepares one staff's bar at a master-bar index. */
function prepareStaffBar(
  staffReader: SerializedValueReader,
  staff: Staff<Guitar>,
  masterBar: MasterBar,
  masterBarIndex: number
): { bar: Bar<Guitar>; voices: SerializedValueReader[] } {
  staffReader.readObject([
    "clefType",
    "showTablature",
    "showClassicNotation",
    "bars",
  ]);
  const barReader = staffReader.property("bars").readArray()[masterBarIndex];
  return prepareBar(barReader, staff, masterBar);
}

/**
 * Prepares every staff bar for one master bar before any of those bars become
 * reachable through the score graph.
 */
function prepareMasterBarContent(
  scoreData: ScoreData,
  tracks: Track<Guitar>[],
  masterBar: MasterBar,
  masterBarIndex: number
): PreparedMasterBar {
  const bars = new Map<number, Bar>();
  const voiceDocuments = new Map<number, SerializedValueReader[]>();
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const staffReaders = scoreData.tracks[i].property("staves").readArray();
    for (let j = 0; j < track.staves.length; j++) {
      const staff = track.staves[j];
      const prepared = prepareStaffBar(
        staffReaders[j],
        staff,
        masterBar,
        masterBarIndex
      );
      bars.set(staff.uuid, prepared.bar);
      voiceDocuments.set(staff.uuid, prepared.voices);
    }
  }
  return { bars, voiceDocuments };
}

/**
 * Restores only populated voice slots after the staff bar has been attached;
 * null slots remain absent rather than becoming empty voices.
 */
function restoreStaffVoices(
  staff: Staff<Guitar>,
  masterBarIndex: number,
  voiceReaders: SerializedValueReader[]
): void {
  const bar = staff.bars[masterBarIndex];
  for (const voiceNumber of VOICE_NUMBERS) {
    const voiceReader = voiceReaders[voiceNumber - 1];
    if (voiceReader.rawValue() === null) {
      continue;
    }
    const voiceBar = bar.insertVoiceBar(voiceNumber, []);
    deserializeVoiceBar(voiceReader, voiceBar);
  }
}

/** Restores attached voice content across every staff for one master bar. */
function restoreMasterBarVoices(
  tracks: Track<Guitar>[],
  masterBarIndex: number,
  voiceDocuments: Map<number, SerializedValueReader[]>
): void {
  for (const track of tracks) {
    for (const staff of track.staves) {
      const voiceReaders = voiceDocuments.get(staff.uuid);
      if (voiceReaders !== undefined) {
        restoreStaffVoices(staff, masterBarIndex, voiceReaders);
      }
    }
  }
}

/**
 * Validates and reconstructs a public version-1 score document. Reconstruction
 * first creates master bars and track/staff shells. It then prepares, inserts,
 * and restores each master bar in order so model operations regenerate derived
 * state from an attached graph.
 */
export function deserializeScore(value: unknown): Score {
  const scoreData = readScoreData(SerializedValueReader.root(value));
  const score = new Score([], scoreData.name, scoreData.artist, scoreData.song);
  score.tracks.splice(0, score.tracks.length);
  score.masterBars.splice(0, score.masterBars.length);
  score.masterVolume = scoreData.masterVolume;
  score.masterPan = scoreData.masterPan;
  const masterBars = scoreData.masterBars.map(deserializeMasterBar);
  const tracks = scoreData.tracks.map((reader) => {
    const track = deserializeTrack(reader, score, masterBars);
    score.tracks.push(track);
    return track;
  });
  for (let i = 0; i < masterBars.length; i++) {
    const masterBar = masterBars[i];
    const prepared = prepareMasterBarContent(scoreData, tracks, masterBar, i);
    score.insertReadyMasterBar(i, masterBar, prepared.bars);
    restoreMasterBarVoices(tracks, i, prepared.voiceDocuments);
  }
  return score;
}
