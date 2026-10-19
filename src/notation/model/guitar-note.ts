import { randomInt } from "../../shared";
import { Beat } from "./beat";
import { TrackContext } from "./track-context";
import { GuitarTechnique } from "./guitar-technique";
import { Guitar } from "./instrument/guitar";
import {
  NoteValue,
  Note,
  LOWEST_OCTAVE,
  HIGHEST_OCTAVE,
  getNoteFromSemitones,
  getSemitonesFromNote,
} from "./note";
import { GuitarTechniqueType } from "./technique-type";
import {
  BEND_TYPE_INCOMPATIBILITY,
  TRANSITIONAL_TECHNIQUES,
} from "./guitar-technique-lists";
import {
  guitarTechniquesIncompatible,
  guitarTechniqueTypesIncompatible,
  isBendValidForContinuation,
} from "./guitar-technique-validation";
import { BendTechniqueOptions } from "./bend-options";

/**
 * Class that represents a guitar note
 */
export class GuitarNote implements Note<Guitar> {
  /** Guitar note's unique identifier */
  readonly uuid: number;
  /** Beat in which the note lives */
  readonly beat: Beat<Guitar>;
  /** Track context */
  readonly trackContext: TrackContext<Guitar>;

  /** Note value */
  private _noteValue: NoteValue = NoteValue.None;
  /** Octave */
  private _octave: number | null = null;
  /** String number */
  private _stringNum: number = 1;
  /**  Fret number */
  private _fret: number | null = null;
  /** Techniques applied to the note */
  private _techniques: GuitarTechnique[];

  /**
   * Creates a guitar note and computes its pitch from the string tuning and fret.
   * @param beat Beat in which the note lives
   * @param trackContext Track context
   * @param stringNum One-based string number, matching tuning order.
   * @param fret Null for an empty slot, -1 for a dead note, or a fret number; values above the fretboard are clamped.
   * @param techniques Retained live array; an empty note cannot have techniques.
   * @throws If an empty note has techniques, tuning is missing/unpitched, or fret-to-pitch conversion fails.
   */
  constructor(
    beat: Beat<Guitar>,
    trackContext: TrackContext<Guitar>,
    stringNum: number,
    fret: number | null = null,
    techniques: GuitarTechnique[] = []
  ) {
    if (fret === null && techniques.length > 0) {
      throw new Error("Cannot apply techniques to an empty guitar note");
    }

    this.uuid = randomInt();
    this.beat = beat;
    this.trackContext = trackContext;

    this._stringNum = stringNum;
    this._techniques = techniques;
    this.fret = fret;

    this.calcNoteFromFret();
  }

  /**
   * Recomputes pitch from fret and string tuning; null and -1 frets become empty and dead notes.
   * @throws If string tuning is missing, its octave is null, or the resulting pitch is invalid or outside octaves 0–9.
   */
  public calcNoteFromFret(): void {
    if (this._fret === null) {
      this._noteValue = NoteValue.None;
      this._octave = null;
      return;
    }

    if (this._fret === -1) {
      this._noteValue = NoteValue.Dead;
      this._octave = null;
      return;
    }

    const openStringNote =
      this.trackContext.instrument.tuning[this._stringNum - 1];

    if (openStringNote.octave === null) {
      throw Error("Open string octave is null");
    }

    const totalSemitones =
      getSemitonesFromNote(openStringNote.noteValue, openStringNote.octave) +
      this._fret;
    const { noteValue, octave } = getNoteFromSemitones(totalSemitones);

    if (octave < LOWEST_OCTAVE || octave > HIGHEST_OCTAVE) {
      throw new Error("Octave out of range");
    }

    this._noteValue = noteValue;
    this._octave = octave;
  }

  /**
   * Computes fret from pitch and string tuning, clamping above the fretboard maximum without changing stored pitch.
   * Empty pitch clears techniques and sets a null fret; dead pitch sets fret -1.
   * @throws If playable pitch/tuning has a null octave, tuning is missing, or the calculated fret is below zero.
   */
  public calculateFretFromNote(): void {
    if (this._noteValue === NoteValue.None) {
      this._fret = null;
      this.clearTechniques();
      return;
    }

    if (this._noteValue === NoteValue.Dead) {
      this._fret = -1;
      return;
    }

    if (this._octave === null) {
      throw Error(
        "Note this._octave is null when note value is neither None nor Dead"
      );
    }

    const openString = this.trackContext.instrument.tuning[this._stringNum - 1];

    if (openString.octave === null) {
      throw Error("Open string this._octave is null");
    }

    const openTotal = getSemitonesFromNote(
      openString.noteValue,
      openString.octave
    );
    const targetTotal = getSemitonesFromNote(this._noteValue, this._octave);

    let fret = targetTotal - openTotal;
    if (fret < 0) {
      throw new Error("Calculated fret below valid range");
    }

    const maxFret = this.trackContext.instrument.fretsCount;

    // Clamp to the fretboard upper bound instead of wrapping around.
    if (fret > maxFret) {
      fret = maxFret;
    }

    this._fret = fret;
  }

