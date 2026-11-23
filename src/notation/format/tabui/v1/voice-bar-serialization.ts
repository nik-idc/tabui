import { AccentOptions } from "../../../model/accent-options";
import { Beat } from "../../../model/beat";
import { BeatGuitarTechnique } from "../../../model/beat-guitar-technique";
import { beatGuitarTechniquesIncompatible } from "../../../model/beat-guitar-technique-lists";
import { BeatGuitarTechniqueType } from "../../../model/beat-technique-type";
import { DEFAULT_DYNAMIC } from "../../../model/dynamic";
import {
  MAX_STROKE_DURATION,
  MIN_STROKE_DURATION,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_ALIGNMENT_STARTS_ON_TIME,
  StrokeOptions,
} from "../../../model/stroke-options";
import {
  BendOptionsData,
  BendTechniqueOptions,
  MAX_BEND_PITCH,
} from "../../../model/bend-options";
import { BendType, OPTIONS_PER_BEND_TYPE } from "../../../model/bend-type";
import { GuitarNote } from "../../../model/guitar-note";
import { GuitarTechnique } from "../../../model/guitar-technique";
import { TECHNIQUE_ALLOWED_ON_EMPTY_NOTES } from "../../../model/guitar-technique-lists";
import {
  guitarTechniquesIncompatible,
  isBendValidForContinuation,
} from "../../../model/guitar-technique-validation";
import { Guitar } from "../../../model/instrument/guitar/guitar";
import { GuitarTechniqueType } from "../../../model/technique-type";
import {
  MAX_TUPLET_NORMAL_COUNT,
  MAX_TUPLET_TUPLET_COUNT,
  MIN_TUPLET_NORMAL_COUNT,
  MIN_TUPLET_TUPLET_COUNT,
  TupletSettings,
} from "../../../model/tuplet-settings";
import { VoiceBar } from "../../../model/voice-bar";
import { ScoreSerializationError } from "../serialization-error";
import { serializeArray } from "../serialize-array";
import {
  indexPath,
  propertyPath,
  SerializationPath,
} from "../serialization-path";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  SERIALIZED_ACCENT_KINDS,
  SERIALIZED_DYNAMICS,
  SERIALIZED_NOTE_DURATIONS,
  SERIALIZED_STROKE_DIRECTIONS,
  readAccentKind,
  readBeatDots,
  readBeatTechniqueType,
  readDynamic,
  readStrokeDirection,
  readBendType,
  readNoteDuration,
  readTechniqueType,
  SERIALIZED_TECHNIQUE_TYPES,
} from "./mappings";
import {
  SerializedAccentOptions,
  SerializedBeat,
  SerializedBeatTechnique,
  SerializedBeatTechniqueType,
  SerializedBendOptions,
  SerializedBendType,
  SerializedStrokeOptions,
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

/** Encodes accent options after checking the kind. */
function serializeAccentOptions(
  options: AccentOptions,
  path: SerializationPath
): SerializedAccentOptions {
  if (
    !Object.prototype.hasOwnProperty.call(SERIALIZED_ACCENT_KINDS, options.kind)
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "kind"),
      "unsupported accent kind"
    );
  }
  return { kind: SERIALIZED_ACCENT_KINDS[options.kind] };
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
  if (technique.type === GuitarTechniqueType.Accent) {
    const options = technique.accentOptions;
    if (options === null) {
      throw new ScoreSerializationError(
        propertyPath(path, "options"),
        "accent technique missing options"
      );
    }
    return {
      type: SerializedTechniqueType.Accent,
      options: serializeAccentOptions(options, propertyPath(path, "options")),
    };
  }
  if (technique.accentOptions !== null) {
    throw new ScoreSerializationError(
      propertyPath(path, "options"),
      "unexpected accent options"
    );
  }
  if (
    type === SerializedTechniqueType.Bend ||
    type === SerializedTechniqueType.Accent
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "type"),
      "technique type mismatch"
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
 * Serializes an owned guitar-string slot, collapsing an empty note to null.
 */
