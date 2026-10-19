import { Beat } from "../beat";
import { Note, NoteType } from "../note";
import { InstrumentFamily } from "./instrument-family";
import { InstrumentTone } from "./instrument-tone";
import { InstrumentType } from "./instrument-type";

/**
 * Interface for TabUI musical instruments
 */
export interface MusicInstrument {
  /** Instrument classification used to group types. */
  family: InstrumentFamily;
  /** Instrument type within its family. */
  type: InstrumentType;
  /** Playback timbre used to select samples or synthesized sound. */
  tone: InstrumentTone;
  /** Instrument display name. */
  name: string;
  /** Zero-based MIDI program; serialized guitars require 0–127 and a match with tone. */
  program: number;
  /** Number of note slots in a non-rest beat; one per string for guitars. */
  maxPolyphony: number;
  /** Live tuning pitches when applicable, in string-number order, first string first. */
  tuning?: NoteType[];

  /**
   * Creates a default note owned by the supplied beat; guitars return an empty slot with null fret.
   * @param beat Parent beat
   * @param voiceIndex Zero-based note-slot index (string number minus one for guitars), not a voice number.
   */
  createDefaultNote(beat: Beat, voiceIndex: number): Note;
}
