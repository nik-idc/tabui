import {
  Score,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  Bar,
  MasterBar,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Set bar tempo command
 */
export class SetTempoCommand implements Command {
  /** Bar to append the beat to */
  private _bar: MasterBar;
  /** Bar UUIDs whose tempo visibility may change */
  private _affectedModelUUIDs: number[];
  /** New tempo value */
  private _newTempo: number;
  /** Old tempo value */
  private _oldTempo: number;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar bar tempo command
   * @param bar Bar whose tempo to set
   * @param newTempo New tempo value
   */
  constructor(
    bar: MasterBar,
    newTempo: number,
    affectedModelUUIDs: number[] = []
  ) {
    this._bar = bar;
    this._affectedModelUUIDs = affectedModelUUIDs;
    this._newTempo = newTempo;
    this._oldTempo = bar.tempo;
  }

  /**
   * Execute set tempo command
   */
  execute(): void {
    this._bar.tempo = this._newTempo;
    this._executed = true;
  }

  /**
   * Undo set tempo command, i.e. set old tempo value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._bar.tempo = this._oldTempo;
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._bar.tempo = this._newTempo;
  }

  public get executed(): boolean {
    return this._executed;
  }

  public get isTempoVisibilityVerticalUpdate(): boolean {
    return this._affectedModelUUIDs.length > 0;
  }

  public get affectedModelUUIDs(): number[] {
    return this._affectedModelUUIDs;
  }
}