function serializeNote(
  note: GuitarNote,
  path: SerializationPath,
  beat: Beat<Guitar>
): SerializedGuitarNote | null {
  if (note.beat !== beat || note.trackContext !== beat.trackContext) {
    throw new ScoreSerializationError(path, "note ownership mismatch");
  }
  if (note.fret === null) {
    const hasDisallowedTechnique = note.techniques.some(
      (t) => !TECHNIQUE_ALLOWED_ON_EMPTY_NOTES[t.type]
    );
    if (hasDisallowedTechnique) {
      throw new ScoreSerializationError(
        indexPath(propertyPath(path, "techniques"), 0),
        "technique requires a note value"
      );
    }
    if (note.techniques.length === 0) {
      return null;
    }
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

/** Checks transitions that require neighboring beats in the complete score. */
function validateBeatTransitions(
  beat: Beat<Guitar>,
  path: SerializationPath
): void {
  for (let index = 0; index < (beat.notes?.length ?? 0); index++) {
    const note = beat.notes?.[index];
    if (!(note instanceof GuitarNote)) {
      continue;
    }
    const techniquesPath = indexPath(propertyPath(path, "notes"), index);
    if (
      note.fret === null &&
      note.techniques.length > 0 &&
      !note.hasLetRingSupport()
    ) {
      throw new ScoreSerializationError(
        techniquesPath,
        "empty Let Ring requires a preceding marked source"
      );
    }
    if (note.hasTechnique(GuitarTechniqueType.Tie) && !note.isTieContinuation) {
      throw new ScoreSerializationError(
        propertyPath(techniquesPath, "techniques"),
        "tie requires the preceding same-string fret"
      );
    }
    const bendIndex = note.techniques.findIndex(
      (technique) => technique.type === GuitarTechniqueType.Bend
    );
    const bendOptions = note.techniques[bendIndex]?.bendOptions;
    if (
      bendOptions !== undefined &&
      bendOptions !== null &&
      !isBendValidForContinuation(note, bendOptions)
    ) {
      throw new ScoreSerializationError(
        indexPath(propertyPath(techniquesPath, "techniques"), bendIndex),
        "bend is invalid for tied continuation"
      );
    }
  }
}

/** Encodes stroke options after checking the direction; the options class already validated the numbers. */
function serializeStrokeOptions(
  options: StrokeOptions,
  path: SerializationPath
): SerializedStrokeOptions {
  const { direction, duration, alignment } = options;
  if (
    !Object.prototype.hasOwnProperty.call(
      SERIALIZED_STROKE_DIRECTIONS,
      direction
    )
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "direction"),
      "unsupported stroke direction"
    );
  }
  return {
    direction: SERIALIZED_STROKE_DIRECTIONS[direction],
    duration,
    alignment,
  };
}

/** Serializes one beat technique after checking its owner and class, encoding options for its type. */
function serializeBeatTechnique(
  technique: BeatGuitarTechnique,
  path: SerializationPath,
  beat: Beat<Guitar>
): SerializedBeatTechnique {
  if (!(technique instanceof BeatGuitarTechnique)) {
    throw new ScoreSerializationError(path, "unsupported beat technique type");
  }
  if (technique.beat !== beat) {
    throw new ScoreSerializationError(
      path,
      "beat technique belongs to another beat"
    );
  }

  const type = technique.type;
  switch (type) {
    case BeatGuitarTechniqueType.Stroke:
      return {
        type: SerializedBeatTechniqueType.Stroke,
        options: serializeStrokeOptions(
          technique.options,
          propertyPath(path, "options")
        ),
      };
    default: {
      const unknownType: never = type;
      throw new ScoreSerializationError(
        propertyPath(path, "type"),
        `unsupported beat technique type: ${unknownType}`
      );
    }
  }
}

/**
 * Serializes beat techniques, or returns undefined when there are none so the
 * key is omitted; rejects techniques on a rest and duplicate or incompatible entries.
 */
