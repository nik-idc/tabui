import { Guitar } from "../../instrument/guitar/guitar";
import { InstrumentFamily } from "../../instrument/instrument-family";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  OtherStringTone,
  STRING_TONES as TONES_BY_INSTRUMENT_TYPE,
  StringInstrumentTone,
} from "../../instrument/instrument-tone";
import { StringInstrumentType } from "../../instrument/instrument-type";
import { TONE_TO_MIDI } from "../../instrument/tone-to-midi";
import { NoteType, NoteValue } from "../../note";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import { propertyPath, SerializationPath } from "../serialization-path";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  readInstrumentFamily,
  readNoteValue,
  readStringInstrumentType,
  readStringTone,
  SERIALIZED_INSTRUMENT_FAMILIES,
  SERIALIZED_PLAYABLE_NOTE_VALUES,
  SERIALIZED_STRING_INSTRUMENT_TYPES,
  SERIALIZED_STRING_TONES,
} from "./mappings";
import {
  SerializedGuitarInstrument,
  SerializedGuitarInstrumentCommon,
  SerializedStringInstrumentType,
  SerializedStringInstrumentTone,
  SerializedTuningNote,
} from "./schema";

/**
 * Serializes one playable tuning pitch and reports validation errors at its
 * `noteValue` or `octave` property path.
 */
function serializeTuningNote(
  tuning: NoteType,
  path: SerializationPath
): SerializedTuningNote {
  const noteValuePath = propertyPath(path, "noteValue");
  if (
    !Object.prototype.hasOwnProperty.call(
      SERIALIZED_PLAYABLE_NOTE_VALUES,
      tuning.noteValue
    )
  ) {
    throw new ScoreSerializationError(
      noteValuePath,
      `unsupported value '${tuning.noteValue}'`
    );
  }
  const noteValue =
    SERIALIZED_PLAYABLE_NOTE_VALUES[
      tuning.noteValue as Exclude<NoteValue, NoteValue.None | NoteValue.Dead>
    ];
  const octave = tuning.octave;
  const octavePath = propertyPath(path, "octave");
  if (typeof octave !== "number" || !Number.isFinite(octave)) {
    throw new ScoreSerializationError(octavePath, "expected finite number");
  }
  if (!Number.isSafeInteger(octave)) {
    throw new ScoreSerializationError(octavePath, "expected safe integer");
  }
  if (octave < 0 || octave > 9) {
    throw new ScoreSerializationError(
      octavePath,
      "expected value between 0 and 9"
    );
  }
  return { noteValue, octave };
}

/** Validates structural guitar fields and tuning/string-count consistency. */
function validateInstrument(instrument: Guitar, path: SerializationPath): void {
  if (
    !Number.isInteger(instrument.stringsCount) ||
    instrument.stringsCount < 1 ||
    instrument.stringsCount > Number.MAX_SAFE_INTEGER
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "stringsCount"),
      "out of range"
    );
  }
  if (instrument.family !== InstrumentFamily.Strings) {
    throw new ScoreSerializationError(
      propertyPath(path, "family"),
      "unsupported instrument family"
    );
  }
  if (instrument.tuning.length !== instrument.stringsCount) {
    throw new ScoreSerializationError(
      propertyPath(path, "tuning"),
      "tuning does not match string count"
    );
  }
  if (
    !Number.isInteger(instrument.fretsCount) ||
    instrument.fretsCount < 0 ||
    instrument.fretsCount > Number.MAX_SAFE_INTEGER
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "fretsCount"),
      "out of range"
    );
  }
}

/** Validates wire-safe instrument metadata at property-specific paths. */
function validateInstrumentMetadata(
  instrument: Guitar,
  path: SerializationPath
): void {
  if (typeof instrument.name !== "string") {
    throw new ScoreSerializationError(
      propertyPath(path, "name"),
      "expected string"
    );
  }
  if (!Number.isSafeInteger(instrument.program)) {
    throw new ScoreSerializationError(
      propertyPath(path, "program"),
      "expected safe integer"
    );
  }
  if (instrument.program < 0 || instrument.program > 127) {
    throw new ScoreSerializationError(
      propertyPath(path, "program"),
      "expected value between 0 and 127"
    );
  }
}

