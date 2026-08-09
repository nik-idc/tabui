import { BarRepeatStatus } from "../../bar-repeat-status";
import { BeatDots } from "../../beat";
import { BendType } from "../../bend-type";
import { ClefType } from "../../clef-type";
import { GuitarTechniqueType } from "../../technique-type";
import { NoteDuration } from "../../note-duration";
import { NoteValue } from "../../note";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  OtherStringTone,
  StringInstrumentTone,
} from "../../instrument/instrument-tone";
import { InstrumentFamily } from "../../instrument/instrument-family";
import { StringInstrumentType } from "../../instrument/instrument-type";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  SerializedBendType,
  SerializedClefType,
  SerializedInstrumentFamily,
  SerializedNoteDuration,
  SerializedPlayableNoteValue,
  SerializedRepeatStatus,
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType,
  SerializedTechniqueType,
} from "./schema";

/** Stable v1 mapping from model note durations to wire values. */
export const SERIALIZED_NOTE_DURATIONS: Record<
  NoteDuration,
  SerializedNoteDuration
> = {
  [NoteDuration.Whole]: SerializedNoteDuration.Whole,
  [NoteDuration.Half]: SerializedNoteDuration.Half,
  [NoteDuration.Quarter]: SerializedNoteDuration.Quarter,
  [NoteDuration.Eighth]: SerializedNoteDuration.Eighth,
  [NoteDuration.Sixteenth]: SerializedNoteDuration.Sixteenth,
  [NoteDuration.ThirtySecond]: SerializedNoteDuration.ThirtySecond,
  [NoteDuration.SixtyFourth]: SerializedNoteDuration.SixtyFourth,
};

/** Supported v1 wire values for validated note-duration reads. */
const NOTE_DURATION_BY_VALUE: Record<string, NoteDuration> = {
  [SerializedNoteDuration.Whole]: NoteDuration.Whole,
  [SerializedNoteDuration.Half]: NoteDuration.Half,
  [SerializedNoteDuration.Quarter]: NoteDuration.Quarter,
  [SerializedNoteDuration.Eighth]: NoteDuration.Eighth,
  [SerializedNoteDuration.Sixteenth]: NoteDuration.Sixteenth,
  [SerializedNoteDuration.ThirtySecond]: NoteDuration.ThirtySecond,
  [SerializedNoteDuration.SixtyFourth]: NoteDuration.SixtyFourth,
};

/** Stable v1 mapping from model bar repeat states to wire values. */
export const SERIALIZED_REPEAT_STATUSES: Record<
  BarRepeatStatus,
  SerializedRepeatStatus
> = {
  [BarRepeatStatus.None]: SerializedRepeatStatus.None,
  [BarRepeatStatus.Start]: SerializedRepeatStatus.Start,
  [BarRepeatStatus.End]: SerializedRepeatStatus.End,
};

/** Supported v1 wire values for validated bar repeat-state reads. */
const REPEAT_STATUS_BY_VALUE: Record<string, BarRepeatStatus> = {
  [SerializedRepeatStatus.None]: BarRepeatStatus.None,
  [SerializedRepeatStatus.Start]: BarRepeatStatus.Start,
  [SerializedRepeatStatus.End]: BarRepeatStatus.End,
};

/** Stable v1 mapping from model guitar techniques to wire values. */
export const SERIALIZED_TECHNIQUE_TYPES: Record<
  GuitarTechniqueType,
  SerializedTechniqueType
> = {
  [GuitarTechniqueType.Bend]: SerializedTechniqueType.Bend,
  [GuitarTechniqueType.Legato]: SerializedTechniqueType.HammerOnOrPullOff,
  [GuitarTechniqueType.LetRing]: SerializedTechniqueType.LetRing,
  [GuitarTechniqueType.NaturalHarmonic]:
    SerializedTechniqueType.NaturalHarmonic,
  [GuitarTechniqueType.PalmMute]: SerializedTechniqueType.PalmMute,
  [GuitarTechniqueType.PinchHarmonic]: SerializedTechniqueType.PinchHarmonic,
  [GuitarTechniqueType.Slide]: SerializedTechniqueType.Slide,
  [GuitarTechniqueType.Vibrato]: SerializedTechniqueType.Vibrato,
};

