import { Beat } from "../../beat";
import {
  BendOptionsData,
  BendTechniqueOptions,
  MAX_BEND_PITCH,
} from "../../bend-options";
import { BendType, OPTIONS_PER_BEND_TYPE } from "../../bend-type";
import { GuitarNote } from "../../guitar-note";
import { GuitarTechnique } from "../../guitar-technique";
import { Guitar } from "../../instrument/guitar/guitar";
import { GuitarTechniqueType } from "../../technique-type";
import { TupletSettings } from "../../tuplet-settings";
import { VoiceBar } from "../../voice-bar";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import { propertyPath, SerializationPath } from "../serialization-path";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  SERIALIZED_NOTE_DURATIONS,
  readBeatDots,
  readBendType,
  readNoteDuration,
  readTechniqueType,
  SERIALIZED_TECHNIQUE_TYPES,
} from "./mappings";
import {
  SerializedBeat,
  SerializedBendOptions,
  SerializedBendType,
  SerializedGuitarNote,
  SerializedGuitarTechnique,
  SerializedTechniqueType,
  SerializedVoiceBar,
} from "./schema";

// Technique checks can depend on neighboring beats, so restore them only after
// the complete voice beat sequence has been attached to its VoiceBar.
export type DeferredNoteTechniques = {
  note: GuitarNote;
  techniques: SerializedValueReader[];
};

function requireBendOption(
  options: BendTechniqueOptions,
  key: Exclude<keyof BendOptionsData, "type">,
  path: SerializationPath
): number {
  const value = options[key];
  if (value === undefined) {
    throw new ScoreSerializationError(
      propertyPath(path, key),
      "missing bend option"
    );
  }
  if (!Number.isFinite(value)) {
    throw new ScoreSerializationError(
      propertyPath(path, key),
      "expected finite number"
    );
  }
  if (key === "bendDuration" && (value <= 0 || value > 1)) {
    throw new ScoreSerializationError(
      propertyPath(path, key),
      "expected value greater than 0 and at most 1"
    );
  }
  if (key !== "bendDuration" && (value < 0 || value > MAX_BEND_PITCH)) {
    throw new ScoreSerializationError(
      propertyPath(path, key),
      `expected value between 0 and ${MAX_BEND_PITCH}`
    );
  }
  return value;
}

