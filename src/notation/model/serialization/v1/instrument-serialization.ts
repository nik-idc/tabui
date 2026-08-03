import { Guitar } from "../../instrument/guitar/guitar";
import { InstrumentFamily } from "../../instrument/instrument-family";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  OtherStringTone,
  STRING_TONES as TONES_BY_INSTRUMENT_TYPE,
} from "../../instrument/instrument-tone";
import { StringInstrumentType } from "../../instrument/instrument-type";
import { TONE_TO_MIDI } from "../../instrument/tone-to-midi";
import { NoteType, NoteValue, NOTES_ARR } from "../../note";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import { propertyPath, SerializationPath } from "../serialization-path";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  INSTRUMENT_FAMILIES,
  readNoteValue,
  STRING_INSTRUMENT_TYPES,
  STRING_TONES,
} from "./mappings";
import {
  SerializedGuitarInstrument,
  SerializedGuitarInstrumentCommon,
  SerializedTuningNote,
} from "./schema";

function serializeTuningNote(
  tuning: NoteType,
  path: SerializationPath
): SerializedTuningNote {
  const noteValuePath = propertyPath(path, "noteValue");
  if (typeof tuning.noteValue !== "string") {
    throw new ScoreSerializationError(noteValuePath, "expected string");
  }
  const noteValue = NOTES_ARR.find((n) => n === tuning.noteValue);
  if (noteValue === undefined) {
    throw new ScoreSerializationError(
      noteValuePath,
      `unsupported value '${tuning.noteValue}'`
    );
  }
  if (noteValue === NoteValue.None || noteValue === NoteValue.Dead) {
    throw new ScoreSerializationError(
      noteValuePath,
      "unsupported value for tuning"
    );
  }
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

function serializeTone<T extends string>(
  tone: string,
  tones: readonly T[],
  path: SerializationPath
): T {
  const serialized = tones.find((t) => t === tone);
  if (serialized === undefined) {
    throw new ScoreSerializationError(path, `unsupported value '${tone}'`);
  }
  return serialized;
}

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
        type: instrument.type,
        tone: serializeTone(instrument.tone, tones, tonePath),
      };
    }
    case StringInstrumentType.ElectricGuitar: {
      const tones = Object.values(ElectricGuitarTone);
      return {
        ...serialized,
        type: instrument.type,
        tone: serializeTone(instrument.tone, tones, tonePath),
      };
    }
    case StringInstrumentType.BassGuitar:
      return {
        ...serialized,
        type: instrument.type,
        tone: serializeTone(
          instrument.tone,
          Object.values(BassGuitarTone),
          tonePath
        ),
      };
    case StringInstrumentType.Other:
      return {
        ...serialized,
        type: instrument.type,
        tone: serializeTone(
          instrument.tone,
          Object.values(OtherStringTone),
          tonePath
        ),
      };
    default:
      throw new ScoreSerializationError(
        propertyPath(path, "type"),
        "unsupported instrument type"
      );
  }
}

export function serializeInstrument(
  instrument: Guitar,
  path: SerializationPath
): SerializedGuitarInstrument {
  validateInstrument(instrument, path);
  validateInstrumentMetadata(instrument, path);
  const tuningPath = propertyPath(path, "tuning");
  const serialized: SerializedGuitarInstrumentCommon = {
    family: InstrumentFamily.Strings,
    name: instrument.name,
    program: instrument.program,
    stringsCount: instrument.stringsCount,
    tuning: serializeArray(instrument.tuning, tuningPath, serializeTuningNote),
    fretsCount: instrument.fretsCount,
  };
  const result = serializeInstrumentVariant(instrument, serialized, path);
  if (instrument.program !== TONE_TO_MIDI[result.tone]) {
    throw new ScoreSerializationError(
      propertyPath(path, "program"),
      "program does not match tone"
    );
  }
  return result;
}

function readTuning(reader: SerializedValueReader): NoteType[] {
  const array = reader.readArray();
  const tuning: NoteType[] = [];
  for (const item of array) {
    item.readObject();
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

type ParsedInstrumentData = {
  type: StringInstrumentType;
  tone: (typeof STRING_TONES)[number];
  name: string;
  program: number;
  stringsCount: number;
  fretsCount: number;
  tuning: NoteType[];
};

function readInstrumentData(
  reader: SerializedValueReader
): ParsedInstrumentData {
  reader.readObject();
  const familyReader = reader.property("family");
  const family = familyReader.readEnumMember(INSTRUMENT_FAMILIES);
  if (family !== InstrumentFamily.Strings) {
    familyReader.fail("unsupported instrument family");
  }
  return {
    type: reader.property("type").readEnumMember(STRING_INSTRUMENT_TYPES),
    tone: reader.property("tone").readEnumMember(STRING_TONES),
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
