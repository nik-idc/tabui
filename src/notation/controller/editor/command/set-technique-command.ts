import {
  ScoreEditor,
  Technique,
  BendTechniqueOptions,
  Note,
  TechniqueType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

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
    this._executed = ScoreEditor.setTechniqueNotes(
      this._notes,
      this._newTechniqueType,
      this._newBendOptions
    );
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

    ScoreEditor.setTechniqueNotes(
      this._notes,
      this._newTechniqueType,
      this._newBendOptions
    );
  }

  /** True if executed, false otherwise */
  public get executed(): boolean {
    return this._executed;
  }

  public get isTechniqueLabelVerticalUpdate(): boolean {
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

  public get affectedModelUUIDs(): number[] {
    return this._notes.map((note) => note.uuid);
  }

  public get updateRequest(): CommandUpdateRequest {
    if (this.isTechniqueLabelVerticalUpdate) {
      return {
        updateType: "Vertical",
        affectedModelUUIDs: this.affectedModelUUIDs,
      };
    }

    if (this.isInlineTechniqueTargetedUpdate) {
      return {
        updateType: "Targeted",
        affectedModelUUIDs: [this.affectedModelUUIDs[0]],
      };
    }

    return {
      updateType: "Full",
    };
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
