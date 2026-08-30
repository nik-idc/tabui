import { Bar, VOICE_NUMBERS } from "../../bar";
import { Guitar } from "../../instrument/guitar/guitar";
import {
  MasterBar,
  MAX_MASTER_BAR_BEATS_COUNT,
  MAX_MASTER_BAR_REPEAT_COUNT,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_BEATS_COUNT,
  MIN_MASTER_BAR_REPEAT_COUNT,
  MIN_MASTER_BAR_TEMPO,
} from "../../master-bar";
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
import { SERIALIZED_CLEF_TYPES, SERIALIZED_NOTE_DURATIONS } from "./mappings";
import { serializeVoiceBar } from "./voice-bar-serialization";
import {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  SerializedBar,
  SerializedMasterBar,
  SerializedMasterBarCommon,
  SerializedScoreV1,
  SerializedStaff,
  SerializedTrack,
} from "./schema";

/** Rejects mutable model fields that no longer satisfy the string schema. */
function validateString(value: unknown, path: SerializationPath): void {
  if (typeof value !== "string") {
    throw new ScoreSerializationError(path, "expected string");
  }
}

/** Rejects mutable model fields that no longer satisfy the boolean schema. */
function validateBoolean(value: unknown, path: SerializationPath): void {
  if (typeof value !== "boolean") {
    throw new ScoreSerializationError(path, "expected boolean");
  }
}

/** Enforces the finite numeric bounds promised by the serialized schema. */
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

/** Enforces safe-integer bounds promised by the serialized schema. */
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

/**
 * Serializes a bar after verifying its staff, track context, and master-bar
 * owners, preserving the model's four sparse voice slots.
 */
function serializeBar(
  bar: Bar<Guitar>,
  path: SerializationPath,
  staff: Staff<Guitar>,
  masterBar: MasterBar
): SerializedBar {
  if (
    bar.staff !== staff ||
    bar.trackContext !== staff.trackContext ||
    bar.masterBar !== masterBar
  ) {
    throw new ScoreSerializationError(path, "bar ownership mismatch");
  }
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
    voices[voiceNumber - 1] = serializeVoiceBar(
      voiceBar,
      voicePath,
      bar,
      voiceNumber
    );
  }
  if (!hasVoice) {
    throw new ScoreSerializationError(
      voicesPath,
      "cannot serialize bar with all-null voices"
    );
  }
  return { voices };
}

/**
 * Serializes staff settings and bars after checking that the staff belongs to
 * the supplied track and has exactly one bar per master bar.
 */
function serializeStaff(
  staff: Staff<Guitar>,
  path: SerializationPath,
  track: Track<Guitar>
): SerializedStaff {
  if (staff.track !== track || staff.trackContext !== track.context) {
    throw new ScoreSerializationError(path, "staff ownership mismatch");
  }
  if (
    !Object.prototype.hasOwnProperty.call(SERIALIZED_CLEF_TYPES, staff.clefType)
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "clefType"),
      `unsupported value '${staff.clefType}'`
    );
  }
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
  const bars = serializeArray(staff.bars, barsPath, (bar, barPath, index) =>
    serializeBar(bar, barPath, staff, track.score.masterBars[index])
  );
  return {
    clefType: SERIALIZED_CLEF_TYPES[staff.clefType],
    showTablature: staff.showTablature,
    showClassicNotation: staff.showClassicNotation,
    bars,
  };
}

/**
 * Serializes a score-owned guitar track and validates its mutable mix state,
 * instrument support, and nonempty staff collection.
 */
function serializeTrack(
  track: Track,
  path: SerializationPath,
  score: Score
): SerializedTrack {
  if (track.score !== score) {
    throw new ScoreSerializationError(path, "track belongs to another score");
  }
  const instrumentPath = propertyPath(path, "instrument");
  if (!(track.context.instrument instanceof Guitar)) {
    throw new ScoreSerializationError(
      instrumentPath,
      "unsupported instrument type"
    );
  }
  const guitarTrack = track as Track<Guitar>;
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
  const staves = serializeArray(
    guitarTrack.staves,
    stavesPath,
    (staff, staffPath) => serializeStaff(staff, staffPath, guitarTrack)
  );
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

/** Validates the coupled repeat state and count before encoding. */
function validateMasterBarRepeat(
  masterBar: MasterBar,
  path: SerializationPath
): void {
  if (masterBar.isRepeatEnd) {
    const countOutsideRange =
      masterBar.repeatCount === null ||
      !Number.isSafeInteger(masterBar.repeatCount) ||
      masterBar.repeatCount < MIN_MASTER_BAR_REPEAT_COUNT ||
      masterBar.repeatCount > MAX_MASTER_BAR_REPEAT_COUNT;
    if (countOutsideRange) {
      const bounds =
        `${MIN_MASTER_BAR_REPEAT_COUNT}..` + `${MAX_MASTER_BAR_REPEAT_COUNT}`;
      throw new ScoreSerializationError(
        propertyPath(path, "repeatCount"),
        `repeat end requires a count in ${bounds}`
      );
    }
  } else if (masterBar.repeatCount !== null) {
    throw new ScoreSerializationError(
      propertyPath(path, "repeatCount"),
      "repeat count requires repeat end status"
    );
  }
}

/** Constructs validated repeat data for the serialized master bar. */
function constructSerializedMasterBar(
  masterBar: MasterBar,
  serialized: SerializedMasterBarCommon,
  path: SerializationPath
): SerializedMasterBar {
  return {
    ...serialized,
    isRepeatStart: masterBar.isRepeatStart,
    isRepeatEnd: masterBar.isRepeatEnd,
    repeatCount: masterBar.repeatCount,
  };
}

/** Serializes meter, tempo, duration, and internally consistent repeat data. */
function serializeMasterBar(
  masterBar: MasterBar,
  path: SerializationPath
): SerializedMasterBar {
  validateIntegerInRange(
    masterBar.tempo,
    MIN_MASTER_BAR_TEMPO,
    MAX_MASTER_BAR_TEMPO,
    propertyPath(path, "tempo")
  );
  validateIntegerInRange(
    masterBar.beatsCount,
    MIN_MASTER_BAR_BEATS_COUNT,
    MAX_MASTER_BAR_BEATS_COUNT,
    propertyPath(path, "beatsCount")
  );
  if (
    !Object.prototype.hasOwnProperty.call(
      SERIALIZED_NOTE_DURATIONS,
      masterBar.duration
    )
  ) {
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

/**
 * Converts a complete in-memory score to the public version-1 document,
 * rejecting unsupported instruments, invalid persisted values, and broken
 * ownership links at their prospective document paths.
 */
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
  const tracks = serializeArray(score.tracks, tracksPath, (track, trackPath) =>
    serializeTrack(track, trackPath, score)
  );
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
