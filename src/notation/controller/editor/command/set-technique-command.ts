import {
  Score,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  Bar,
  MasterBar,
  BarRepeatStatus,
  Technique,
  BendTechniqueOptions,
  Note,
  TechniqueType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation/model";
import { Command } from "./command";

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
      this._oldTechniquesMap.set(note.uuid, note.techniques);
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
}
