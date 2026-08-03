import { Beat } from "../beat";
import { Note, NoteType } from "../note";
import { InstrumentFamily } from "./instrument-family";
import { InstrumentTone } from "./instrument-tone";
import { InstrumentType } from "./instrument-type";

/**
 * Interface for TabUI musical instruments
 */
export interface MusicInstrument {
  family: InstrumentFamily;
  /* Type of instrument */
  type: InstrumentType;
  /* MusicInstrument tone */
  tone: InstrumentTone;
  /* Name of the instrument */
  name: string;
  /* MIDI program or custom sound ID for playback */
  program: number;
  /** Describes the maximum amount of notes per beat */
  maxPolyphony: number;
  /** Tuning for instruments with tuning possibility */
  tuning?: NoteType[];

  /**
   * Creates a note
   * @param beat Parent beat
   * @param voiceIndex Voice index (string num for guitar)
   */
  createDefaultNote(beat: Beat, voiceIndex: number): Note;
}
