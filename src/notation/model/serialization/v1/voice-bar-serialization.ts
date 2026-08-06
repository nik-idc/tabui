import { Beat } from "../../beat";
import {
  BendOptionsData,
  BendTechniqueOptions,
  MAX_BEND_PITCH,
} from "../../bend-options";
import { BendType, OPTIONS_PER_BEND_TYPE } from "../../bend-type";
import { GuitarNote } from "../../guitar-note";
import { GuitarTechnique } from "../../guitar-technique";
import {
  guitarTechniquesIncompatible,
  isBendValidForContinuation,
} from "../../guitar-technique-validation";
import { Guitar } from "../../instrument/guitar/guitar";
import { GuitarTechniqueType } from "../../technique-type";
import {
  MAX_TUPLET_NORMAL_COUNT,
  MAX_TUPLET_TUPLET_COUNT,
  MIN_TUPLET_NORMAL_COUNT,
  MIN_TUPLET_TUPLET_COUNT,
  TupletSettings,
} from "../../tuplet-settings";
import { VoiceBar } from "../../voice-bar";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import {
  indexPath,
  propertyPath,
  SerializationPath,
} from "../serialization-path";
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
  SerializedTuplet,
  SerializedVoiceBar,
} from "./schema";

/**
 * A restored note paired with technique readers deferred until the complete
 * beat sequence is attached, because technique rules can inspect neighbors.
 */
export type DeferredNoteTechniques = {
  note: GuitarNote;
  techniques: SerializedValueReader[];
};

/** Reads a required bend field and enforces its model-level numeric bounds. */
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

/** Encodes only the option fields valid for the bend's discriminated type. */
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

/**
 * Serializes a technique after confirming that it is owned by the supplied
 * note and that its type and bend options form a supported combination.
 */
function serializeTechnique(
  technique: GuitarTechnique,
  path: SerializationPath,
  note: GuitarNote
): SerializedGuitarTechnique {
  if (!(technique instanceof GuitarTechnique)) {
    throw new ScoreSerializationError(path, "unsupported technique type");
  }
  if (technique.note !== note) {
    throw new ScoreSerializationError(
      path,
      "technique belongs to another note"
    );
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      SERIALIZED_TECHNIQUE_TYPES,
      technique.type
    )
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "type"),
      "unsupported technique type"
    );
  }
  const type = SERIALIZED_TECHNIQUE_TYPES[technique.type];
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
  if (technique.bendOptions !== null) {
    throw new ScoreSerializationError(
      propertyPath(path, "options"),
      "unexpected bend options"
    );
  }
  if (type === SerializedTechniqueType.Bend) {
    throw new ScoreSerializationError(
      propertyPath(path, "type"),
      "bend technique type mismatch"
    );
  }
  return { type };
}

/** Serializes techniques while rejecting duplicate or incompatible entries. */
function serializeTechniques(
  note: GuitarNote,
  path: SerializationPath
): SerializedGuitarTechnique[] {
  const serializedTypes = new Set<GuitarTechniqueType>();
  const previous: GuitarTechnique[] = [];
  return serializeArray(note.techniques, path, (technique, techniquePath) => {
    const serialized = serializeTechnique(technique, techniquePath, note);
    if (serializedTypes.has(technique.type)) {
      throw new ScoreSerializationError(techniquePath, "duplicate technique");
    }
    if (previous.some((t) => guitarTechniquesIncompatible(t, technique))) {
      throw new ScoreSerializationError(
        techniquePath,
        "incompatible technique"
      );
    }
    serializedTypes.add(technique.type);
    previous.push(technique);
    return serialized;
  });
}

/**
 * Serializes an owned guitar-string slot, collapsing a fretless note without
 * techniques to null while retaining technique-only note state.
 */
