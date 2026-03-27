import { MusicInstrumentKind } from "./instrument-kind";

export enum StringMusicInstrumentType {
  AcousticGuitar = "Acoustic Guitar",
  ElectricGuitar = "Electric Guitar",
  BassGuitar = "Bass Guitar",
  Other = "Other",
}

export enum OrchestraMusicInstrumentType {
  Keyboard = "Keyboard",
}

export enum DrumMusicInstrumentType {
  Drums = "Drums",
}

export type MusicInstrumentType =
  | StringMusicInstrumentType
  | OrchestraMusicInstrumentType
  | DrumMusicInstrumentType;

export const INSTRUMENT_TYPES: Record<MusicInstrumentKind, MusicInstrumentType[]> = {
  [MusicInstrumentKind.String]: [
    StringMusicInstrumentType.AcousticGuitar,
    StringMusicInstrumentType.ElectricGuitar,
    StringMusicInstrumentType.BassGuitar,
    StringMusicInstrumentType.Other,
  ],
  [MusicInstrumentKind.Orchestra]: [OrchestraMusicInstrumentType.Keyboard],
  [MusicInstrumentKind.Drums]: [DrumMusicInstrumentType.Drums],
};
