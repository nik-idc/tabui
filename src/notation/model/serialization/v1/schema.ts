/** Identifies TabUI score payloads independently of their schema version. */
export const SCORE_SERIALIZATION_FORMAT = "tabui-score" as const;

/** Selects the first version of the serialized score contract. */
export const SCORE_SERIALIZATION_VERSION = 1 as const;

/**
 * Wire tokens for note lengths, frozen independently from the model enum.
 */
export enum SerializedNoteDuration {
  Whole = "whole",
  Half = "half",
  Quarter = "quarter",
  Eighth = "eighth",
  Sixteenth = "sixteenth",
  ThirtySecond = "thirty-second",
  SixtyFourth = "sixty-fourth",
}

/**
 * Wire tokens that discriminate guitar techniques in V1 payloads, independent
 * from the model enum.
 */
export enum SerializedTechniqueType {
  Bend = "bend",
  HammerOnOrPullOff = "hammer-on-or-pull-off",
  LetRing = "let-ring",
  Tie = "tie",
  NaturalHarmonic = "natural-harmonic",
  PalmMute = "palm-mute",
  PinchHarmonic = "pinch-harmonic",
  Slide = "slide",
  Vibrato = "vibrato",
}

/**
 * Wire tokens that discriminate bend option shapes, frozen independently from
 * the model enum.
 */
export enum SerializedBendType {
  Bend = "bend",
  BendAndRelease = "bend-and-release",
  Hold = "hold",
  Prebend = "prebend",
  PrebendAndRelease = "prebend-and-release",
  PrebendBend = "prebend-bend",
  Release = "release",
}

/** Wire tokens for staff clefs, frozen independently from the model enum. */
export enum SerializedClefType {
  Treble = "Treble",
  Bass = "Bass",
  Alto = "Alto",
  Tenor = "Tenor",
  Percussion = "Percussion",
  Tab = "Tab",
}

/** Wire tokens for instrument families, independent from the model enum. */
export enum SerializedInstrumentFamily {
  Strings = "Strings",
}

/**
 * Wire tokens that discriminate string instrument shapes, independent from the
 * model enum.
 */
export enum SerializedStringInstrumentType {
  AcousticGuitar = "Acoustic Guitar",
  ElectricGuitar = "Electric Guitar",
  BassGuitar = "Bass Guitar",
  Other = "Other",
}

/** Wire tokens for string timbres, independent from the model enum. */
export enum SerializedStringInstrumentTone {
  Nylon = "Nylon",
  Steel = "Steel",
  ElectricClean = "Electric Clean",
  ElectricOverdrive = "Electric Overdrive",
  ElectricDistortion = "Electric Distortion",
  BassAcoustic = "Bass Acoustic",
  BassClean = "Bass Clean",
  BassDistortion = "Bass Distortion",
  Banjo = "Banjo",
  Ukulele = "Ukulele",
}

/** Wire tokens for chromatic tuning pitches, independent from the model enum. */
export enum SerializedPlayableNoteValue {
  A = "A",
  ASharp = "A#",
  B = "B",
  C = "C",
  CSharp = "C#",
  D = "D",
  DSharp = "D#",
  E = "E",
  F = "F",
  FSharp = "F#",
  G = "G",
  GSharp = "G#",
}

/** Shared meter and tempo: integer quarter-note BPM 1–999, numerator 1–32, and written denominator unit. */
export type SerializedMasterBarCommon = {
  tempo: number;
  beatsCount: number;
  duration: SerializedNoteDuration;
};

/** Repeat boundaries; repeatCount is total section plays (integer 2–32) at an end, and null otherwise. */
export type SerializedMasterBar = SerializedMasterBarCommon & {
  isRepeatStart: boolean;
  isRepeatEnd: boolean;
  repeatCount: number | null;
};

/** Playable tuning pitch with integer scientific octave 0–9; dead and empty notes are not allowed. */
export type SerializedTuningNote = {
  noteValue: SerializedPlayableNoteValue;
  octave: number;
};

/** String-instrument data: positive safe-integer string count, non-negative safe-integer fret count, and one tuning pitch per string in string-number order. Program is a zero-based MIDI value 0–127 matching the tone. */
export type SerializedGuitarInstrumentCommon = {
  family: SerializedInstrumentFamily.Strings;
  name: string;
  program: number;
  stringsCount: number;
  fretsCount: number;
  tuning: SerializedTuningNote[];
};

/** Acoustic-guitar shape restricted to acoustic tone tokens. */
export type SerializedAcousticGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: SerializedStringInstrumentType.AcousticGuitar;
    tone:
      | SerializedStringInstrumentTone.Nylon
      | SerializedStringInstrumentTone.Steel;
  };

/** Electric-guitar shape restricted to electric tone tokens. */
export type SerializedElectricGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: SerializedStringInstrumentType.ElectricGuitar;
    tone:
      | SerializedStringInstrumentTone.ElectricClean
      | SerializedStringInstrumentTone.ElectricOverdrive
      | SerializedStringInstrumentTone.ElectricDistortion;
  };

/** Bass-guitar shape restricted to bass tone tokens. */
export type SerializedBassGuitarInstrument =
  SerializedGuitarInstrumentCommon & {
    type: SerializedStringInstrumentType.BassGuitar;
    tone:
      | SerializedStringInstrumentTone.BassAcoustic
      | SerializedStringInstrumentTone.BassClean
      | SerializedStringInstrumentTone.BassDistortion;
  };