/** Supported v1 wire values for validated guitar-technique reads. */
const TECHNIQUE_BY_VALUE: Record<string, GuitarTechniqueType> = {
  [SerializedTechniqueType.Bend]: GuitarTechniqueType.Bend,
  [SerializedTechniqueType.HammerOnOrPullOff]: GuitarTechniqueType.Legato,
  [SerializedTechniqueType.LetRing]: GuitarTechniqueType.LetRing,
  [SerializedTechniqueType.NaturalHarmonic]:
    GuitarTechniqueType.NaturalHarmonic,
  [SerializedTechniqueType.PalmMute]: GuitarTechniqueType.PalmMute,
  [SerializedTechniqueType.PinchHarmonic]: GuitarTechniqueType.PinchHarmonic,
  [SerializedTechniqueType.Slide]: GuitarTechniqueType.Slide,
  [SerializedTechniqueType.Vibrato]: GuitarTechniqueType.Vibrato,
};

/** Supported v1 wire values for validated bend-type reads. */
const BEND_TYPE_BY_VALUE: Record<string, BendType> = {
  [SerializedBendType.Bend]: BendType.Bend,
  [SerializedBendType.BendAndRelease]: BendType.BendAndRelease,
  [SerializedBendType.Hold]: BendType.Hold,
  [SerializedBendType.Prebend]: BendType.Prebend,
  [SerializedBendType.PrebendAndRelease]: BendType.PrebendAndRelease,
  [SerializedBendType.PrebendBend]: BendType.PrebendBend,
  [SerializedBendType.Release]: BendType.Release,
};

/** Stable v1 mapping from model clef types to wire values. */
export const SERIALIZED_CLEF_TYPES: Record<ClefType, SerializedClefType> = {
  [ClefType.Treble]: SerializedClefType.Treble,
  [ClefType.Bass]: SerializedClefType.Bass,
  [ClefType.Alto]: SerializedClefType.Alto,
  [ClefType.Tenor]: SerializedClefType.Tenor,
  [ClefType.Percussion]: SerializedClefType.Percussion,
  [ClefType.Tab]: SerializedClefType.Tab,
};

/** Supported v1 wire values for validated clef-type reads. */
const CLEF_TYPE_BY_VALUE: Record<string, ClefType> = {
  [SerializedClefType.Treble]: ClefType.Treble,
  [SerializedClefType.Bass]: ClefType.Bass,
  [SerializedClefType.Alto]: ClefType.Alto,
  [SerializedClefType.Tenor]: ClefType.Tenor,
  [SerializedClefType.Percussion]: ClefType.Percussion,
  [SerializedClefType.Tab]: ClefType.Tab,
};

/**
 * Stable v1 family mapping; `undefined` marks model families unsupported by
 * this wire format.
 */
export const SERIALIZED_INSTRUMENT_FAMILIES: Record<
  InstrumentFamily,
  SerializedInstrumentFamily | undefined
> = {
  [InstrumentFamily.Strings]: SerializedInstrumentFamily.Strings,
  [InstrumentFamily.Orchestra]: undefined,
  [InstrumentFamily.Drums]: undefined,
};

/** Instrument families accepted from v1 wire data. */
const INSTRUMENT_FAMILY_BY_VALUE: Record<string, InstrumentFamily> = {
  [SerializedInstrumentFamily.Strings]: InstrumentFamily.Strings,
};

/** Stable v1 mapping for the supported acoustic, electric, bass, and other variants. */
export const SERIALIZED_STRING_INSTRUMENT_TYPES: Record<
  StringInstrumentType,
  SerializedStringInstrumentType
