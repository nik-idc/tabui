import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { Guitar } from "../instrument/guitar/guitar";
import { NoteValue, NoteType } from "../note";
import { Score } from "../score";
import { Track } from "../track";
import {
  deserializeClipboardBeats,
  serializeClipboardBeat,
} from "./v1/voice-bar-serialization";
import { ScoreSerializationError } from "./serialization-error";
import { SerializedValueReader } from "./serialized-value-reader";

const CLIPBOARD_FORMAT = "tabui-clipboard";
const CLIPBOARD_VERSION = 1;
const MAX_CLIPBOARD_LENGTH = 1_000_000;
const MAX_CLIPBOARD_BEATS = 10_000;

/** Serializes a fret value for transfer between editors and applications. */
export function serializeClipboardNote(note: GuitarNote): string {
  return JSON.stringify({
    format: CLIPBOARD_FORMAT,
    version: CLIPBOARD_VERSION,
    kind: "note",
    fret: note.fret,
  });
}

/** Saves a flat beat stream, including marks whose validity depends on the destination. */
export function serializeClipboardBeats(
  beats: Beat<Guitar>[]
): string | undefined {
  if (beats.length === 0) {
    return undefined;
  }
  const instrument = beats[0].trackContext.instrument;
  return JSON.stringify({
    format: CLIPBOARD_FORMAT,
    version: CLIPBOARD_VERSION,
    kind: "beats",
    source: {
      fretsCount: instrument.fretsCount,
      tuning: instrument.tuning,
    },
    beats: beats.map((b, i) =>
      serializeClipboardBeat(b, `$.beats[${i}]`, b.voiceBar)
    ),
  });
}

/** Rejects unrelated or invalid text before creating any destination edit. */
export function deserializeClipboard(
  text: string
): Pick<GuitarNote, "fret"> | Beat<Guitar>[] | undefined {
  if (text.length > MAX_CLIPBOARD_LENGTH) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(text);
    return readClipboard(SerializedValueReader.root(value));
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof ScoreSerializationError
    ) {
      return undefined;
    }
    throw error;
  }
}

/** Reads pitch data while preserving the null octave of dead and empty notes. */
function readPitch(reader: SerializedValueReader): NoteType {
  const noteValue = reader
    .property("noteValue")
    .readEnumMember(Object.values(NoteValue));
  const octaveReader = reader.property("octave");
  const unpitched =
    noteValue === NoteValue.None || noteValue === NoteValue.Dead;
  if (unpitched) {
    if (octaveReader.rawValue() !== null) {
      octaveReader.fail("expected null octave for an unpitched note");
    }
    return { noteValue, octave: null };
  }
  return { noteValue, octave: octaveReader.readIntegerInRange(0, 9) };
}

function readClipboard(
  reader: SerializedValueReader
): Pick<GuitarNote, "fret"> | Beat<Guitar>[] {
  reader.readObject();
  reader.property("format").readEnumMember([CLIPBOARD_FORMAT]);
  if (reader.property("version").readInteger() !== CLIPBOARD_VERSION) {
    reader.property("version").fail("unsupported clipboard version");
  }
  const kind = reader.property("kind").readEnumMember(["note", "beats"]);
  if (kind === "note") {
    reader.expectKeys(["format", "version", "kind", "fret"]);
    const fretReader = reader.property("fret");
    return {
      fret:
        fretReader.rawValue() === null
          ? null
          : fretReader.readIntegerInRange(-1, 1000),
    };
  }

  reader.expectKeys(["format", "version", "kind", "source", "beats"]);
  const source = reader.property("source");
  source.readObject(["fretsCount", "tuning"]);
  const fretsCount = source.property("fretsCount").readIntegerInRange(0, 1000);
  const tuningReader = source.property("tuning");
  const tuningEntries = tuningReader.readArray();
  if (tuningEntries.length < 1 || tuningEntries.length > 32) {
    tuningReader.fail("expected between 1 and 32 strings");
  }
  const tuning = tuningEntries.map((r) => {
    r.readObject(["noteValue", "octave"]);
    const pitch = readPitch(r);
    if (pitch.octave === null) {
      r.fail("tuning must contain playable pitches");
    }
    return pitch;
  });
  const beatsReader = reader.property("beats");
  const beats = beatsReader.readArray();
  if (beats.length < 1 || beats.length > MAX_CLIPBOARD_BEATS) {
    beatsReader.fail(`expected between 1 and ${MAX_CLIPBOARD_BEATS} beats`);
  }

  // Rebuild source ownership. The normal paste engine handles destination strings and frets.
  const instrument = new Guitar(
    undefined,
    undefined,
    undefined,
    tuning.length,
    tuning,
    fretsCount
  );
  const score = new Score();
  const track = new Track(score, instrument, "Clipboard");
  score.tracks[0] = track;
  const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Missing clipboard voice bar");
  }
  return deserializeClipboardBeats(beatsReader, voiceBar);
}