function serializeNote(
  note: GuitarNote,
  path: SerializationPath,
  beat: Beat<Guitar>
): SerializedGuitarNote | null {
  if (note.beat !== beat || note.trackContext !== beat.trackContext) {
    throw new ScoreSerializationError(path, "note ownership mismatch");
  }
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
  const techniques = serializeTechniques(note, techniquesPath);
  const bendIndex = note.techniques.findIndex(
    (t) => t.type === GuitarTechniqueType.Bend
  );
  const bendOptions = note.techniques[bendIndex]?.bendOptions;
  if (
    bendOptions !== undefined &&
    bendOptions !== null &&
    !isBendValidForContinuation(note, bendOptions)
  ) {
    throw new ScoreSerializationError(
      indexPath(techniquesPath, bendIndex),
      "bend is invalid for let-ring continuation"
    );
  }
  return {
    fret: note.fret,
    techniques,
  };
}

/** Encodes a nullable tuplet ratio after checking both bounded counts. */
function serializeTuplet(
  tuplet: TupletSettings | null,
  path: SerializationPath
): SerializedTuplet | null {
  if (tuplet !== null) {
    if (
      !Number.isSafeInteger(tuplet.normalCount) ||
      tuplet.normalCount < MIN_TUPLET_NORMAL_COUNT ||
      tuplet.normalCount > MAX_TUPLET_NORMAL_COUNT
    ) {
      throw new ScoreSerializationError(
        propertyPath(path, "normalCount"),
        `expected an integer between ${MIN_TUPLET_NORMAL_COUNT} and ${MAX_TUPLET_NORMAL_COUNT}`
      );
    }
    if (
      !Number.isSafeInteger(tuplet.tupletCount) ||
      tuplet.tupletCount < MIN_TUPLET_TUPLET_COUNT ||
      tuplet.tupletCount > MAX_TUPLET_TUPLET_COUNT
    ) {
      throw new ScoreSerializationError(
        propertyPath(path, "tupletCount"),
        `expected an integer between ${MIN_TUPLET_TUPLET_COUNT} and ${MAX_TUPLET_TUPLET_COUNT}`
      );
    }
  }
  return tuplet === null
    ? null
    : {
        normalCount: tuplet.normalCount,
        tupletCount: tuplet.tupletCount,
      };
}

/**
 * Preserves null for a rest; otherwise validates the fixed string-slot array
 * and each note's beat, track context, and string-slot ownership.
 */
function serializeBeatNotes(
  beat: Beat<Guitar>,
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
    if (
      note.beat !== beat ||
      note.trackContext !== beat.trackContext ||
      note.stringNum !== index + 1
    ) {
      throw new ScoreSerializationError(
        notePath,
        "note ownership or string slot mismatch"
      );
    }
    return serializeNote(note, notePath, beat);
  });
}

/**
 * Serializes an owned beat's duration and content after validating its
 * VoiceBar relationship and schema-supported rhythmic values.
 */