/** Other string-instrument shape restricted to supported fretted tones. */
export type SerializedOtherStringInstrument =
  SerializedGuitarInstrumentCommon & {
    type: SerializedStringInstrumentType.Other;
    tone:
      | SerializedStringInstrumentTone.Banjo
      | SerializedStringInstrumentTone.Ukulele;
  };

/** String-instrument union discriminated by `type`. */
export type SerializedGuitarInstrument =
  | SerializedAcousticGuitarInstrument
  | SerializedElectricGuitarInstrument
  | SerializedBassGuitarInstrument
  | SerializedOtherStringInstrument;

/** Options for a bend from the current pitch to `bendPitch`. */
export type SerializedBendTechniqueOptions = {
  type: SerializedBendType.Bend;
  bendPitch: number;
  bendDuration: number;
};

/** Options for a bend followed by a release to a specified pitch. */
export type SerializedBendAndReleaseOptions = {
  type: SerializedBendType.BendAndRelease;
  bendPitch: number;
  releasePitch: number;
  bendDuration: number;
};

/** Options for holding a bend at `holdPitch`. */
export type SerializedHoldBendOptions = {
  type: SerializedBendType.Hold;
  holdPitch: number;
  bendDuration: number;
};

/** Options for beginning a note already bent to `prebendPitch`. */
export type SerializedPrebendOptions = {
  type: SerializedBendType.Prebend;
  prebendPitch: number;
};

/** Options for beginning prebent and then releasing to a specified pitch. */
export type SerializedPrebendAndReleaseOptions = {
  type: SerializedBendType.PrebendAndRelease;
  releasePitch: number;
  prebendPitch: number;
  bendDuration: number;
};

/** Options for beginning prebent and continuing to `bendPitch`. */
export type SerializedPrebendBendOptions = {
  type: SerializedBendType.PrebendBend;
  prebendPitch: number;
  bendPitch: number;
  bendDuration: number;
};

/** Options for releasing an existing bend to `releasePitch`. */
export type SerializedReleaseBendOptions = {
  type: SerializedBendType.Release;
  releasePitch: number;
  bendDuration: number;
};

/** Bend parameters selected by type, with finite pitch values in 0–3 and bendDuration as a fraction in (0, 1]. Pitch values are stored unchanged; UI and playback currently use different units. */
export type SerializedBendOptions =
  | SerializedBendTechniqueOptions
  | SerializedBendAndReleaseOptions
  | SerializedHoldBendOptions
  | SerializedPrebendOptions
  | SerializedPrebendAndReleaseOptions
  | SerializedPrebendBendOptions
  | SerializedReleaseBendOptions;

/** Bend technique shape carrying its discriminated bend parameters. */
export type SerializedBendTechnique = {
  type: SerializedTechniqueType.Bend;
  options: SerializedBendOptions;
};

/** Non-bend technique shape, which cannot carry an `options` field. */
export type SerializedNonBendTechnique = {
  type: Exclude<SerializedTechniqueType, SerializedTechniqueType.Bend>;
  options?: never;
};

/** Guitar-technique union discriminated by the technique `type` token. */
export type SerializedGuitarTechnique =
  | SerializedBendTechnique
  | SerializedNonBendTechnique;

/** A playable/dead note, or an empty Let Ring slot with a null fret. Techniques must be unique and compatible. */
export type SerializedGuitarNote = {
  fret: number | null;
  techniques: SerializedGuitarTechnique[];
};

/** Sparse string position; `null` means no note on that string. */
export type SerializedNoteSlot = SerializedGuitarNote | null;

/**
 * A rhythmic beat; `notes: null` encodes a rest, while note arrays retain
 * sparse string slots.
 * A note array must match the instrument string count; dots are 0, 1, or 2.
 */
export type SerializedBeat = {
  notes: SerializedNoteSlot[] | null;
  duration: SerializedNoteDuration;
  dots: number;
  tuplet: SerializedTuplet | null;
};

/** A ratio where normalCount notes occupy tupletCount written units (3:2 for triplets); both are integers in 1–256. */
export type SerializedTuplet = {
  normalCount: number;
  tupletCount: number;
};

/** One voice's ordered beats within a bar; at least one beat is required. */
export type SerializedVoiceBar = {
  beats: SerializedBeat[];
};

/** Sparse voice position; `null` means that voice is absent from the bar. */
export type SerializedVoiceSlot = SerializedVoiceBar | null;

/** Fixed four-position tuple preserving sparse voice slots 1 through 4. */
export type SerializedVoiceSlots = [
  SerializedVoiceSlot,
  SerializedVoiceSlot,
  SerializedVoiceSlot,
  SerializedVoiceSlot,
];

/** Four sparse voice positions; at least one voice must be present and each present voice must contain beats. Use null for absent voices. */
export type SerializedBar = {
  voices: SerializedVoiceSlots;
};

/** Staff display settings and one bar per score master bar, in the same order; standard notation is not implemented. */
export type SerializedStaff = {
  clefType: SerializedClefType;
  showTablature: boolean;
  showClassicNotation: boolean;
  bars: SerializedBar[];
};

/** Instrument, finite linear volume 0–1, pan -1 (left) to 1 (right), and at least one staff. Muted tracks are silent; when any track is soloed, only unmuted soloed tracks are audible. */
export type SerializedTrack = {
  instrument: SerializedGuitarInstrument;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  staves: SerializedStaff[];
};

/**
 * Root V1 wire contract, branded by fixed format and version literals and
 * containing score metadata, master bars, and tracks.
 * Master gain is finite in 0–1 and pan in -1–1; at least one master bar and track are required.
 */
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