> = {
  [StringInstrumentType.AcousticGuitar]:
    SerializedStringInstrumentType.AcousticGuitar,
  [StringInstrumentType.ElectricGuitar]:
    SerializedStringInstrumentType.ElectricGuitar,
  [StringInstrumentType.BassGuitar]: SerializedStringInstrumentType.BassGuitar,
  [StringInstrumentType.Other]: SerializedStringInstrumentType.Other,
};

/** Supported v1 guitar and other string-instrument variant values. */
const STRING_INSTRUMENT_TYPE_BY_VALUE: Record<string, StringInstrumentType> = {
  [SerializedStringInstrumentType.AcousticGuitar]:
    StringInstrumentType.AcousticGuitar,
  [SerializedStringInstrumentType.ElectricGuitar]:
    StringInstrumentType.ElectricGuitar,
  [SerializedStringInstrumentType.BassGuitar]: StringInstrumentType.BassGuitar,
  [SerializedStringInstrumentType.Other]: StringInstrumentType.Other,
};

/** Stable v1 mapping from each supported string-instrument tone to its wire value. */
export const SERIALIZED_STRING_TONES: Record<
  StringInstrumentTone,
  SerializedStringInstrumentTone
> = {
  [AcousticGuitarTone.Nylon]: SerializedStringInstrumentTone.Nylon,
  [AcousticGuitarTone.Steel]: SerializedStringInstrumentTone.Steel,
  [ElectricGuitarTone.Clean]: SerializedStringInstrumentTone.ElectricClean,
  [ElectricGuitarTone.Overdrive]:
    SerializedStringInstrumentTone.ElectricOverdrive,
  [ElectricGuitarTone.Distortion]:
    SerializedStringInstrumentTone.ElectricDistortion,
  [BassGuitarTone.Acoustic]: SerializedStringInstrumentTone.BassAcoustic,
  [BassGuitarTone.Clean]: SerializedStringInstrumentTone.BassClean,
  [BassGuitarTone.Distortion]: SerializedStringInstrumentTone.BassDistortion,
  [OtherStringTone.Banjo]: SerializedStringInstrumentTone.Banjo,
  [OtherStringTone.Ukulele]: SerializedStringInstrumentTone.Ukulele,
};

/** Supported v1 wire tones across acoustic, electric, bass, and other variants. */
const STRING_TONE_BY_VALUE: Record<string, StringInstrumentTone> = {
  [SerializedStringInstrumentTone.Nylon]: AcousticGuitarTone.Nylon,
  [SerializedStringInstrumentTone.Steel]: AcousticGuitarTone.Steel,
  [SerializedStringInstrumentTone.ElectricClean]: ElectricGuitarTone.Clean,
  [SerializedStringInstrumentTone.ElectricOverdrive]:
    ElectricGuitarTone.Overdrive,
  [SerializedStringInstrumentTone.ElectricDistortion]:
    ElectricGuitarTone.Distortion,
  [SerializedStringInstrumentTone.BassAcoustic]: BassGuitarTone.Acoustic,
  [SerializedStringInstrumentTone.BassClean]: BassGuitarTone.Clean,
  [SerializedStringInstrumentTone.BassDistortion]: BassGuitarTone.Distortion,
  [SerializedStringInstrumentTone.Banjo]: OtherStringTone.Banjo,
  [SerializedStringInstrumentTone.Ukulele]: OtherStringTone.Ukulele,
};

/** Stable v1 mapping for playable pitches; rest and dead-note sentinels are excluded. */
export const SERIALIZED_PLAYABLE_NOTE_VALUES: Record<
  Exclude<NoteValue, NoteValue.None | NoteValue.Dead>,
  SerializedPlayableNoteValue
