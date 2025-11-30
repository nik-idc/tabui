import { Beat } from "../beat";
import { Note, NoteJSON, NoteType } from "../note";
import { MusicInstrumentKind } from "./instrument-kind";
import { MusicInstrumentPreset } from "./instrument-preset";
import { MusicInstrumentType } from "./instrument-type";

export interface MusicInstrumentJSON {
  kind: MusicInstrumentKind;
  type: MusicInstrumentType;
  preset: MusicInstrumentPreset;
  name: string;
  program: number;
  tuning: NoteType[];
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
  /** Describes the maximum amount of notes per beat */
  maxPolyphony: number;
  /** Tuning for instruments with tuning possibility */
  tuning?: NoteType[];

  /**
   * Serialize the instrument
   */
  toJSON(): MusicInstrumentJSON;
  /**
   * Creates a note
   * @param beat Parent beat
   * @param voiceIndex Voice index (string num for guitar)
   */
  createDefaultNote(beat: Beat, voiceIndex: number): Note;
}
