import { MusicInstrument } from "./instrument";
import { StringMusicInstrumentType } from "./instrument-type";

export enum AcousticGuitarPreset {
  Nylon = "Nylon",
  Steel = "Steel",
}

export enum ElectricGuitarPreset {
  Clean = "Electric Clean",
  Overdrive = "Electric Overdrive",
  Distortion = "Electric Distortion",
}

export enum BassGuitarPreset {
  Acoustic = "Bass Acoustic",
  Clean = "Bass Clean",
  Distortion = "Bass Distortion",
}

export enum OtherStringPreset {
  Banjo = "Banjo",
  Ukulele = "Ukulele",
}

export type StringMusicInstrumentPreset =
  | AcousticGuitarPreset
  | ElectricGuitarPreset
  | BassGuitarPreset
  | OtherStringPreset;

export type MusicInstrumentPreset = StringMusicInstrumentPreset;

export const STRING_PRESETS: Record<
  StringMusicInstrumentType,
  StringMusicInstrumentPreset[]
> = {
  [StringMusicInstrumentType.AcousticGuitar]: [
    AcousticGuitarPreset.Nylon,
    AcousticGuitarPreset.Steel,
  ],
  [StringMusicInstrumentType.BassGuitar]: [
    BassGuitarPreset.Acoustic,
    BassGuitarPreset.Clean,
    BassGuitarPreset.Distortion,
  ],
  [StringMusicInstrumentType.ElectricGuitar]: [
    ElectricGuitarPreset.Clean,
    ElectricGuitarPreset.Overdrive,
    ElectricGuitarPreset.Distortion,
  ],
  [StringMusicInstrumentType.Other]: [
    OtherStringPreset.Banjo,
    OtherStringPreset.Ukulele,
  ],
} as const;