  /**
   * Sets pitch data and recalculates fret; does not validate pitch membership or octave bounds.
   * @param newNoteValue - New note value
   * @param newOctave - New octave value
   * @throws If pitch-to-fret conversion fails because of missing tuning/octave or a negative fret.
   */
  public setNote(newNoteValue: NoteValue, newOctave: number | null): void {
    this._noteValue = newNoteValue;
    this._octave = newOctave;
    this.calculateFretFromNote();
  }

  /**
   * Returns pitch text with octave (for example A#2), "x" for a dead note, or empty text for an empty slot.
   */
  public getNoteStr(): string {
    switch (this._noteValue) {
      case NoteValue.None:
        return "";
      case NoteValue.Dead:
        return "x";
      default:
        return `${this._noteValue}${this._octave}`;
    }
  }

  /**
   * Returns the preceding same-string bend's terminal pitch in UI whole tones for a let-ring note.
   * Returns undefined without let-ring, a preceding note, or a supported terminal bend shape.
   */
  public getBendContinuationPitch(): number | undefined {
    if (!this.hasTechnique(GuitarTechniqueType.LetRing)) {
      return undefined;
    }
    const previousBeat = this.beat.voiceBar.bar.staff.getPrevBeat(this.beat);
    const previousNote = previousBeat?.notes?.find(
      (n) => n instanceof GuitarNote && n.stringNum === this.stringNum
    );
    if (!(previousNote instanceof GuitarNote)) {
      return undefined;
    }
    const previousBend = previousNote.techniques.find(
      (t) => t.type === GuitarTechniqueType.Bend
    );
    return previousBend?.bendOptions?.terminalPitch;
  }

  /**
   * Applies, updates, or removes a technique on this note.
   * Existing techniques toggle off, except bends with options, which update in place.
   * @returns True if changed; false if inapplicable, incompatible, or unchanged.
   * @throws If adding a bend without options or a non-bend with options. Transition lookup can also throw if this note's beat is a rest or an adjacent voice has no beats.
   */
  public setTechnique(
    type: GuitarTechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): boolean {
    const existingTechnique = this._techniques.find((t) => t.type === type);
    if (existingTechnique !== undefined) {
      if (
        existingTechnique.type === GuitarTechniqueType.Bend &&
        bendOptions !== null
      ) {
        if (!isBendValidForContinuation(this, bendOptions)) {
          return false;
        }
        const incompatibleTypes = BEND_TYPE_INCOMPATIBILITY[bendOptions.type];
        if (
          this._techniques.some(
            (t) => t !== existingTechnique && incompatibleTypes.includes(t.type)
          )
        ) {
          return false;
        }
        return existingTechnique.replaceBendOptions(bendOptions);
      }
      return this.removeTechnique(type);
    }

    return this.addTechnique(new GuitarTechnique(this, type, bendOptions));
  }

  /**
   * Adds an applicable, compatible technique without copying or rebinding it.
   * @param guitarTechnique Technique already owned by this note.
   * @returns True if added; false for invalid continuation or incompatible/inapplicable techniques.
   * @throws If transition lookup fails because this note's beat is a rest or an adjacent voice has no beats.
   */
  public addTechnique(guitarTechnique: GuitarTechnique): boolean {
    if (!this.isTechniqueApplicable(guitarTechnique.type)) {
      return false;
    }

    if (
      guitarTechnique.bendOptions !== null &&
      !isBendValidForContinuation(this, guitarTechnique.bendOptions)
    ) {
      return false;
    }

    if (
      this._techniques.some((technique) =>
        guitarTechniquesIncompatible(technique, guitarTechnique)
      )
    ) {
      return false;
    }

    this._techniques.push(guitarTechnique);
    return true;
  }

