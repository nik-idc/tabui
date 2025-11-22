import { Note, NoteJSON, NoteType, NoteValue } from "../../note";
import { MusicInstrument, MusicInstrumentJSON } from "../instrument";
import { MusicInstrumentKind } from "../instrument-kind";
import {
  ElectricGuitarPreset,
  MusicInstrumentPreset,
  STRING_PRESETS,
  StringMusicInstrumentPreset,
} from "../instrument-preset";
import {
  INSTRUMENT_TYPES,
  MusicInstrumentType,
  StringMusicInstrumentType,
} from "../instrument-type";
import { PRESET_TO_MIDI } from "../preset-to-midi";
import { DEFAULT_TUNINGS } from "./default-tunings";
import { parseTuning } from "./helpers";

/**
 * Guitar JSON format
 */
export interface GuitarJSON {
  kind: MusicInstrumentKind;
  type: StringMusicInstrumentType;
  preset: MusicInstrumentPreset;
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
  /** Kind of instrument (String | Orchestra | Drum) */
  readonly kind: MusicInstrumentKind = MusicInstrumentKind.String;

  /** Type of instrument */
  private _type: StringMusicInstrumentType =
    StringMusicInstrumentType.ElectricGuitar;
  /** MusicInstrument preset */
  private _preset: StringMusicInstrumentPreset = ElectricGuitarPreset.Clean;
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
   * @param preset Guitar preset
   * @param name
   * @param stringsCount
   * @param tuning
   * @param fretsCount
   */
  constructor(
    type: StringMusicInstrumentType = StringMusicInstrumentType.ElectricGuitar,
    preset: StringMusicInstrumentPreset = ElectricGuitarPreset.Clean,
    name: string = "Electric Guitar",
    stringsCount: number = 6,
    tuning: NoteType[] = DEFAULT_TUNINGS[6].Standard,
    fretsCount: number = 24
  ) {
    this._type = type;
    this._preset = preset;
    this._name = name;
    this._program = PRESET_TO_MIDI[this._preset];

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
      kind: this.kind,
      type: this._type,
      preset: this._preset,
      name: this._name,
      program: this._program,
      tuning: this._tuning,
      stringsCount: this._stringsCount,
      fretsCount: this._fretsCount,
    };
  }

  /**
   * Validates that the passed object is a valid guitar serialization
   * @param obj Object to validate
   */
  static validateGuitarJSON(obj: Record<string, unknown>): GuitarJSON {
    const required = [
      "kind",
      "type",
      "preset",
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
      kind: "string",
      type: "string",
      preset: "string",
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
      !INSTRUMENT_TYPES[MusicInstrumentKind.String].includes(
        obj.type as StringMusicInstrumentType
      )
    ) {
      throw new Error(`Invalid instrument type: ${obj.type}`);
    }

    if (
      !STRING_PRESETS[obj.type as StringMusicInstrumentType].includes(
        obj.preset as MusicInstrumentPreset
      )
    ) {
      throw new Error(`Invalid preset: ${obj.preset}`);
    }

    const tuning = parseTuning(obj.tuning as string);

    return {
      kind: obj.kind as MusicInstrumentKind,
      type: obj.type as StringMusicInstrumentType,
      preset: obj.preset as StringMusicInstrumentPreset,
      name: obj.name as string,
      program: obj.program as number,
      tuning: tuning,
      stringsCount: obj.stringsCount as number,
      fretsCount: obj.fretsCount as number,
    };
  }

  /** Type of instrument */
  public get type(): StringMusicInstrumentType {
    return this._type;
  }

  /** MusicInstrument preset */
  public get preset(): StringMusicInstrumentPreset {
    return this._preset;
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