/** Validates a tone against its guitar variant before applying the v1 mapping. */
function serializeTone(
  tone: StringInstrumentTone,
  tones: readonly StringInstrumentTone[],
  path: SerializationPath
): SerializedStringInstrumentTone {
  if (
    !tones.includes(tone) ||
    !Object.prototype.hasOwnProperty.call(SERIALIZED_STRING_TONES, tone)
  ) {
    throw new ScoreSerializationError(path, `unsupported value '${tone}'`);
  }
  return SERIALIZED_STRING_TONES[tone];
}

/**
 * Adds the discriminated v1 type and tone for acoustic, electric, bass, or
 * other supported string instruments.
 */
function serializeInstrumentVariant(
  instrument: Guitar,
  serialized: SerializedGuitarInstrumentCommon,
  path: SerializationPath
): SerializedGuitarInstrument {
  const tonePath = propertyPath(path, "tone");
  switch (instrument.type) {
    case StringInstrumentType.AcousticGuitar: {
      const tones = Object.values(AcousticGuitarTone);
      return {
        ...serialized,
        type: SERIALIZED_STRING_INSTRUMENT_TYPES[
          instrument.type
        ] as SerializedStringInstrumentType.AcousticGuitar,
        tone: serializeTone(instrument.tone, tones, tonePath) as
          | SerializedStringInstrumentTone.Nylon
          | SerializedStringInstrumentTone.Steel,
      };
    }
    case StringInstrumentType.ElectricGuitar: {
      const tones = Object.values(ElectricGuitarTone);
      return {
        ...serialized,
        type: SERIALIZED_STRING_INSTRUMENT_TYPES[
          instrument.type
        ] as SerializedStringInstrumentType.ElectricGuitar,
        tone: serializeTone(instrument.tone, tones, tonePath) as
          | SerializedStringInstrumentTone.ElectricClean
          | SerializedStringInstrumentTone.ElectricOverdrive
          | SerializedStringInstrumentTone.ElectricDistortion,
      };
    }
    case StringInstrumentType.BassGuitar:
      return {
        ...serialized,
        type: SERIALIZED_STRING_INSTRUMENT_TYPES[
          instrument.type
        ] as SerializedStringInstrumentType.BassGuitar,
        tone: serializeTone(
          instrument.tone,
          Object.values(BassGuitarTone),
          tonePath
        ) as
          | SerializedStringInstrumentTone.BassAcoustic
          | SerializedStringInstrumentTone.BassClean
          | SerializedStringInstrumentTone.BassDistortion,
      };
    case StringInstrumentType.Other:
      return {
        ...serialized,
        type: SERIALIZED_STRING_INSTRUMENT_TYPES[
          instrument.type
        ] as SerializedStringInstrumentType.Other,
        tone: serializeTone(
          instrument.tone,
          Object.values(OtherStringTone),
          tonePath
        ) as
          | SerializedStringInstrumentTone.Banjo
          | SerializedStringInstrumentTone.Ukulele,
      };
    default:
      throw new ScoreSerializationError(
        propertyPath(path, "type"),
        "unsupported instrument type"
      );
  }
}

/**
 * Serializes a validated guitar to v1 wire data, enforcing tuning, variant,
 * tone, and MIDI-program consistency with property-relative error paths.
 */
