import { Bar, VOICE_NUMBERS } from "../../bar";
import { BarRepeatStatus } from "../../bar-repeat-status";
import { Guitar } from "../../instrument/guitar/guitar";
import { MasterBar } from "../../master-bar";
import { Score } from "../../score";
import { Staff } from "../../staff";
import { Track } from "../../track";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import {
  indexPath,
  propertyPath,
  ROOT_SERIALIZATION_PATH,
  SerializationPath,
} from "../serialization-path";
import { serializeInstrument } from "./instrument-serialization";
import {
  CLEF_TYPES,
  SERIALIZED_NOTE_DURATIONS,
  SERIALIZED_REPEAT_STATUSES,
} from "./mappings";
import { serializeVoiceBar } from "./voice-bar-serialization";
import {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  SerializedBar,
  SerializedMasterBar,
  SerializedMasterBarCommon,
  SerializedRepeatStatus,
  SerializedScoreV1,
  SerializedStaff,
  SerializedTrack,
} from "./schema";

function validateString(value: unknown, path: SerializationPath): void {
  if (typeof value !== "string") {
    throw new ScoreSerializationError(path, "expected string");
  }
}

function validateBoolean(value: unknown, path: SerializationPath): void {
  if (typeof value !== "boolean") {
    throw new ScoreSerializationError(path, "expected boolean");
  }
}

function validateEnumMember<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: SerializationPath
): void {
  validateString(value, path);
  if (!allowed.some((v) => v === value)) {
    throw new ScoreSerializationError(path, `unsupported value '${value}'`);
  }
}

function validateNumberInRange(
  value: number,
  minimum: number,
  maximum: number,
  path: SerializationPath
): void {
  if (!Number.isFinite(value)) {
    throw new ScoreSerializationError(path, "expected finite number");
  }
  if (value < minimum || value > maximum) {
    throw new ScoreSerializationError(
      path,
      `expected value between ${minimum} and ${maximum}`
    );
  }
}

function validateIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  path: SerializationPath
): void {
  if (!Number.isSafeInteger(value)) {
    throw new ScoreSerializationError(path, "expected safe integer");
  }
  if (value < minimum || value > maximum) {
    throw new ScoreSerializationError(
      path,
      `expected value between ${minimum} and ${maximum}`
    );
  }
}

function serializeBar(bar: Bar, path: SerializationPath): SerializedBar {
  const voicesPath = propertyPath(path, "voices");
  const voices: SerializedBar["voices"] = [null, null, null, null];
  let hasVoice = false;
  for (const voiceNumber of VOICE_NUMBERS) {
    const voiceBar = bar.getVoiceBar(voiceNumber);
    if (voiceBar === null) {
      continue;
    }
    hasVoice = true;
    const voicePath = indexPath(voicesPath, voiceNumber - 1);
    voices[voiceNumber - 1] = serializeVoiceBar(voiceBar, voicePath);
  }
  if (!hasVoice) {
    throw new ScoreSerializationError(
      voicesPath,
      "cannot serialize bar with all-null voices"
    );
  }
  return { voices };
}

function serializeStaff(
  staff: Staff,
  path: SerializationPath
): SerializedStaff {
  validateEnumMember(
    staff.clefType,
    CLEF_TYPES,
    propertyPath(path, "clefType")
  );
  validateBoolean(staff.showTablature, propertyPath(path, "showTablature"));
  validateBoolean(
    staff.showClassicNotation,
    propertyPath(path, "showClassicNotation")
  );
  const barsPath = propertyPath(path, "bars");
  if (staff.bars.length !== staff.track.score.masterBars.length) {
    throw new ScoreSerializationError(
      barsPath,
      "bar count does not match master bars"
    );
  }
  const bars = serializeArray(staff.bars, barsPath, serializeBar);
  return {
    clefType: staff.clefType,
    showTablature: staff.showTablature,
    showClassicNotation: staff.showClassicNotation,
    bars,
  };
}

function serializeTrack(
  track: Track,
  path: SerializationPath
): SerializedTrack {
  const instrumentPath = propertyPath(path, "instrument");
  if (!(track.context.instrument instanceof Guitar)) {
    throw new ScoreSerializationError(
      instrumentPath,
      "unsupported instrument type"
    );
  }
  const instrument = serializeInstrument(
    track.context.instrument,
    instrumentPath
  );
  validateString(track.name, propertyPath(path, "name"));
  validateNumberInRange(track.volume, 0, 1, propertyPath(path, "volume"));
  validateNumberInRange(track.pan, -1, 1, propertyPath(path, "pan"));
  validateBoolean(track.muted, propertyPath(path, "muted"));
  validateBoolean(track.soloed, propertyPath(path, "soloed"));
  const stavesPath = propertyPath(path, "staves");
  if (track.staves.length === 0) {
    throw new ScoreSerializationError(
      stavesPath,
      "expected at least one staff"
    );
  }
  const staves = serializeArray(track.staves, stavesPath, serializeStaff);
  return {
    instrument,
    name: track.name,
    volume: track.volume,
    pan: track.pan,
    muted: track.muted,
    soloed: track.soloed,
    staves,
  };
}