function serializeBendOptions(
  options: BendTechniqueOptions,
  path: SerializationPath
): SerializedBendOptions {
  switch (options.type) {
    case BendType.Bend:
      return {
        type: SerializedBendType.Bend,
        bendPitch: requireBendOption(options, "bendPitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    case BendType.BendAndRelease:
      return {
        type: SerializedBendType.BendAndRelease,
        bendPitch: requireBendOption(options, "bendPitch", path),
        releasePitch: requireBendOption(options, "releasePitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    case BendType.Hold:
      return {
        type: SerializedBendType.Hold,
        holdPitch: requireBendOption(options, "holdPitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    case BendType.Prebend:
      return {
        type: SerializedBendType.Prebend,
        prebendPitch: requireBendOption(options, "prebendPitch", path),
      };
    case BendType.PrebendAndRelease:
      return {
        type: SerializedBendType.PrebendAndRelease,
        releasePitch: requireBendOption(options, "releasePitch", path),
        prebendPitch: requireBendOption(options, "prebendPitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    case BendType.PrebendBend:
      return {
        type: SerializedBendType.PrebendBend,
        prebendPitch: requireBendOption(options, "prebendPitch", path),
        bendPitch: requireBendOption(options, "bendPitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    case BendType.Release:
      return {
        type: SerializedBendType.Release,
        releasePitch: requireBendOption(options, "releasePitch", path),
        bendDuration: requireBendOption(options, "bendDuration", path),
      };
    default:
      throw new ScoreSerializationError(
        propertyPath(path, "type"),
        "unsupported bend type"
      );
  }
}

function serializeTechnique(
  technique: GuitarTechnique,
  path: SerializationPath
): SerializedGuitarTechnique {
  const type = SERIALIZED_TECHNIQUE_TYPES[technique.type];
  if (type === undefined) {
    throw new ScoreSerializationError(
      propertyPath(path, "type"),
      "unsupported technique type"
    );
  }
  if (technique.type === GuitarTechniqueType.Bend) {
    const options = technique.bendOptions;
    if (options === null) {
      throw new ScoreSerializationError(
        propertyPath(path, "options"),
        "bend technique missing options"
      );
    }
    return {
      type: SerializedTechniqueType.Bend,
      options: serializeBendOptions(options, propertyPath(path, "options")),
    };
  }
  if (type === SerializedTechniqueType.Bend) {
    throw new ScoreSerializationError(
      propertyPath(path, "type"),
      "bend technique type mismatch"
    );
  }
  return { type };
}

function serializeNote(
  note: GuitarNote,
  path: SerializationPath
): SerializedGuitarNote | null {
  if (note.fret === null && note.techniques.length === 0) {
    return null;
  }
  if (
    note.fret !== null &&
    (!Number.isInteger(note.fret) ||
      note.fret < -1 ||
      note.fret > note.trackContext.instrument.fretsCount)
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "fret"),
      "out of range"
    );
  }
  const techniquesPath = propertyPath(path, "techniques");
  return {
    fret: note.fret,
    techniques: serializeArray(
      note.techniques,
      techniquesPath,
      serializeTechnique
    ),
  };
}

function serializeTuplet(
  tuplet: TupletSettings | null,
  path: SerializationPath
): TupletSettings | null {
  if (
    tuplet !== null &&
    (!Number.isSafeInteger(tuplet.normalCount) ||
      tuplet.normalCount < 1 ||
      tuplet.normalCount > 256 ||
      !Number.isSafeInteger(tuplet.tupletCount) ||
      tuplet.tupletCount < 1 ||
      tuplet.tupletCount > 256)
  ) {
    throw new ScoreSerializationError(path, "invalid tuplet counts");
  }
  return tuplet === null
    ? null
    : {
        normalCount: tuplet.normalCount,
        tupletCount: tuplet.tupletCount,
      };
}

function serializeBeatNotes(
  beat: Beat,
  path: SerializationPath
): SerializedBeat["notes"] {
  if (beat.notes === null) {
    return null;
  }
  if (beat.notes.length !== beat.trackContext.instrument.maxPolyphony) {
    throw new ScoreSerializationError(path, "unexpected note slot count");
  }
  return serializeArray(beat.notes, path, (note, notePath, index) => {
    if (!(note instanceof GuitarNote)) {
      throw new ScoreSerializationError(notePath, "unsupported note type");
    }
    if (note.stringNum !== index + 1) {
      throw new ScoreSerializationError(
        notePath,
        "note string does not match its slot"
      );
    }
    return serializeNote(note, notePath);
  });
}

export function serializeBeat(
  beat: Beat,
  path: SerializationPath
): SerializedBeat {
  if (SERIALIZED_NOTE_DURATIONS[beat.baseDuration] === undefined) {
    throw new ScoreSerializationError(
      propertyPath(path, "duration"),
      "unsupported duration"
    );
  }
  if (!Number.isInteger(beat.dots) || beat.dots < 0 || beat.dots > 2) {
    throw new ScoreSerializationError(
      propertyPath(path, "dots"),
      "out of range"
    );
  }
  return {
    notes: serializeBeatNotes(beat, propertyPath(path, "notes")),
    duration: SERIALIZED_NOTE_DURATIONS[beat.baseDuration],
    dots: beat.dots,
    tuplet: serializeTuplet(beat.tupletSettings, propertyPath(path, "tuplet")),
  };
}

export function serializeVoiceBar(
  voiceBar: VoiceBar,
  path: SerializationPath
): SerializedVoiceBar {
  const beatsPath = propertyPath(path, "beats");
  if (voiceBar.isEmpty()) {
    throw new ScoreSerializationError(
      beatsPath,
      "cannot serialize empty voice bar"
    );
  }
  return {
    beats: serializeArray(voiceBar.beats, beatsPath, serializeBeat),
  };
}

function deserializeBendOptions(
  reader: SerializedValueReader
): BendTechniqueOptions {
  reader.readObject();
  const type = readBendType(reader.property("type"));
  const suppliedKeys = reader.readKeys();
  const expectedKeys = OPTIONS_PER_BEND_TYPE[type];
  if (
    suppliedKeys.length !== expectedKeys.length ||
    suppliedKeys.some(
      (key) => !expectedKeys.some((expectedKey) => expectedKey === key)
    )
  ) {
    reader.fail("unexpected or missing bend option");
  }
  const options: BendOptionsData = { type };
  for (const key of expectedKeys) {
    if (key === "type") {
      continue;
    }
    options[key] = reader.property(key).readFiniteNumber();
  }
  return reader.runModelOperation(() => new BendTechniqueOptions(options));
}

function deserializeTechnique(
  reader: SerializedValueReader,
  note: GuitarNote
): GuitarTechnique {
  const obj = reader.readObject();
  const type = readTechniqueType(reader.property("type"));
  if (type === GuitarTechniqueType.Bend) {
    if (obj.options === undefined) {
      reader.property("options").fail("expected bend options");
    }
    const bendOptions = deserializeBendOptions(reader.property("options"));
    return reader.runModelOperation(
      () => new GuitarTechnique(note, type, bendOptions)
    );
  }
  if (obj.options !== undefined) {
    reader.property("options").fail("unexpected options");
  }
  return reader.runModelOperation(() => new GuitarTechnique(note, type));
}

function deserializeNote(
  reader: SerializedValueReader,
  note: GuitarNote
): DeferredNoteTechniques {
  reader.readObject();
  const fretReader = reader.property("fret");
  const fret = fretReader.readNullableInteger();
  if (
    fret !== null &&
    (fret < -1 || fret > note.trackContext.instrument.fretsCount)
  ) {
    fretReader.fail("out of range");
  }
  fretReader.runModelOperation(() => {
    note.fret = fret;
  });
  return {
    note,
    techniques: reader.property("techniques").readArray(),
  };
}

function restoreNoteTechniques(deferred: DeferredNoteTechniques): void {
  const seenTypes = new Set<GuitarTechniqueType>();
  for (const techniqueReader of deferred.techniques) {
    const technique = deserializeTechnique(techniqueReader, deferred.note);
    if (seenTypes.has(technique.type)) {
      techniqueReader.fail("duplicate technique");
    }
    seenTypes.add(technique.type);
    if (!deferred.note.addTechnique(technique)) {
      techniqueReader.fail("incompatible technique");
    }
  }
}

function validateBendContinuation(deferred: DeferredNoteTechniques): void {
  const bend = deferred.note.techniques.find(
    (technique) => technique.type === GuitarTechniqueType.Bend
  );
  const options = bend?.bendOptions;
  if (
    options === undefined ||
    options === null ||
    (options.type !== BendType.Bend && options.type !== BendType.BendAndRelease)
  ) {
    return;
  }
  const continuationPitch = deferred.note.getBendContinuationPitch();
  if (continuationPitch === undefined) {
    return;
  }
  if (
    continuationPitch < MAX_BEND_PITCH &&
    options.bendPitch !== undefined &&
    options.bendPitch >= continuationPitch
  ) {
    return;
  }
  const bendIndex = deferred.techniques.findIndex(
    (r) =>
      r.rawValue() !== null &&
      typeof r.rawValue() === "object" &&
      !Array.isArray(r.rawValue()) &&
      r.property("type").rawValue() === SerializedTechniqueType.Bend
  );
  deferred.techniques[bendIndex].fail(
    "bend is invalid for let-ring continuation"
  );
}

function deserializeTuplet(
  reader: SerializedValueReader
): TupletSettings | null {
  if (reader.rawValue() === undefined) {
    reader.fail("missing property");
  }
  if (reader.rawValue() === null) {
    return null;
  }
  reader.readObject();
  return {
    normalCount: reader.property("normalCount").readIntegerInRange(1, 256),
    tupletCount: reader.property("tupletCount").readIntegerInRange(1, 256),
  };
}

function restoreBeatNotes(
  notesReader: SerializedValueReader,
  beatReader: SerializedValueReader,
  beat: Beat<Guitar>,
  voiceBar: VoiceBar<Guitar>
): DeferredNoteTechniques[] {
  if (notesReader.rawValue() === null) {
    beat.makeRest();
    return [];
  }
  const notes = notesReader.readArray();
  if (notes.length !== voiceBar.trackContext.instrument.maxPolyphony) {
    notesReader.fail("unexpected note slot count");
  }
  const beatNotes = beat.notes;
  if (beatNotes === null) {
    beatReader.fail("expected note beat");
  }
  const deferredTechniques: DeferredNoteTechniques[] = [];
  for (let i = 0; i < notes.length; i++) {
    const noteReader = notes[i];
    if (noteReader.rawValue() === null) {
      continue;
    }
    const note = beatNotes[i];
    if (!(note instanceof GuitarNote)) {
      return noteReader.fail("unsupported note type");
    }
    deferredTechniques.push(deserializeNote(noteReader, note));
  }
  return deferredTechniques;
}

function deserializeBeat(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): { beat: Beat<Guitar>; deferredTechniques: DeferredNoteTechniques[] } {
  reader.readObject();
  const duration = readNoteDuration(reader.property("duration"));
  const dots = readBeatDots(reader.property("dots"));
  const tuplet = deserializeTuplet(reader.property("tuplet"));
  const beat = reader.runModelOperation(
    () =>
      new Beat<Guitar>(
        voiceBar,
        voiceBar.trackContext,
        [],
        duration,
        dots,
        tuplet
      )
  );
  const deferredTechniques = restoreBeatNotes(
    reader.property("notes"),
    reader,
    beat,
    voiceBar
  );
  return { beat, deferredTechniques };
}

export function deserializeVoiceBar(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): void {
  reader.readObject();
  const beatsReader = reader.property("beats");
  const beats = beatsReader.readArray();
  if (beats.length === 0) {
    beatsReader.fail("unexpected empty voice bar");
  }
  const deserializedBeats: Beat<Guitar>[] = [];
  const deferredTechniques: DeferredNoteTechniques[] = [];
  for (const beatReader of beats) {
    const deserialized = deserializeBeat(beatReader, voiceBar);
    deserializedBeats.push(deserialized.beat);
    deferredTechniques.push(...deserialized.deferredTechniques);
  }
  reader.runModelOperation(() => voiceBar.replaceBeats(deserializedBeats));
  for (const deferred of deferredTechniques) {
    restoreNoteTechniques(deferred);
  }
  for (const deferred of deferredTechniques) {
    validateBendContinuation(deferred);
  }
}
