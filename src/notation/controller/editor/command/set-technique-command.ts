import {
  ScoreEditor,
  Note,
  TechniqueType,
  GuitarTechniqueType,
  BeatSnapshot,
} from "../../../model";
import type { SetTechniqueOptions } from "../../../model/editor/set-technique-options";
import { BeatPosition, NotePosition } from "../../../model/editor/score-editor";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set technique for notes command
 */
export class SetTechniqueCommand implements Command {
  /** New technique type */
  private _newTechniqueType: TechniqueType;
  /** Technique-specific settings captured when the command is created. */
  private _options: SetTechniqueOptions;
  /** Fixed positions, including rest slots, resolved against live content when executed. */
  private _targets: (BeatPosition | NotePosition)[];
  /** Original beat content for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed beat content for redo without running edit rules again. */
  private _after: BeatSnapshot[] = [];
  /** Fixed note or beat positions reported to the controller, resolved against live content. */
  private _affectedTargets: (BeatPosition | NotePosition)[];
  /** True if executed, false otherwise */
  private _executed: boolean = false;

  /**
   * Set technique for notes command
   * @param targets Fixed beat positions; a one-based string limits the edit to that slot, including on rests.
   * @param type New technique type
   * @param options Optional Bend settings or Tie source-search mode.
   */
  constructor(
    targets: (BeatPosition | NotePosition)[],
    type: TechniqueType,
    options: SetTechniqueOptions = {}
  ) {
    this._targets = targets.map((p) => ({ ...p }));
    this._affectedTargets = ScoreEditor.getTechniqueTargetsForNotes(
      ScoreEditor.getTechniqueNotes(this._targets)
    );
    this._newTechniqueType = type;
    this._options = { ...options };
  }

  /**
   * Execute set technique command
   */
  execute(): void {
    const plan = ScoreEditor.buildTechniquePlan(
      this._targets,
      this._newTechniqueType,
      this._options
    );
    this._before = ScoreEditor.snapshotBeatNotes(plan.stateBeats);
    this._executed = ScoreEditor.applyTechniquePlan(plan);
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.resolveBeatPositions(this._before)
    );
    this._affectedTargets = plan.affectedTargets;
  }

  /**
   * Restores the original beat content.
   */
  undo(): void {
    if (!this._executed) {
      return;
    }
    ScoreEditor.restoreBeatSnapshots(this._before);
  }

  /**
   * Restores the completed edit without planning or applying techniques again.
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  /** True if executed, false otherwise */
  public get executed(): boolean {
    return this._executed;
  }

  public get affectsTechniqueLabels(): boolean {
    if (this.isTechniqueLabelType(this._newTechniqueType)) {
      return true;
    }

    for (const note of this.previousNotes) {
      if (
        note.techniques.some((technique) =>
          this.isTechniqueLabelType(technique.type)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private get _affectedModels(): AffectedModel[] {
    const beats = ScoreEditor.resolveBeatPositions(this._affectedTargets);
    const affectedBeats = getAffectedModelsFromBeats(beats);
    return this._affectedTargets.flatMap((position, i) => {
      const beat = beats[i];
      const affectedBeat = affectedBeats.find((m) => m.modelUUID === beat.uuid);
      if (!("stringNumber" in position)) {
        return affectedBeat === undefined ? [] : [affectedBeat];
      }
      const note = beat.notes?.[position.stringNumber - 1];
      if (note === undefined) {
        return [];
      }

      return [{ masterBarIndex: -1, ...affectedBeat, modelUUID: note.uuid }];
    });
  }

  public get affectedModels(): AffectedModel[] {
    const affectsBeats = this._affectedTargets.some(
      (t) => !("stringNumber" in t)
    );
    if (affectsBeats || this.affectsTechniqueLabels) {
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

    for (const note of this.previousNotes) {
      if (
        note.techniques.some((technique) =>
          this.isInlineTechniqueType(technique.type)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private get previousNotes(): Note[] {
    if (this._before.length === 0) {
      return ScoreEditor.getTechniqueNotes(this._targets);
    }
    return this._targets.flatMap((position) => {
      const { voiceBar, index } = position;
      const stringNumber =
        "stringNumber" in position ? position.stringNumber : undefined;
      const notes =
        this._before.find((s) => s.voiceBar === voiceBar && s.index === index)
          ?.notes ?? [];
      return notes.filter(
        (_, i) => stringNumber === undefined || i === stringNumber - 1
      );
    });
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
      type === GuitarTechniqueType.Legato ||
      type === GuitarTechniqueType.NaturalHarmonic ||
      type === GuitarTechniqueType.PinchHarmonic ||
      type === GuitarTechniqueType.Slide
    );
  }
}