function validateMasterBarRepeat(
  masterBar: MasterBar,
  path: SerializationPath
): void {
  if (masterBar.repeatStatus === BarRepeatStatus.End) {
    if (
      masterBar.repeatCount === null ||
      !Number.isSafeInteger(masterBar.repeatCount) ||
      masterBar.repeatCount < 2
    ) {
      throw new ScoreSerializationError(
        propertyPath(path, "repeatCount"),
        "repeat end requires a count of at least 2"
      );
    }
  } else if (masterBar.repeatCount !== null) {
    throw new ScoreSerializationError(
      propertyPath(path, "repeatCount"),
      "repeat count requires repeat end status"
    );
  }
  if (SERIALIZED_REPEAT_STATUSES[masterBar.repeatStatus] === undefined) {
    throw new ScoreSerializationError(
      propertyPath(path, "repeatStatus"),
      "unsupported repeat status"
    );
  }
}

function constructSerializedMasterBar(
  masterBar: MasterBar,
  serialized: SerializedMasterBarCommon,
  path: SerializationPath
): SerializedMasterBar {
  if (
    masterBar.repeatStatus === BarRepeatStatus.End &&
    masterBar.repeatCount !== null
  ) {
    return {
      ...serialized,
      repeatStatus: SerializedRepeatStatus.End,
      repeatCount: masterBar.repeatCount,
    };
  }
  const repeatStatus = SERIALIZED_REPEAT_STATUSES[masterBar.repeatStatus];
  if (repeatStatus === SerializedRepeatStatus.End) {
    throw new ScoreSerializationError(
      propertyPath(path, "repeatStatus"),
      "repeat status mismatch"
    );
  }
  return { ...serialized, repeatStatus, repeatCount: null };
}

function serializeMasterBar(
  masterBar: MasterBar,
  path: SerializationPath
): SerializedMasterBar {
  validateIntegerInRange(masterBar.tempo, 1, 999, propertyPath(path, "tempo"));
  validateIntegerInRange(
    masterBar.beatsCount,
    1,
    32,
    propertyPath(path, "beatsCount")
  );
  if (SERIALIZED_NOTE_DURATIONS[masterBar.duration] === undefined) {
    throw new ScoreSerializationError(
      propertyPath(path, "duration"),
      "unsupported duration"
    );
  }
  validateMasterBarRepeat(masterBar, path);
  const serialized: SerializedMasterBarCommon = {
    tempo: masterBar.tempo,
    beatsCount: masterBar.beatsCount,
    duration: SERIALIZED_NOTE_DURATIONS[masterBar.duration],
  };
  return constructSerializedMasterBar(masterBar, serialized, path);
}

export function serializeScore(score: Score): SerializedScoreV1 {
  validateString(score.name, propertyPath(ROOT_SERIALIZATION_PATH, "name"));
  validateString(score.artist, propertyPath(ROOT_SERIALIZATION_PATH, "artist"));
  validateString(score.song, propertyPath(ROOT_SERIALIZATION_PATH, "song"));
  const masterBarsPath = propertyPath(ROOT_SERIALIZATION_PATH, "masterBars");
  if (score.masterBars.length === 0) {
    throw new ScoreSerializationError(
      masterBarsPath,
      "expected at least one master bar"
    );
  }
  const masterBars = serializeArray(
    score.masterBars,
    masterBarsPath,
    serializeMasterBar
  );
  const tracksPath = propertyPath(ROOT_SERIALIZATION_PATH, "tracks");
  if (score.tracks.length === 0) {
    throw new ScoreSerializationError(
      tracksPath,
      "expected at least one track"
    );
  }
  const tracks = serializeArray(score.tracks, tracksPath, serializeTrack);
  validateNumberInRange(
    score.masterVolume,
    0,
    1,
    propertyPath(ROOT_SERIALIZATION_PATH, "masterVolume")
  );
  validateNumberInRange(
    score.masterPan,
    -1,
    1,
    propertyPath(ROOT_SERIALIZATION_PATH, "masterPan")
  );
  return {
    format: SCORE_SERIALIZATION_FORMAT,
    version: SCORE_SERIALIZATION_VERSION,
    name: score.name,
    artist: score.artist,
    song: score.song,
    masterVolume: score.masterVolume,
    masterPan: score.masterPan,
    masterBars,
    tracks,
  };
}
