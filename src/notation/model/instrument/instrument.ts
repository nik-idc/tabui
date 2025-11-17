import { Note } from "../note/note";
import { MusicInstrumentKind } from "./instrument-kind";
import { MusicInstrumentPreset } from "./instrument-preset";
import { MusicInstrumentType } from "./instrument-type";

export interface MusicInstrumentJSON {
  kind: MusicInstrumentKind;
  type: MusicInstrumentType;
  preset: MusicInstrumentPreset;
  name: string;
  program: number;
  tuning: Note[];
}

/**
 * Interface for TabUI musical instruments
 */
export interface MusicInstrument {
  /* Kind of instrument (String | Orchestra | Drum) */
  kind: MusicInstrumentKind;
  /* Type of instrument */
  type: MusicInstrumentType;
  /* MusicInstrument preset */
  preset: MusicInstrumentPreset;
  /* Name of the instrument */
  name: string;
  /* MIDI program or custom sound ID for playback */
  program: number;
  /** Tuning for instruments with tuning possibility */
  tuning?: Note[];

  /**
   * Serialize the instrument
   */
  toJSON(): MusicInstrumentJSON;
}