> = {
  [NoteValue.A]: SerializedPlayableNoteValue.A,
  [NoteValue.ASharp]: SerializedPlayableNoteValue.ASharp,
  [NoteValue.B]: SerializedPlayableNoteValue.B,
  [NoteValue.C]: SerializedPlayableNoteValue.C,
  [NoteValue.CSharp]: SerializedPlayableNoteValue.CSharp,
  [NoteValue.D]: SerializedPlayableNoteValue.D,
  [NoteValue.DSharp]: SerializedPlayableNoteValue.DSharp,
  [NoteValue.E]: SerializedPlayableNoteValue.E,
  [NoteValue.F]: SerializedPlayableNoteValue.F,
  [NoteValue.FSharp]: SerializedPlayableNoteValue.FSharp,
  [NoteValue.G]: SerializedPlayableNoteValue.G,
  [NoteValue.GSharp]: SerializedPlayableNoteValue.GSharp,
};

/** Playable pitch values accepted from v1 wire data. */
const NOTE_VALUE_BY_VALUE: Record<string, NoteValue> = {
  [SerializedPlayableNoteValue.A]: NoteValue.A,
  [SerializedPlayableNoteValue.ASharp]: NoteValue.ASharp,
  [SerializedPlayableNoteValue.B]: NoteValue.B,
  [SerializedPlayableNoteValue.C]: NoteValue.C,
  [SerializedPlayableNoteValue.CSharp]: NoteValue.CSharp,
  [SerializedPlayableNoteValue.D]: NoteValue.D,
  [SerializedPlayableNoteValue.DSharp]: NoteValue.DSharp,
  [SerializedPlayableNoteValue.E]: NoteValue.E,
  [SerializedPlayableNoteValue.F]: NoteValue.F,
  [SerializedPlayableNoteValue.FSharp]: NoteValue.FSharp,
  [SerializedPlayableNoteValue.G]: NoteValue.G,
  [SerializedPlayableNoteValue.GSharp]: NoteValue.GSharp,
};

/** Reads and validates a v1 note duration at the reader's current path. */
export function readNoteDuration(reader: SerializedValueReader): NoteDuration {
  return reader.readEnumValue(NOTE_DURATION_BY_VALUE);
}

/** Reads and validates a v1 bar repeat state at the reader's current path. */
export function readRepeatStatus(
  reader: SerializedValueReader
): BarRepeatStatus {
  return reader.readEnumValue(REPEAT_STATUS_BY_VALUE);
}

/** Reads and validates a v1 guitar technique at the reader's current path. */
export function readTechniqueType(
  reader: SerializedValueReader
): GuitarTechniqueType {
  return reader.readEnumValue(TECHNIQUE_BY_VALUE);
}

/** Reads and validates a v1 bend type at the reader's current path. */
export function readBendType(reader: SerializedValueReader): BendType {
  return reader.readEnumValue(BEND_TYPE_BY_VALUE);
}

/** Reads and validates a playable v1 pitch at the reader's current path. */
export function readNoteValue(reader: SerializedValueReader): NoteValue {
  return reader.readEnumValue(NOTE_VALUE_BY_VALUE);
}

/** Reads and validates a v1 clef type at the reader's current path. */
export function readClefType(reader: SerializedValueReader): ClefType {
  return reader.readEnumValue(CLEF_TYPE_BY_VALUE);
}

/** Reads a v1-supported instrument family at the reader's current path. */
export function readInstrumentFamily(
  reader: SerializedValueReader
): InstrumentFamily {
  return reader.readEnumValue(INSTRUMENT_FAMILY_BY_VALUE);
}

/** Reads a supported v1 string-instrument variant at the current path. */
export function readStringInstrumentType(
  reader: SerializedValueReader
): StringInstrumentType {
  return reader.readEnumValue(STRING_INSTRUMENT_TYPE_BY_VALUE);
}

/** Reads a supported v1 string-instrument tone at the current path. */
export function readStringTone(
  reader: SerializedValueReader
): StringInstrumentTone {
  return reader.readEnumValue(STRING_TONE_BY_VALUE);
}

/** Reads a beat-dot count, rejecting values outside the model's zero-to-two range. */
export function readBeatDots(reader: SerializedValueReader): BeatDots {
  const dots = reader.readInteger();
  switch (dots) {
    case 0:
    case 1:
    case 2:
      return dots;
    default:
      reader.fail("out of range");
  }
}