function serializeBeatTechniques(
  beat: Beat<Guitar>,
  path: SerializationPath
): SerializedBeatTechnique[] | undefined {
  const techniques = beat.beatTechniques;
  if (techniques.length === 0) {
    return undefined;
  }
  if (beat.isRest()) {
    throw new ScoreSerializationError(
      path,
      "beat techniques require a note beat"
    );
  }

  const previous: BeatGuitarTechnique[] = [];
  return serializeArray([...techniques], path, (technique, techniquePath) => {
    const serialized = serializeBeatTechnique(technique, techniquePath, beat);
    if (
      previous.some((t) =>
        beatGuitarTechniquesIncompatible(t.type, technique.type)
      )
    ) {
      throw new ScoreSerializationError(
        techniquePath,
        "duplicate or incompatible beat technique"
      );
    }
    previous.push(technique);
    return serialized;
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
  const serialized = serializeBeatStructure(beat, path, voiceBar);
  validateBeatTransitions(beat, path);
  return serialized;
}

/** Serializes clipboard beat structure without score-neighbor transition checks. */
export function serializeClipboardBeat(
  beat: Beat<Guitar>,
  path: SerializationPath,
  voiceBar: VoiceBar<Guitar>
): SerializedBeat {
  return serializeBeatStructure(beat, path, voiceBar);
}

function serializeBeatStructure(
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
  const serialized: SerializedBeat = {
    notes: serializeBeatNotes(beat, propertyPath(path, "notes")),
    duration: SERIALIZED_NOTE_DURATIONS[beat.baseDuration],
    dots: beat.dots,
    tuplet: serializeTuplet(beat.tupletSettings, propertyPath(path, "tuplet")),
  };
  const techniques = serializeBeatTechniques(
    beat,
    propertyPath(path, "techniques")
  );
  if (techniques !== undefined) {
    serialized.techniques = techniques;
  }
  if (
    !Object.prototype.hasOwnProperty.call(SERIALIZED_DYNAMICS, beat.dynamic)
  ) {
    throw new ScoreSerializationError(
      propertyPath(path, "dynamic"),
      "unsupported dynamic"
    );
  }
  // mf is the default, so it is not written.
  if (beat.dynamic !== DEFAULT_DYNAMIC) {
    serialized.dynamic = SERIALIZED_DYNAMICS[beat.dynamic];
  }
  return serialized;
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

/** Reconstructs accent options, checking the kind. */
function deserializeAccentOptions(
  reader: SerializedValueReader
): AccentOptions {
  reader.readObject(["kind"]);
  const kind = readAccentKind(reader.property("kind"));
  return reader.runModelOperation(() => new AccentOptions({ kind }));
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
  if (type === GuitarTechniqueType.Accent) {
    reader.expectKeys(["type", "options"]);
    const accentOptions = deserializeAccentOptions(reader.property("options"));
    return reader.runModelOperation(
      () => new GuitarTechnique(note, type, accentOptions)
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
  const fret = fretReader.rawValue() === null ? null : fretReader.readInteger();
  if (
    fret !== null &&
    (fret < -1 || fret > note.trackContext.instrument.fretsCount)
  ) {
    fretReader.fail("out of range");
  }
  fretReader.runModelOperation(() => {
    note.setFret(fret);
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
    const emptyLetRing =
      technique.type === GuitarTechniqueType.LetRing &&
      deferred.note.fret === null;
    if (emptyLetRing && !deferred.note.hasLetRingSupport()) {
      techniqueReader.fail("empty Let Ring requires a preceding marked source");
    }
    if (!deferred.note.addTechnique(technique)) {
      techniqueReader.fail("incompatible technique");
    }
  }
}

/** Restores clipboard techniques with local checks only; neighbors are absent. */
function restoreClipboardNoteTechniques(
  deferred: DeferredNoteTechniques
): void {
  const seenTypes = new Set<GuitarTechniqueType>();
  const restored: GuitarTechnique[] = [];
  for (const techniqueReader of deferred.techniques) {
    const technique = deserializeTechnique(techniqueReader, deferred.note);
    if (
      deferred.note.fret === null &&
      !TECHNIQUE_ALLOWED_ON_EMPTY_NOTES[technique.type]
    ) {
      techniqueReader.fail("technique requires a note value");
    }
    if (seenTypes.has(technique.type)) {
      techniqueReader.fail("duplicate technique");
    }
    if (
      restored.some((item) => guitarTechniquesIncompatible(item, technique))
    ) {
      techniqueReader.fail("incompatible technique");
    }
    seenTypes.add(technique.type);
    deferred.note.techniques.push(technique);
    restored.push(technique);
  }
}

/**
 * Validates bend pitch against any tied continuation now discoverable from
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
  deferred.techniques[bendIndex].fail("bend is invalid for tied continuation");
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

/** Reconstructs stroke options, checking that the duration ticks and alignment are integers in range. */
function deserializeStrokeOptions(
  reader: SerializedValueReader
): StrokeOptions {
  reader.readObject(["direction", "duration", "alignment"]);
  const direction = readStrokeDirection(reader.property("direction"));
  const duration = reader
    .property("duration")
    .readIntegerInRange(MIN_STROKE_DURATION, MAX_STROKE_DURATION);
  const alignment = reader
    .property("alignment")
    .readIntegerInRange(
      STROKE_ALIGNMENT_STARTS_ON_TIME,
      STROKE_ALIGNMENT_FALLS_ON_TIME
    );
  return reader.runModelOperation(
    () => new StrokeOptions({ direction, duration, alignment })
  );
}

/** Reconstructs one beat technique for its owner beat, reading options for its type. */
function deserializeBeatTechnique(
  reader: SerializedValueReader,
  beat: Beat<Guitar>
): BeatGuitarTechnique {
  reader.readObject();
  const type = readBeatTechniqueType(reader.property("type"));
  reader.expectKeys(["type", "options"]);

  const optionsReader = reader.property("options");
  switch (type) {
    case BeatGuitarTechniqueType.Stroke: {
      const options = deserializeStrokeOptions(optionsReader);
      return reader.runModelOperation(
        () => new BeatGuitarTechnique(beat, type, options)
      );
    }
    default: {
      const unknownType: never = type;
      return reader
        .property("type")
        .fail(`unsupported beat technique type: ${unknownType}`);
    }
  }
}

/**
 * Adds beat techniques after the beat's notes are restored; a missing key
 * means none, and a rest cannot hold any.
 */
function restoreBeatTechniques(
  reader: SerializedValueReader,
  beat: Beat<Guitar>
): void {
  if (reader.rawValue() === undefined) {
    return;
  }
  const techniques = reader.readArray();
  if (techniques.length > 0 && beat.isRest()) {
    reader.fail("beat techniques require a note beat");
  }

  const seenTypes = new Set<BeatGuitarTechniqueType>();
  for (const techniqueReader of techniques) {
    const technique = deserializeBeatTechnique(techniqueReader, beat);
    if (seenTypes.has(technique.type)) {
      techniqueReader.fail("duplicate beat technique");
    }
    seenTypes.add(technique.type);
    if (!beat.addBeatTechnique(technique)) {
      techniqueReader.fail("incompatible beat technique");
    }
  }
}

/** Beat keys that every v1 beat must have. */
const REQUIRED_BEAT_KEYS = ["notes", "duration", "dots", "tuplet"] as const;
/** Beat keys that v1 writes only when they differ from their default. */
const OPTIONAL_BEAT_KEYS = ["techniques", "dynamic"] as const;

/**
 * Reconstructs a detached beat, its rest or sparse note slots, and its beat
 * techniques, while collecting note techniques that cannot yet inspect a complete voice.
 */
function deserializeBeat(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): { beat: Beat<Guitar>; deferredTechniques: DeferredNoteTechniques[] } {
  // `techniques` and `dynamic` are optional, so each is accepted only when present.
  const object = reader.readObject();
  const optionalKeys = OPTIONAL_BEAT_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(object, key)
  );
  reader.expectKeys([...REQUIRED_BEAT_KEYS, ...optionalKeys]);
  const duration = readNoteDuration(reader.property("duration"));
  const dots = readBeatDots(reader.property("dots"));
  const tuplet = deserializeTuplet(reader.property("tuplet"));
  const dynamicReader = reader.property("dynamic");
  const dynamic =
    dynamicReader.rawValue() === undefined
      ? DEFAULT_DYNAMIC
      : readDynamic(dynamicReader);
  const beat = reader.runModelOperation(
    () =>
      new Beat<Guitar>(
        voiceBar,
        voiceBar.trackContext,
        [],
        duration,
        dots,
        tuplet,
        dynamic
      )
  );
  const deferredTechniques = restoreBeatNotes(
    reader.property("notes"),
    reader,
    beat,
    voiceBar
  );
  restoreBeatTechniques(reader.property("techniques"), beat);
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

/** Restores clipboard beats without applying score-boundary transition checks. */
export function deserializeClipboardBeats(
  reader: SerializedValueReader,
  voiceBar: VoiceBar<Guitar>
): Beat<Guitar>[] {
  const beatsReader = reader.readArray();
  if (beatsReader.length === 0) {
    reader.fail("expected at least one beat");
  }
  const beats: Beat<Guitar>[] = [];
  const deferred: DeferredNoteTechniques[] = [];
  for (const beatReader of beatsReader) {
    const restored = deserializeBeat(beatReader, voiceBar);
    beats.push(restored.beat);
    deferred.push(...restored.deferredTechniques);
  }
  for (const item of deferred) {
    restoreClipboardNoteTechniques(item);
  }
  return beats;
}
