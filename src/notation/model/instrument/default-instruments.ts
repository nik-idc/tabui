import { DEFAULT_TUNINGS } from "./guitar/default-tunings";
import { Guitar } from "./guitar/guitar";
import { MusicInstrument } from "./instrument";
import {
  AcousticGuitarTone,
  ElectricGuitarTone,
  BassGuitarTone,
  OtherStringTone,
} from "./instrument-tone";
import { StringInstrumentType } from "./instrument-type";

export const DEFAULT_ACOUSTIC_GUITARS: Record<
  AcousticGuitarTone,
  MusicInstrument
> = {
  [AcousticGuitarTone.Nylon]: new Guitar(
    StringInstrumentType.AcousticGuitar,
    AcousticGuitarTone.Nylon,
    "Default Nylon Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    18
  ),
  [AcousticGuitarTone.Steel]: new Guitar(
    StringInstrumentType.AcousticGuitar,
    AcousticGuitarTone.Steel,
    "Default Acoustic Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    18
  ),
};

export const DEFAULT_ELECTRIC_GUITARS: Record<
  ElectricGuitarTone,
  MusicInstrument
> = {
  [ElectricGuitarTone.Clean]: new Guitar(
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Clean,
    "Default Clean Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
  [ElectricGuitarTone.Overdrive]: new Guitar(
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Overdrive,
    "Default Overdrive Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
  [ElectricGuitarTone.Distortion]: new Guitar(
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Distortion,
    "Default Distortion Electirc Guitar",
    6,
    DEFAULT_TUNINGS[6].Standard,
    24
  ),
};

export const DEFAULT_BASS_GUITARS: Record<BassGuitarTone, MusicInstrument> = {
  [BassGuitarTone.Acoustic]: new Guitar(
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Acoustic,
    "Default Acoustic Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
  [BassGuitarTone.Clean]: new Guitar(
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Clean,
    "Default Clean Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
  [BassGuitarTone.Distortion]: new Guitar(
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Distortion,
    "Default Distortion Bass Guitar",
    4,
    DEFAULT_TUNINGS[4].BassStandard,
    24
  ),
};

export const DEFAULT_OTHER_STRING: Record<OtherStringTone, MusicInstrument> = {
  [OtherStringTone.Banjo]: new Guitar(
    StringInstrumentType.Other,
    OtherStringTone.Banjo,
    "Default Banjo",
    5,
    DEFAULT_TUNINGS[5].BanjoStandard,
    22
  ),
  [OtherStringTone.Ukulele]: new Guitar(
    StringInstrumentType.Other,
    OtherStringTone.Ukulele,
    "Default Ukulele",
    4,
    DEFAULT_TUNINGS[4].UkuleleStandard,
    15
  ),
};
