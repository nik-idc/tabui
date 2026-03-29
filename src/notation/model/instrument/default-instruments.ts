import { DEFAULT_TUNINGS } from "./guitar/default-tunings";
import { Guitar } from "./guitar/guitar";
import { MusicInstrument } from "./instrument";
import {
  AcousticGuitarPreset,
  ElectricGuitarPreset,
  BassGuitarPreset,
  OtherStringPreset,
} from "./instrument-preset";
import { StringMusicInstrumentType } from "./instrument-type";

export const DEFAULT_ACOUSTIC_GUITARS: Record<
  AcousticGuitarPreset,
  MusicInstrument
> = {
  [AcousticGuitarPreset.Nylon]: new Guitar(
    StringMusicInstrumentType.AcousticGuitar,
    AcousticGuitarPreset.Nylon,
    "Default Nylon Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    18
  ),
  [AcousticGuitarPreset.Steel]: new Guitar(
    StringMusicInstrumentType.AcousticGuitar,
    AcousticGuitarPreset.Steel,
    "Default Acoustic Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    18
  ),
};

export const DEFAULT_ELECTRIC_GUITARS: Record<
  ElectricGuitarPreset,
  MusicInstrument
> = {
  [ElectricGuitarPreset.Clean]: new Guitar(
    StringMusicInstrumentType.ElectricGuitar,
    ElectricGuitarPreset.Clean,
    "Default Clean Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
  [ElectricGuitarPreset.Overdrive]: new Guitar(
    StringMusicInstrumentType.ElectricGuitar,
    ElectricGuitarPreset.Overdrive,
    "Default Overdrive Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
  [ElectricGuitarPreset.Distortion]: new Guitar(
    StringMusicInstrumentType.ElectricGuitar,
    ElectricGuitarPreset.Distortion,
    "Default Distortion Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
};

export const DEFAULT_BASS_GUITARS: Record<BassGuitarPreset, MusicInstrument> = {
  [BassGuitarPreset.Acoustic]: new Guitar(
    StringMusicInstrumentType.BassGuitar,
    BassGuitarPreset.Acoustic,
    "Default Acoustic Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
  [BassGuitarPreset.Clean]: new Guitar(
    StringMusicInstrumentType.BassGuitar,
    BassGuitarPreset.Clean,
    "Default Clean Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
  [BassGuitarPreset.Distortion]: new Guitar(
    StringMusicInstrumentType.BassGuitar,
    BassGuitarPreset.Distortion,
    "Default Distortion Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
};

export const DEFAULT_OTHER_STRING: Record<OtherStringPreset, MusicInstrument> =
  {
    [OtherStringPreset.Banjo]: new Guitar(
      StringMusicInstrumentType.Other,
      OtherStringPreset.Banjo,
      "Default Banjo",
      5,
      DEFAULT_TUNINGS[5].BanjoStandard,
      22
    ),
    [OtherStringPreset.Ukulele]: new Guitar(
      StringMusicInstrumentType.Other,
      OtherStringPreset.Ukulele,
      "Default Ukulele",
      4,
      DEFAULT_TUNINGS[4].UkuleleStandard,
      15
    ),
  };
