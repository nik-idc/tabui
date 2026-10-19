import { InstrumentFamily } from "./instrument-family";

/** String-instrument categories supported by the tablature model. */
export enum StringInstrumentType {
  AcousticGuitar = "Acoustic Guitar",
  ElectricGuitar = "Electric Guitar",
  BassGuitar = "Bass Guitar",
  Other = "Other",
}

/** Orchestra identifiers reserved for instrument classification; notation is not implemented. */
export enum OrchestraInstrumentType {
  Keyboard = "Keyboard",
}

/** Drum identifiers reserved for instrument classification; notation is not implemented. */
export enum DrumInstrumentType {
  Drums = "Drums",
}

/** Instrument category across string, orchestra, and drum families. */
export type InstrumentType =
  | StringInstrumentType
  | OrchestraInstrumentType
  | DrumInstrumentType;

/** Shared mutable instrument-type arrays keyed by instrument family. */
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

/** Returns true and narrows the type when it is a string-instrument category. */
export function isStringInstrumentType(
  type: InstrumentType
): type is StringInstrumentType {
  return Object.values(StringInstrumentType).includes(
    type as StringInstrumentType
  );
}
