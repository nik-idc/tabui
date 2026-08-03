import { ClefType } from "../../clef-type";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  OtherStringTone,
} from "../../instrument/instrument-tone";
import { InstrumentFamily } from "../../instrument/instrument-family";
import { StringInstrumentType } from "../../instrument/instrument-type";
import { NoteValue } from "../../note";
import { TupletSettings } from "../../tuplet-settings";

export const SCORE_SERIALIZATION_FORMAT = "tabui-score" as const;
export const SCORE_SERIALIZATION_VERSION = 1 as const;

export enum SerializedNoteDuration {
  Whole = "whole",
  Half = "half",
  Quarter = "quarter",
  Eighth = "eighth",
  Sixteenth = "sixteenth",
  ThirtySecond = "thirty-second",
  SixtyFourth = "sixty-fourth",
}

export enum SerializedRepeatStatus {
  None = "none",
  Start = "start",
  End = "end",
}

export enum SerializedTechniqueType {
  Bend = "bend",
  HammerOnOrPullOff = "hammer-on-or-pull-off",
  LetRing = "let-ring",
  NaturalHarmonic = "natural-harmonic",
  PalmMute = "palm-mute",
  PinchHarmonic = "pinch-harmonic",
  Slide = "slide",
  Vibrato = "vibrato",
}

export enum SerializedBendType {
  Bend = "bend",
  BendAndRelease = "bend-and-release",
  Hold = "hold",
  Prebend = "prebend",
  PrebendAndRelease = "prebend-and-release",
  PrebendBend = "prebend-bend",
  Release = "release",
}

export type SerializedMasterBarCommon = {
  tempo: number;
  beatsCount: number;
  duration: SerializedNoteDuration;
};

export type SerializedRepeatEndMasterBar = SerializedMasterBarCommon & {
  repeatStatus: SerializedRepeatStatus.End;
  repeatCount: number;
};

export type SerializedNonRepeatEndMasterBar = SerializedMasterBarCommon & {
  repeatStatus: SerializedRepeatStatus.None | SerializedRepeatStatus.Start;
  repeatCount: null;
};

export type SerializedMasterBar =
  | SerializedRepeatEndMasterBar
  | SerializedNonRepeatEndMasterBar;

export type SerializedTuningNote = {
  noteValue: Exclude<NoteValue, NoteValue.None | NoteValue.Dead>;
  octave: number;
};

export type SerializedGuitarInstrumentCommon = {
  family: InstrumentFamily.Strings;
  name: string;
  program: number;
  stringsCount: number;
  fretsCount: number;
  tuning: SerializedTuningNote[];
};

export type SerializedAcousticGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: StringInstrumentType.AcousticGuitar;
    tone: AcousticGuitarTone;
  };

export type SerializedElectricGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: StringInstrumentType.ElectricGuitar;
    tone: ElectricGuitarTone;
  };

export type SerializedBassGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: StringInstrumentType.BassGuitar;
    tone: BassGuitarTone;
  };

export type SerializedOtherStringInstrument =
  SerializedGuitarInstrumentCommon & {
    type: StringInstrumentType.Other;
    tone: OtherStringTone;
  };

export type SerializedGuitarInstrument =
  | SerializedAcousticGuitarInstrument
  | SerializedElectricGuitarInstrument
  | SerializedBassGuitarInstrument
  | SerializedOtherStringInstrument;

export type SerializedBendTechniqueOptions = {
  type: SerializedBendType.Bend;
  bendPitch: number;
  bendDuration: number;
};

export type SerializedBendAndReleaseOptions = {
  type: SerializedBendType.BendAndRelease;
  bendPitch: number;
  releasePitch: number;
  bendDuration: number;
};

export type SerializedHoldBendOptions = {
  type: SerializedBendType.Hold;
  holdPitch: number;
  bendDuration: number;
};

export type SerializedPrebendOptions = {
  type: SerializedBendType.Prebend;
  prebendPitch: number;
};

export type SerializedPrebendAndReleaseOptions = {
  type: SerializedBendType.PrebendAndRelease;
  releasePitch: number;
  prebendPitch: number;
  bendDuration: number;
};

export type SerializedPrebendBendOptions = {
  type: SerializedBendType.PrebendBend;
  prebendPitch: number;
  bendPitch: number;
  bendDuration: number;
};

export type SerializedReleaseBendOptions = {
  type: SerializedBendType.Release;
  releasePitch: number;
  bendDuration: number;
};

export type SerializedBendOptions =
  | SerializedBendTechniqueOptions
  | SerializedBendAndReleaseOptions
  | SerializedHoldBendOptions
  | SerializedPrebendOptions
  | SerializedPrebendAndReleaseOptions
  | SerializedPrebendBendOptions
  | SerializedReleaseBendOptions;

export type SerializedBendTechnique = {
  type: SerializedTechniqueType.Bend;
  options: SerializedBendOptions;
};

export type SerializedNonBendTechnique = {
  type: Exclude<SerializedTechniqueType, SerializedTechniqueType.Bend>;
  options?: never;
};

export type SerializedGuitarTechnique =
  | SerializedBendTechnique
  | SerializedNonBendTechnique;

export type SerializedGuitarNote = {
  fret: number | null;
  techniques: SerializedGuitarTechnique[];
};

export type SerializedNoteSlot = SerializedGuitarNote | null;

export type SerializedBeat = {
  notes: SerializedNoteSlot[] | null;
  duration: SerializedNoteDuration;
  dots: number;
  tuplet: TupletSettings | null;
};

export type SerializedVoiceBar = {
  beats: SerializedBeat[];
};

export type SerializedVoiceSlot = SerializedVoiceBar | null;

export type SerializedVoiceSlots = [
  SerializedVoiceSlot,
  SerializedVoiceSlot,
  SerializedVoiceSlot,
  SerializedVoiceSlot,
];

export type SerializedBar = {
  voices: SerializedVoiceSlots;
};

export type SerializedStaff = {
  clefType: ClefType;
  showTablature: boolean;
  showClassicNotation: boolean;
  bars: SerializedBar[];
};

export type SerializedTrack = {
  instrument: SerializedGuitarInstrument;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  staves: SerializedStaff[];
};

export type SerializedScoreV1 = {
  format: typeof SCORE_SERIALIZATION_FORMAT;
  version: typeof SCORE_SERIALIZATION_VERSION;
  name: string;
  artist: string;
  song: string;
  masterVolume: number;
  masterPan: number;
  masterBars: SerializedMasterBar[];
  tracks: SerializedTrack[];
};