export function serializeBeat(
  beat: Beat<Guitar>,
  path: SerializationPath,
  voiceBar: VoiceBar<Guitar>
): SerializedBeat {
  if (
    beat.voiceBar !== voiceBar ||
    beat.trackContext !== voiceBar.trackContext
  ) {
    throw new ScoreSerializationError(path, "beat ownership mismatch");
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      SERIALIZED_NOTE_DURATIONS,
      beat.baseDuration
    )
  ) {
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

/**
 * Serializes a nonempty voice after checking its bar, track context, and sparse
 * voice-slot number against the caller's expected owners.
 */
export function serializeVoiceBar(
  voiceBar: VoiceBar<Guitar>,
  path: SerializationPath,
  bar: VoiceBar<Guitar>["bar"],
  voiceNumber: VoiceBar<Guitar>["voiceNumber"]
): SerializedVoiceBar {
  if (
    voiceBar.bar !== bar ||
    voiceBar.trackContext !== bar.trackContext ||
    voiceBar.voiceNumber !== voiceNumber
  ) {
    throw new ScoreSerializationError(path, "voice bar ownership mismatch");
  }
  const beatsPath = propertyPath(path, "beats");
  if (voiceBar.isEmpty()) {
    throw new ScoreSerializationError(
      beatsPath,
      "cannot serialize empty voice bar"
    );
  }
  return {
    beats: serializeArray(voiceBar.beats, beatsPath, (beat, beatPath) =>
      serializeBeat(beat, beatPath, voiceBar)
    ),
  };
}

/** Reconstructs a bend option object from exactly the fields its type permits. */
function deserializeBendOptions(
  reader: SerializedValueReader
): BendTechniqueOptions {
  const type = readBendType(reader.property("type"));
  const expectedKeys = OPTIONS_PER_BEND_TYPE[type];
  reader.expectKeys(expectedKeys);
  const options: BendOptionsData = { type };
  for (const key of expectedKeys) {
    if (key === "type") {
      continue;
    }
    options[key] = reader.property(key).readFiniteNumber();
  }
  return reader.runModelOperation(() => new BendTechniqueOptions(options));
}

/** Reconstructs one technique against its already attached owning note. */
function deserializeTechnique(
  reader: SerializedValueReader,
  note: GuitarNote
): GuitarTechnique {
  reader.readObject();
  const type = readTechniqueType(reader.property("type"));
  if (type === GuitarTechniqueType.Bend) {
    reader.expectKeys(["type", "options"]);
    const bendOptions = deserializeBendOptions(reader.property("options"));
    return reader.runModelOperation(
      () => new GuitarTechnique(note, type, bendOptions)
    );
  }
  reader.expectKeys(["type"]);
  return reader.runModelOperation(() => new GuitarTechnique(note, type));
}

/**
 * Restores fret state now but returns technique readers for restoration after
 * the complete voice beat sequence has been attached.
 */
function deserializeNote(
  reader: SerializedValueReader,
  note: GuitarNote
): DeferredNoteTechniques {
  reader.readObject(["fret", "techniques"]);
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

/**
 * Adds deferred techniques through model APIs, rejecting duplicates and
 * combinations that become incompatible in the reconstructed context.
 */
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

/**
 * Validates bend pitch against any let-ring continuation now discoverable from
 * neighboring attached beats, reporting failure at the source bend document.
 */
function validateBendContinuation(deferred: DeferredNoteTechniques): void {
  const bend = deferred.note.techniques.find(
    (technique) => technique.type === GuitarTechniqueType.Bend
  );
  if (
    bend?.bendOptions === undefined ||
    bend.bendOptions === null ||
    isBendValidForContinuation(deferred.note, bend.bendOptions)
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

/** Distinguishes a required null tuplet from a validated ratio object. */
function deserializeTuplet(
  reader: SerializedValueReader
): TupletSettings | null {
  if (reader.rawValue() === undefined) {
    reader.fail("missing property");
  }
  if (reader.rawValue() === null) {
    return null;
  }
  reader.readObject(["normalCount", "tupletCount"]);
  return {
    normalCount: reader
      .property("normalCount")
      .readIntegerInRange(MIN_TUPLET_NORMAL_COUNT, MAX_TUPLET_NORMAL_COUNT),
    tupletCount: reader
      .property("tupletCount")
      .readIntegerInRange(MIN_TUPLET_TUPLET_COUNT, MAX_TUPLET_TUPLET_COUNT),
  };
}

/**
 * Converts null notes to a rest or restores populated fixed string slots,
 * returning their techniques for deferred graph-aware validation.
 */
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

/**
 * Reconstructs a detached beat and its rest or sparse note slots while
 * collecting techniques that cannot yet inspect a complete voice.
 */
function deserializeBeat(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): { beat: Beat<Guitar>; deferredTechniques: DeferredNoteTechniques[] } {
  reader.readObject(["notes", "duration", "dots", "tuplet"]);
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

/**
 * Restores a nonempty voice in strict phases: build all beats and notes,
 * replace the beat sequence so model APIs regenerate derived rhythmic state,
 * add deferred techniques, then validate continuation-dependent bends.
 */
export function deserializeVoiceBar(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): void {
  reader.readObject(["beats"]);
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
