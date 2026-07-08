import { MusicInstrument } from "./instrument";
import { InstrumentType, StringInstrumentType } from "./instrument-type";

export enum AcousticGuitarTone {
  Nylon = "Nylon",
  Steel = "Steel",
}

export enum ElectricGuitarTone {
  Clean = "Electric Clean",
  Overdrive = "Electric Overdrive",
  Distortion = "Electric Distortion",
}

export enum BassGuitarTone {
  Acoustic = "Bass Acoustic",
  Clean = "Bass Clean",
  Distortion = "Bass Distortion",
}

export enum OtherStringTone {
  Banjo = "Banjo",
  Ukulele = "Ukulele",
}

export type StringInstrumentTone =
  | AcousticGuitarTone
  | ElectricGuitarTone
  | BassGuitarTone
  | OtherStringTone;

export type InstrumentTone = StringInstrumentTone;

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

export const INSTRUMENT_TONES: Partial<
  Record<InstrumentType, InstrumentTone[]>
> = {
  ...STRING_TONES,
};
