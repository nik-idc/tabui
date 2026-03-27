import { BeatElement } from "@/notation/controller";
import { Point } from "@/shared";

/** Result of handling pointer movement during beat selection drag. */
export type SelectionDragMoveResult = {
  /** Whether current beat should be added to selection. */
  shouldSelectCurrentBeat: boolean;
  /** Whether drag selection has just started on this move. */
  startedSelection: boolean;
  /** Anchor beat selected when drag selection starts. */
  anchorBeat?: BeatElement;
};

/** Manages beat drag-selection state (pending -> selecting). */
export class SelectionDragController {
  /** True while drag-selection is actively selecting beats. */
  private _isSelectingBeats: boolean = false;
  /** True after pointer-down and before threshold is crossed. */
  private _isDragPending: boolean = false;
  /** Beat where current drag interaction started. */
  private _dragStartBeat?: BeatElement;
  /** Pointer position at drag start. */
  private _selectionStartPoint?: Point;

  /**
   * Starts a new drag interaction from a beat and pointer position.
   */
  public begin(beatElement: BeatElement, startPoint: Point): void {
    this._dragStartBeat = beatElement;
    this._selectionStartPoint = startPoint;
    this._isDragPending = true;
    this._isSelectingBeats = false;
  }

  /**
   * Handles pointer move and advances drag-selection state as needed.
   */
  public handleMove(
    point: Point,
    beatElement: BeatElement
  ): SelectionDragMoveResult {
    if (!this._isSelectingBeats && !this._isDragPending) {
      return { shouldSelectCurrentBeat: false, startedSelection: false };
    }

    if (this._selectionStartPoint === undefined) {
      this._selectionStartPoint = point;
      return { shouldSelectCurrentBeat: false, startedSelection: false };
    }

    const dx = point.x - this._selectionStartPoint.x;
    const dy = point.y - this._selectionStartPoint.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    if (this._isDragPending && distMoved >= beatElement.rect.width / 4) {
      this._isDragPending = false;
      this._isSelectingBeats = true;

      return {
        shouldSelectCurrentBeat: true,
        startedSelection: true,
        anchorBeat: this._dragStartBeat,
      };
    }

    if (!this._isSelectingBeats) {
      return { shouldSelectCurrentBeat: false, startedSelection: false };
    }

    return { shouldSelectCurrentBeat: true, startedSelection: false };
  }

  /** Resets drag-selection state to idle. */
  public reset(): void {
    this._isDragPending = false;
    this._isSelectingBeats = false;
    this._dragStartBeat = undefined;
    this._selectionStartPoint = undefined;
  }

  /** Whether beat drag-selection is currently active. */
  public get isSelectingBeats(): boolean {
    return this._isSelectingBeats;
  }

  /** Whether drag is pending and has not crossed threshold yet. */
  public get isDragPending(): boolean {
    return this._isDragPending;
  }
}
