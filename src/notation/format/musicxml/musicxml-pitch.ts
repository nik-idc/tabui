import {
  SerializedPlayableNoteValue,
  SerializedTuningNote,
} from "../tabui/v1/schema";

/** Note names by pitch class, from C, spelled with sharps. */
const PITCH_CLASSES: readonly SerializedPlayableNoteValue[] = [
  SerializedPlayableNoteValue.C,
  SerializedPlayableNoteValue.CSharp,
  SerializedPlayableNoteValue.D,
  SerializedPlayableNoteValue.DSharp,
  SerializedPlayableNoteValue.E,
  SerializedPlayableNoteValue.F,
  SerializedPlayableNoteValue.FSharp,
  SerializedPlayableNoteValue.G,
  SerializedPlayableNoteValue.GSharp,
  SerializedPlayableNoteValue.A,
  SerializedPlayableNoteValue.ASharp,
  SerializedPlayableNoteValue.B,
];

/** Semitones above C for each MusicXML step. */
const STEP_SEMITONES = new Map<string, number>([
  ["C", 0],
  ["D", 2],
  ["E", 4],
  ["F", 5],
  ["G", 7],
  ["A", 9],
  ["B", 11],
]);

/** A MusicXML pitch: step letter, alter in semitones, and octave. */
export type MusicXmlPitch = {
  step: string;
  alter: number;
  octave: number;
};

/** Returns the MIDI note number of a tuning note (C4 is 60). */
export function tuningNoteToMidi(note: SerializedTuningNote): number {
  return 12 * (note.octave + 1) + PITCH_CLASSES.indexOf(note.noteValue);
}

/** Returns the tuning note of a MIDI note number, spelled with sharps. */
export function midiToTuningNote(midi: number): SerializedTuningNote {
  const pitchClass = ((midi % 12) + 12) % 12;
  return {
    noteValue: PITCH_CLASSES[pitchClass],
    octave: Math.floor(midi / 12) - 1,
  };
}

/** Returns the MusicXML pitch of a MIDI note number, spelled with sharps. */
export function midiToPitch(midi: number): MusicXmlPitch {
  const note = midiToTuningNote(midi);
  return {
    step: note.noteValue[0],
    alter: note.noteValue.length > 1 ? 1 : 0,
    octave: note.octave,
  };
}

/**
 * Returns the MIDI note number of a MusicXML pitch, or undefined for an
 * unknown step. Microtonal alters are rounded.
 */
export function pitchToMidi(pitch: MusicXmlPitch): number | undefined {
  const semitones = STEP_SEMITONES.get(pitch.step);
  if (semitones === undefined) {
    return undefined;
  }
  return 12 * (pitch.octave + 1) + semitones + Math.round(pitch.alter);
}
