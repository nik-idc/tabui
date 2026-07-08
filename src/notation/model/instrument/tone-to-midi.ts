import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  InstrumentTone,
  OtherStringTone,
} from "./instrument-tone";

export const TONE_TO_MIDI: Record<InstrumentTone, number> = {
  [AcousticGuitarTone.Steel]: 25,
  [AcousticGuitarTone.Nylon]: 24,
  [ElectricGuitarTone.Clean]: 27,
  [ElectricGuitarTone.Overdrive]: 29,
  [ElectricGuitarTone.Distortion]: 30,
  [BassGuitarTone.Acoustic]: 32,
  [BassGuitarTone.Clean]: 33,
  [BassGuitarTone.Distortion]: 36,
  [OtherStringTone.Ukulele]: 24, // Kinda wonky, but will do for now
  [OtherStringTone.Banjo]: 25, // Kinda wonky, but will do for now
} as const;
