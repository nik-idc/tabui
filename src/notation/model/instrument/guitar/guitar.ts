import { Beat } from "../../beat";
import { GuitarNote } from "../../guitar-note";
import { NoteType } from "../../note";
import { MusicInstrument } from "../instrument";
import { InstrumentFamily } from "../instrument-family";
import { ElectricGuitarTone, StringInstrumentTone } from "../instrument-tone";
import { StringInstrumentType } from "../instrument-type";
import { TONE_TO_MIDI } from "../tone-to-midi";
import { DEFAULT_TUNINGS } from "./default-tunings";

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
   * Creates a string instrument using a supplied tuning or the first preset for its string count.
   * @param type Type of guitar
   * @param tone Guitar tone
   * @param name Display name, default "Electric Guitar".
   * @param stringsCount Number of strings, default 6; counts without a preset require explicit tuning.
   * @param tuning Retained live array in string-number order (first string first).
   * @param fretsCount Highest fret, default 24; not range-validated here.
   * @throws If no tuning is available or its length differs from the string count. Tuning pitches are not validated here.
   */
  constructor(
    type: StringInstrumentType = StringInstrumentType.ElectricGuitar,
    tone: StringInstrumentTone = ElectricGuitarTone.Clean,
    name: string = "Electric Guitar",
    stringsCount: number = 6,
    tuning?: NoteType[],
    fretsCount: number = 24
  ) {
    this._type = type;
    this._tone = tone;
    this._name = name;
    this._program = TONE_TO_MIDI[this._tone];

    const defaultTuning = Object.entries(DEFAULT_TUNINGS).find(
      ([count]) => Number(count) === stringsCount
    );
    const resolvedTuning =
      tuning ??
      (defaultTuning === undefined
        ? undefined
        : Object.values(defaultTuning[1])[0]);

    if (
      resolvedTuning === undefined ||
      resolvedTuning.length !== stringsCount
    ) {
      throw new Error("Guitar tuning length must match string count");
    }
    this._stringsCount = stringsCount;
    this._tuning = resolvedTuning;
    this._fretsCount = fretsCount;
  }

  /**
   * Returns numbered pitch classes in string order, such as "1=E, 2=B", without octaves.
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

  /** Returns space-separated pitch classes in reverse string-number order, without octaves. */
  public getTuningStrSimple(): string {
    return this._tuning
      .map((n) => n.noteValue)
      .reverse()
      .join(" ");
  }

  /**
   * Creates an empty guitar note, with null fret and octave, owned by the supplied beat.
   * @param beat Owning beat; its track context is used for the note.
   * @param voiceIndex Zero-based note-slot/string index; the resulting string number is index + 1.
   */
  public createDefaultNote(beat: Beat<Guitar>, voiceIndex: number): GuitarNote {
    return new GuitarNote(beat, beat.trackContext, voiceIndex + 1, null);
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

  /** Zero-based MIDI program selected from the instrument tone. */
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

  /** Live tuning array in one-based string order, first string first; copy before changing shared presets. */
  public get tuning(): NoteType[] {
    return this._tuning;
  }

  /** Frets count. Default value is 24 */
  public get fretsCount(): number {
    return this._fretsCount;
  }
}