  /**
   * Removes technique from the note
   * @param type Technique type
   * @returns True if removed
   */
  public removeTechnique(type: GuitarTechniqueType): boolean {
    const techniqueIndex = this._techniques.findIndex((t) => t.type === type);
    if (techniqueIndex === -1) {
      return false;
    }

    this._techniques.splice(techniqueIndex, 1);
    return true;
  }

  /**
   * Remove all techniques
   */
  public clearTechniques(): void {
    this._techniques = [];
  }

  /**
   * Sorts the live technique array in descending technique-type order.
   */
  public sortTechniques(): void {
    this._techniques.sort((a, b) => b.type - a.type);
  }

  /**
   * Checks fret state, the immediate next beat's same-slot transition target, and existing technique compatibility.
   * @param type Technique type
   * @returns True if applicable, false otherwise
   * @throws If transition lookup fails because this note's beat is a rest or an adjacent voice has no beats.
   */
  public isTechniqueApplicable(type: GuitarTechniqueType): boolean {
    if (this._fret === null || this._fret === -1) {
      return false;
    }

    if (type === GuitarTechniqueType.Slide && this._fret === 0) {
      return false;
    }

    if (TRANSITIONAL_TECHNIQUES.has(type)) {
      const nextNote = this.beat.voiceBar.bar.staff.getNextNote(this);
      if (!(nextNote instanceof GuitarNote) || nextNote._fret === this._fret) {
        return false;
      }
    }

    return !this._techniques.some((technique) =>
      guitarTechniqueTypesIncompatible(technique.type, type)
    );
  }

  /**
   * Checks if the guitar note has a technique applied
   * @param type Technique type
   * @returns True if applied, false otherwise
   */
  public hasTechnique(type: GuitarTechniqueType): boolean {
    return this._techniques.some((ge) => ge.type === type);
  }

  /**
   * Compares pitch, octave, fret, and string number, ignoring UUID, ownership, and techniques.
   * @param otherNote Note to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherNote: GuitarNote): boolean {
    return (
      this._noteValue === otherNote._noteValue &&
      this._octave === otherNote._octave &&
      this._fret === otherNote._fret &&
      this._stringNum === otherNote._stringNum
    );
  }

  /**
   * Copies fret, string number, and techniques into the destination beat, recomputing pitch from its tuning.
   * @param beat Beat that will own the copied note
   * @returns Deep copy of the guitar note
   * @throws If destination tuning, copied fret/pitch, or technique data is invalid.
   */
  public deepCopy(beat: Beat<Guitar> = this.beat): GuitarNote {
    const note = new GuitarNote(
      beat,
      beat.trackContext,
      this._stringNum,
      this._fret
    );
    note._techniques = this._techniques.map((technique) =>
      technique.deepCopy(note)
    );

    return note;
  }

  /**
   * Stores pitch class and recalculates fret without validating pitch membership.
   * @throws If tuning/octave is missing or the calculated fret is negative.
   */
  public set noteValue(newNoteValue: NoteValue) {
    this._noteValue = newNoteValue;
    this.calculateFretFromNote();
  }
  /** Note value getter */
  public get noteValue(): NoteValue {
    return this._noteValue;
  }

  /**
   * Stores octave and recalculates fret without checking octave bounds.
   * @throws If playable pitch/tuning has no octave, tuning is missing, or the calculated fret is negative.
   */
  public set octave(newOctave: number | null) {
    this._octave = newOctave;
    this.calculateFretFromNote();
  }
  /** Octave getter */
  public get octave(): number | null {
    return this._octave;
  }

  /**
   * Sets fret and recomputes pitch, clamping above the fretboard maximum; null clears the note and its techniques.
   * @throws If tuning is missing/unpitched or the resulting pitch is invalid or outside supported octave bounds.
   */
  public set fret(newFret: number | null) {
    const fretsCount = this.trackContext.instrument.fretsCount;
    if (newFret !== null) {
      this._fret = Math.min(newFret, fretsCount);
    } else {
      this._fret = null;
      this.clearTechniques();
    }
    this.calcNoteFromFret();
  }
  /** Fret number, null for an empty slot, or -1 for a dead note. */
  public get fret(): number | null {
    return this._fret;
  }

  /** One-based string number in instrument tuning order. */
  public get stringNum(): number {
    return this._stringNum;
  }

  /** Live technique array; use technique methods to check applicability and compatibility. */
  public get techniques(): GuitarTechnique[] {
    return this._techniques;
  }
}
