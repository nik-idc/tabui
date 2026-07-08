import { Beat } from "../../beat";
import { GuitarNote } from "../../guitar-note";
import { Note, NoteJSON, NoteType, NoteValue } from "../../note";
import { MusicInstrument, MusicInstrumentJSON } from "../instrument";
import { InstrumentFamily } from "../instrument-family";
import {
  ElectricGuitarTone,
  InstrumentTone,
  STRING_TONES,
  StringInstrumentTone,
} from "../instrument-tone";
import {
  INSTRUMENT_TYPES,
  InstrumentType,
  StringInstrumentType,
} from "../instrument-type";
import { TONE_TO_MIDI } from "../tone-to-midi";
import { DEFAULT_TUNINGS } from "./default-tunings";
import { parseTuning } from "./helpers";

/**
 * Guitar JSON format
 */
export interface GuitarJSON {
  family: InstrumentFamily;
  type: StringInstrumentType;
  tone: InstrumentTone;
  name: string;
  program: number;
  tuning: NoteType[];
  stringsCount: number;
  fretsCount: number;
}

/**
 * TabUI Guitar
 */
export class Guitar implements MusicInstrument {
  readonly family: InstrumentFamily = InstrumentFamily.Strings;

  /** Type of instrument */
  private _type: StringInstrumentType = StringInstrumentType.ElectricGuitar;
  /** MusicInstrument tone */
  private _tone: StringInstrumentTone = ElectricGuitarTone.Clean;
  /** Name of the instrument */
  private _name: string;
  /** MIDI program or custom sound ID for playback */
  private _program: number;
  /** String count. Default value is 6 */
  private _stringsCount: number = 6;
  /** Guitar tuning. IMPORTANT: the first element should be the first string tuning */
  private _tuning: NoteType[] = DEFAULT_TUNINGS[6].Standard;
  /** Frets count. Default value is 24 */
  private _fretsCount: number = 24;

  /**
   * TabUI Guitar
   * @param type Type of guitar
   * @param tone Guitar tone
   * @param name
   * @param stringsCount
   * @param tuning
   * @param fretsCount
   */
  constructor(
    type: StringInstrumentType = StringInstrumentType.ElectricGuitar,
    tone: StringInstrumentTone = ElectricGuitarTone.Clean,
    name: string = "Electric Guitar",
    stringsCount: number = 6,
    tuning: NoteType[] = DEFAULT_TUNINGS[6].Standard,
    fretsCount: number = 24
  ) {
    this._type = type;
    this._tone = tone;
    this._name = name;
    this._program = TONE_TO_MIDI[this._tone];

    this._stringsCount = stringsCount;
    this._tuning = tuning;
    this._fretsCount = fretsCount;
  }

  /**
   * Returns tuning as a string
   * @returns Tuning as a string
   */
  public getTuningStr(): string {
    const tuningStrArr = [];
    for (let i = 0; i < this._tuning.length; i++) {
      tuningStrArr.push(
        `
        ${i + 1}=${this._tuning[i].noteValue}
      `.trim()
      );

      if (i !== this._tuning.length - 1) {
        tuningStrArr.push(", ");
      }
    }

    return tuningStrArr.join("");
  }

  /**
   * Parses guitar into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): GuitarJSON {
    return {
      family: this.family,
      type: this._type,
      tone: this._tone,
      name: this._name,
      program: this._program,
      tuning: this._tuning,
      stringsCount: this._stringsCount,
      fretsCount: this._fretsCount,
    };
  }

  /**
   * Creates a note
   * @param voiceIndex Voice index
   */
  public createDefaultNote(beat: Beat<Guitar>, voiceIndex: number): GuitarNote {
    return new GuitarNote(beat, beat.trackContext, voiceIndex + 1, null);
  }

  /**
   * Validates that the passed object is a valid guitar serialization
   * @param obj Object to validate
   */
  static validateGuitarJSON(obj: Record<string, unknown>): GuitarJSON {
    const required = [
      "family",
      "type",
      "tone",
      "name",
      "program",
      "stringsCount",
      "tuning",
      "fretsCount",
    ];

    for (const key of required) {
      if (obj[key] === undefined) {
        throw new Error(`Missing property: ${key}`);
      }
    }

    const typeChecks: Record<string, string> = {
      family: "string",
      type: "string",
      tone: "string",
      name: "string",
      stringsCount: "number",
      tuning: "string",
      fretsCount: "number",
    };

    for (const [key, expected] of Object.entries(typeChecks)) {
      if (typeof obj[key] !== expected) {
        throw new Error(`Invalid ${key}: expected ${expected}`);
      }
    }

    if (
      !INSTRUMENT_TYPES[InstrumentFamily.Strings].includes(
        obj.type as StringInstrumentType
      )
    ) {
      throw new Error(`Invalid instrument type: ${obj.type}`);
    }

    if (
      !STRING_TONES[obj.type as StringInstrumentType].includes(
        obj.tone as InstrumentTone
      )
    ) {
      throw new Error(`Invalid tone: ${obj.tone}`);
    }

    const tuning = parseTuning(obj.tuning as string);

    return {
      family: obj.family as InstrumentFamily,
      type: obj.type as StringInstrumentType,
      tone: obj.tone as StringInstrumentTone,
      name: obj.name as string,
      program: obj.program as number,
      tuning: tuning,
      stringsCount: obj.stringsCount as number,
      fretsCount: obj.fretsCount as number,
    };
  }

  /** Type of instrument */
  public get type(): StringInstrumentType {
    return this._type;
  }

  /** MusicInstrument tone */
  public get tone(): StringInstrumentTone {
    return this._tone;
  }

  /** Name of the instrument */
  public get name(): string {
    return this._name;
  }

  /** MIDI program or custom sound ID for playback */
  public get program(): number {
    return this._program;
  }

  /** String count. Default value is 6 */
  public get stringsCount(): number {
    return this._stringsCount;
  }

  /** Describes the maximum amount of notes per beat. Same as string count */
  public get maxPolyphony(): number {
    return this._stringsCount;
  }

  /** Guitar tuning. IMPORTANT: the first element should be the first string tuning */
  public get tuning(): NoteType[] {
    return this._tuning;
  }

  /** Frets count. Default value is 24 */
  public get fretsCount(): number {
    return this._fretsCount;
  }
}
