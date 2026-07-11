import { InstrumentFamily } from "./instrument-family";

export enum StringInstrumentType {
  AcousticGuitar = "Acoustic Guitar",
  ElectricGuitar = "Electric Guitar",
  BassGuitar = "Bass Guitar",
  Other = "Other",
}

export enum OrchestraInstrumentType {
  Keyboard = "Keyboard",
}

export enum DrumInstrumentType {
  Drums = "Drums",
}

export type InstrumentType =
  | StringInstrumentType
  | OrchestraInstrumentType
  | DrumInstrumentType;

export const INSTRUMENT_TYPES: Record<InstrumentFamily, InstrumentType[]> = {
  [InstrumentFamily.Strings]: [
    StringInstrumentType.AcousticGuitar,
    StringInstrumentType.ElectricGuitar,
    StringInstrumentType.BassGuitar,
    StringInstrumentType.Other,
  ],
  [InstrumentFamily.Orchestra]: [OrchestraInstrumentType.Keyboard],
  [InstrumentFamily.Drums]: [DrumInstrumentType.Drums],
};

export function isStringInstrumentType(
  type: InstrumentType
): type is StringInstrumentType {
  return Object.values(StringInstrumentType).includes(
    type as StringInstrumentType
  );
}
