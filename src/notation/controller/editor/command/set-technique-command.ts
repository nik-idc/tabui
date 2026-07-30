import {
  ScoreEditor,
  Technique,
  BendTechniqueOptions,
  Note,
  TechniqueType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set technique for notes command
 */
export class SetTechniqueCommand implements Command {
  /** Notes to set technique for */
  private _notes: Note[];
  /** New technique type */
  private _newTechniqueType: TechniqueType;
  /** Bend options for if new technique is a guitar bend */
  private _newBendOptions?: BendTechniqueOptions;
  /** Old technqiues map (note UUID -> Techniques array) */
  private _oldTechniquesMap: Map<number, Technique[]>;
  /** True if executed, false otherwise */
  private _executed: boolean = false;

  /**
   * Set technique for notes command
   * @param notes Notes to set technique for
   * @param type New technique type
   * @param bendOptions Bend options for if new technique is a guitar bend
   */
  constructor(
    notes: Note[],
    type: TechniqueType,
    bendOptions?: BendTechniqueOptions
  ) {
    this._notes = notes;
    this._newTechniqueType = type;
    this._newBendOptions = bendOptions;

    this._oldTechniquesMap = new Map();
    for (const note of this._notes) {
      this._oldTechniquesMap.set(
        note.uuid,
        note.techniques.map((technique) => technique.deepCopy())
      );
    }
  }

  /**
   * Execute set technique command
   */
  execute(): void {
    this._executed = this.applyTechnique();
  }

  /**
   * Undo set technique command, i.e. set old techniques value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    for (const note of this._notes) {
      const oldTechniques = this._oldTechniquesMap.get(note.uuid);
      if (oldTechniques === undefined) {
        continue;
      }

      note.clearTechniques();

      for (const technique of oldTechniques) {
        const bendOptions =
          technique instanceof GuitarTechnique &&
          technique.type === GuitarTechniqueType.Bend
            ? technique.bendOptions
            : undefined;
        ScoreEditor.setTechniqueNotes([note], technique.type, bendOptions);
      }
    }
  }

  /**
   * Redo, i.e. restore techniques state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this.applyTechnique();
  }

  private applyTechnique(): boolean {
    return ScoreEditor.setTechniqueNotes(
      this._notes,
      this._newTechniqueType,
      this._newBendOptions
    );
  }

  /** True if executed, false otherwise */
  public get executed(): boolean {
    return this._executed;
  }

  public get affectsTechniqueLabels(): boolean {
    if (this.isTechniqueLabelType(this._newTechniqueType)) {
      return true;
    }

    for (const oldTechniques of this._oldTechniquesMap.values()) {
      if (
        oldTechniques.some((technique) =>
          this.isTechniqueLabelType(technique.type)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private get _affectedModels(): AffectedModel[] {
    const affectedBeats = getAffectedModelsFromBeats(
      this._notes.map((note) => note.beat)
    );
    return this._notes.map((note) => {
      const affectedBeat = affectedBeats.find(
        (model) => model.modelUUID === note.beat.uuid
      );
      if (affectedBeat === undefined) {
        return { masterBarIndex: -1, modelUUID: note.uuid };
      }

      return { ...affectedBeat, modelUUID: note.uuid };
    });
  }

  public get affectedModels(): AffectedModel[] {
    if (this.affectsTechniqueLabels) {
      return this._affectedModels;
    }

    if (this.isInlineTechniqueTargetedUpdate) {
      return this._affectedModels.slice(0, 1);
    }

    return this._affectedModels;
  }

  private get isInlineTechniqueTargetedUpdate(): boolean {
    if (this.isInlineTechniqueType(this._newTechniqueType)) {
      return true;
    }

    for (const oldTechniques of this._oldTechniquesMap.values()) {
      if (
        oldTechniques.some((technique) =>
          this.isInlineTechniqueType(technique.type)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private isTechniqueLabelType(type: TechniqueType): boolean {
    return (
      type === GuitarTechniqueType.PalmMute ||
      type === GuitarTechniqueType.LetRing ||
      type === GuitarTechniqueType.Vibrato ||
      type === GuitarTechniqueType.Bend
    );
  }

  private isInlineTechniqueType(type: TechniqueType): boolean {
    return (
      type === GuitarTechniqueType.HammerOnOrPullOff ||
      type === GuitarTechniqueType.NaturalHarmonic ||
      type === GuitarTechniqueType.PinchHarmonic ||
      type === GuitarTechniqueType.Slide
    );
  }
}
