import { InstrumentType, StringInstrumentType } from "./instrument-type";

/** Acoustic-guitar playback tone identifiers. */
export enum AcousticGuitarTone {
  Nylon = "Nylon",
  Steel = "Steel",
}

/** Electric-guitar playback tone identifiers. */
export enum ElectricGuitarTone {
  Clean = "Electric Clean",
  Overdrive = "Electric Overdrive",
  Distortion = "Electric Distortion",
}

/** Bass-guitar playback tone identifiers. */
export enum BassGuitarTone {
  Acoustic = "Bass Acoustic",
  Clean = "Bass Clean",
  Distortion = "Bass Distortion",
}

/** Playback tones for other supported string instruments. */
export enum OtherStringTone {
  Banjo = "Banjo",
  Ukulele = "Ukulele",
}

/** Playback tone identifiers available to string instruments. */
export type StringInstrumentTone =
  | AcousticGuitarTone
  | ElectricGuitarTone
  | BassGuitarTone
  | OtherStringTone;

/** Supported playback tone identifiers, currently limited to string instruments. */
export type InstrumentTone = StringInstrumentTone;

/** Shared mutable tone arrays keyed by string-instrument type. */
export const STRING_TONES: Record<
  StringInstrumentType,
  StringInstrumentTone[]
> = {
  [StringInstrumentType.AcousticGuitar]: [
    AcousticGuitarTone.Nylon,
    AcousticGuitarTone.Steel,
  ],
  [StringInstrumentType.BassGuitar]: [
    BassGuitarTone.Acoustic,
    BassGuitarTone.Clean,
    BassGuitarTone.Distortion,
  ],
  [StringInstrumentType.ElectricGuitar]: [
    ElectricGuitarTone.Clean,
    ElectricGuitarTone.Overdrive,
    ElectricGuitarTone.Distortion,
  ],
  [StringInstrumentType.Other]: [
    OtherStringTone.Banjo,
    OtherStringTone.Ukulele,
  ],
} as const;

/** Tone lookup by instrument type; arrays are shared with STRING_TONES. */
export const INSTRUMENT_TONES: Partial<
  Record<InstrumentType, InstrumentTone[]>
> = {
  ...STRING_TONES,
};