export function serializeInstrument(
  instrument: Guitar,
  path: SerializationPath
): SerializedGuitarInstrument {
  validateInstrument(instrument, path);
  validateInstrumentMetadata(instrument, path);
  const tuningPath = propertyPath(path, "tuning");
  const serialized: SerializedGuitarInstrumentCommon = {
    family: SERIALIZED_INSTRUMENT_FAMILIES[InstrumentFamily.Strings]!,
    name: instrument.name,
    program: instrument.program,
    stringsCount: instrument.stringsCount,
    tuning: serializeArray(instrument.tuning, tuningPath, serializeTuningNote),
    fretsCount: instrument.fretsCount,
  };
  const result = serializeInstrumentVariant(instrument, serialized, path);
  if (instrument.program !== TONE_TO_MIDI[instrument.tone]) {
    throw new ScoreSerializationError(
      propertyPath(path, "program"),
      "program does not match tone"
    );
  }
  return result;
}

/** Reads a tuning array of playable pitches with item-relative validation paths. */
function readTuning(reader: SerializedValueReader): NoteType[] {
  const array = reader.readArray();
  const tuning: NoteType[] = [];
  for (const item of array) {
    item.readObject(["noteValue", "octave"]);
    const noteValueReader = item.property("noteValue");
    const noteValue = readNoteValue(noteValueReader);
    if (noteValue === NoteValue.None || noteValue === NoteValue.Dead) {
      noteValueReader.fail("unsupported value for tuning");
    }
    const octaveReader = item.property("octave");
    const octave = octaveReader.readInteger();
    if (octave < 0 || octave > 9) {
      octaveReader.fail("out of range");
    }
    tuning.push({ noteValue, octave });
  }
  return tuning;
}

/** Temporary validated fields used before cross-field checks and model creation. */
type ParsedInstrumentData = {
  type: StringInstrumentType;
  tone: StringInstrumentTone;
  name: string;
  program: number;
  stringsCount: number;
  fretsCount: number;
  tuning: NoteType[];
};

/** Reads the complete v1 guitar object while preserving property path context. */
function readInstrumentData(
  reader: SerializedValueReader
): ParsedInstrumentData {
  reader.readObject();
  const familyReader = reader.property("family");
  const family = readInstrumentFamily(familyReader);
  if (family !== InstrumentFamily.Strings) {
    familyReader.fail("unsupported instrument family");
  }
  const type = readStringInstrumentType(reader.property("type"));
  reader.expectKeys([
    "family",
    "type",
    "tone",
    "name",
    "program",
    "stringsCount",
    "tuning",
    "fretsCount",
  ]);
  return {
    type,
    tone: readStringTone(reader.property("tone")),
    name: reader.property("name").readString(),
    program: reader.property("program").readIntegerInRange(0, 127),
    stringsCount: reader
      .property("stringsCount")
      .readIntegerInRange(1, Number.MAX_SAFE_INTEGER),
    fretsCount: reader
      .property("fretsCount")
      .readIntegerInRange(0, Number.MAX_SAFE_INTEGER),
    tuning: readTuning(reader.property("tuning")),
  };
}

/** Enforces tuning length, variant/tone, and tone/program cross-field invariants. */
function validateInstrumentConsistency(
  data: ParsedInstrumentData,
  reader: SerializedValueReader
): void {
  if (data.stringsCount !== data.tuning.length) {
    reader.property("stringsCount").fail("string count does not match tuning");
  }
  if (!TONES_BY_INSTRUMENT_TYPE[data.type].includes(data.tone)) {
    reader.property("tone").fail("tone does not match instrument type");
  }
  if (data.program !== TONE_TO_MIDI[data.tone]) {
    reader.property("program").fail("program does not match tone");
  }
}

/**
 * Deserializes validated, cross-field-consistent v1 guitar data through the
 * reader's path-aware model-operation boundary.
 */
export function deserializeInstrument(reader: SerializedValueReader): Guitar {
  const data = readInstrumentData(reader);
  validateInstrumentConsistency(data, reader);
  return reader.runModelOperation(
    () =>
      new Guitar(
        data.type,
        data.tone,
        data.name,
        data.stringsCount,
        data.tuning,
        data.fretsCount
      )
  );
}
