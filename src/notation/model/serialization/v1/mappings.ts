import { BarRepeatStatus } from "../../bar-repeat-status";
import { BeatDots } from "../../beat";
import { BendType } from "../../bend-type";
import { ClefType } from "../../clef-type";
import { GuitarTechniqueType } from "../../technique-type";
import { NoteDuration } from "../../note-duration";
import { NoteValue, NOTES_ARR } from "../../note";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  OtherStringTone,
} from "../../instrument/instrument-tone";
import { InstrumentFamily } from "../../instrument/instrument-family";
import { StringInstrumentType } from "../../instrument/instrument-type";
import { SerializedValueReader } from "../serialized-value-reader";
import {
  SerializedBendType,
  SerializedNoteDuration,
  SerializedRepeatStatus,
  SerializedTechniqueType,
} from "./schema";

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

const NOTE_DURATION_BY_VALUE: Record<string, NoteDuration> = {
  [SerializedNoteDuration.Whole]: NoteDuration.Whole,
  [SerializedNoteDuration.Half]: NoteDuration.Half,
  [SerializedNoteDuration.Quarter]: NoteDuration.Quarter,
  [SerializedNoteDuration.Eighth]: NoteDuration.Eighth,
  [SerializedNoteDuration.Sixteenth]: NoteDuration.Sixteenth,
  [SerializedNoteDuration.ThirtySecond]: NoteDuration.ThirtySecond,
  [SerializedNoteDuration.SixtyFourth]: NoteDuration.SixtyFourth,
};

export const SERIALIZED_REPEAT_STATUSES: Record<
  BarRepeatStatus,
  SerializedRepeatStatus
> = {
  [BarRepeatStatus.None]: SerializedRepeatStatus.None,
  [BarRepeatStatus.Start]: SerializedRepeatStatus.Start,
  [BarRepeatStatus.End]: SerializedRepeatStatus.End,
};

const REPEAT_STATUS_BY_VALUE: Record<string, BarRepeatStatus> = {
  [SerializedRepeatStatus.None]: BarRepeatStatus.None,
  [SerializedRepeatStatus.Start]: BarRepeatStatus.Start,
  [SerializedRepeatStatus.End]: BarRepeatStatus.End,
};

export const SERIALIZED_TECHNIQUE_TYPES: Record<
  GuitarTechniqueType,
  SerializedTechniqueType
> = {
  [GuitarTechniqueType.Bend]: SerializedTechniqueType.Bend,
  [GuitarTechniqueType.HammerOnOrPullOff]:
    SerializedTechniqueType.HammerOnOrPullOff,
  [GuitarTechniqueType.LetRing]: SerializedTechniqueType.LetRing,
  [GuitarTechniqueType.NaturalHarmonic]:
    SerializedTechniqueType.NaturalHarmonic,
  [GuitarTechniqueType.PalmMute]: SerializedTechniqueType.PalmMute,
  [GuitarTechniqueType.PinchHarmonic]: SerializedTechniqueType.PinchHarmonic,
  [GuitarTechniqueType.Slide]: SerializedTechniqueType.Slide,
  [GuitarTechniqueType.Vibrato]: SerializedTechniqueType.Vibrato,
};

const TECHNIQUE_BY_VALUE: Record<string, GuitarTechniqueType> = {
  [SerializedTechniqueType.Bend]: GuitarTechniqueType.Bend,
  [SerializedTechniqueType.HammerOnOrPullOff]:
    GuitarTechniqueType.HammerOnOrPullOff,
  [SerializedTechniqueType.LetRing]: GuitarTechniqueType.LetRing,
  [SerializedTechniqueType.NaturalHarmonic]:
    GuitarTechniqueType.NaturalHarmonic,
  [SerializedTechniqueType.PalmMute]: GuitarTechniqueType.PalmMute,
  [SerializedTechniqueType.PinchHarmonic]: GuitarTechniqueType.PinchHarmonic,
  [SerializedTechniqueType.Slide]: GuitarTechniqueType.Slide,
  [SerializedTechniqueType.Vibrato]: GuitarTechniqueType.Vibrato,
};

const BEND_TYPE_BY_VALUE: Record<string, BendType> = {
  [SerializedBendType.Bend]: BendType.Bend,
  [SerializedBendType.BendAndRelease]: BendType.BendAndRelease,
  [SerializedBendType.Hold]: BendType.Hold,
  [SerializedBendType.Prebend]: BendType.Prebend,
  [SerializedBendType.PrebendAndRelease]: BendType.PrebendAndRelease,
  [SerializedBendType.PrebendBend]: BendType.PrebendBend,
  [SerializedBendType.Release]: BendType.Release,
};

export const CLEF_TYPES = Object.values(ClefType);
export const INSTRUMENT_FAMILIES = Object.values(InstrumentFamily);
export const STRING_INSTRUMENT_TYPES = Object.values(StringInstrumentType);
export const STRING_TONES = [
  ...Object.values(AcousticGuitarTone),
  ...Object.values(ElectricGuitarTone),
  ...Object.values(BassGuitarTone),
  ...Object.values(OtherStringTone),
];

export function readNoteDuration(reader: SerializedValueReader): NoteDuration {
  return reader.readEnumValue(NOTE_DURATION_BY_VALUE);
}

export function readRepeatStatus(
  reader: SerializedValueReader
): BarRepeatStatus {
  return reader.readEnumValue(REPEAT_STATUS_BY_VALUE);
}

export function readTechniqueType(
  reader: SerializedValueReader
): GuitarTechniqueType {
  return reader.readEnumValue(TECHNIQUE_BY_VALUE);
}

export function readBendType(reader: SerializedValueReader): BendType {
  const string = reader.readString();
  const bendType = BEND_TYPE_BY_VALUE[string];
  if (bendType === undefined) {
    reader.fail(`unsupported value '${string}'`);
  }
  return bendType;
}

export function readNoteValue(reader: SerializedValueReader): NoteValue {
  const string = reader.readString();
  const noteValue = NOTES_ARR.find((candidate) => candidate === string);
  if (noteValue === undefined) {
    reader.fail(`unsupported value '${string}'`);
  }
  return noteValue;
}

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
