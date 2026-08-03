import { Bar, VOICE_NUMBERS } from "../../bar";
import { BarRepeatStatus } from "../../bar-repeat-status";
import { Guitar } from "../../instrument/guitar/guitar";
import { MasterBar } from "../../master-bar";
import { Score } from "../../score";
import { Staff } from "../../staff";
import { Track } from "../../track";
import { SerializedValueReader } from "../serialized-value-reader";
import { deserializeInstrument } from "./instrument-serialization";
import { CLEF_TYPES, readNoteDuration, readRepeatStatus } from "./mappings";
import { deserializeVoiceBar } from "./voice-bar-serialization";
import {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
} from "./schema";

type ScoreData = {
  name: string;
  artist: string;
  song: string;
  masterVolume: number;
  masterPan: number;
  masterBars: SerializedValueReader[];
  tracks: SerializedValueReader[];
};

type PreparedMasterBar = {
  bars: Map<number, Bar>;
  voiceDocuments: Map<number, SerializedValueReader[]>;
};

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

function readScoreData(reader: SerializedValueReader): ScoreData {
  reader.readObject();
  validateScoreHeader(reader);
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

function deserializeMasterBar(reader: SerializedValueReader): MasterBar {
  reader.readObject();
  const repeatStatus = readRepeatStatus(reader.property("repeatStatus"));
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
    tempo: reader.property("tempo").readIntegerInRange(1, 999),
    beatsCount: reader.property("beatsCount").readIntegerInRange(1, 32),
    duration: readNoteDuration(reader.property("duration")),
    repeatStatus,
    repeatCount,
  });
}

function deserializeStaff(
  reader: SerializedValueReader,
  track: Track<Guitar>,
  masterBars: MasterBar[]
): Staff<Guitar> {
  reader.readObject();
  const clefType = reader.property("clefType").readEnumMember(CLEF_TYPES);
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

function deserializeTrack(
  reader: SerializedValueReader,
  score: Score,
  masterBars: MasterBar[]
): Track<Guitar> {
  reader.readObject();
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

function prepareBar(
  reader: SerializedValueReader,
  staff: Staff<Guitar>,
  masterBar: MasterBar
): { bar: Bar<Guitar>; voices: SerializedValueReader[] } {
  reader.readObject();
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

function prepareStaffBar(
  staffReader: SerializedValueReader,
  staff: Staff<Guitar>,
  masterBar: MasterBar,
  masterBarIndex: number
): { bar: Bar<Guitar>; voices: SerializedValueReader[] } {
  staffReader.readObject();
  const barReader = staffReader.property("bars").readArray()[masterBarIndex];
  return prepareBar(barReader, staff, masterBar);
}

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
