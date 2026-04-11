import { TrackController } from "@/notation/controller";
import { BeatElement } from "@/notation/controller/element/beat/beat-element";
import { TrackLineElement } from "@/notation/controller/element/track/track-line-element";
import { trackEvent, TrackEventType, TrackEventArgs } from "@/shared/events";

/** Renders the player cursor from a beat and its containing track line */
export function renderPlayerCursor(
  cursorElement: SVGRectElement,
  beatElement: BeatElement,
  trackLineElement?: TrackLineElement
): void {
  const coords = beatElement.globalCoords;
  const playerCursorWidth = 5;
  const playerCursorAddHeight = 10;
  let y = coords.y - playerCursorAddHeight;
  let height = beatElement.boundingBox.height + playerCursorAddHeight;

  const outlineLines = trackLineElement?.outlineLinesGlobal;
  if (outlineLines !== undefined) {
    y = outlineLines.left.y1;
    height = outlineLines.left.height;
  }

  cursorElement.setAttribute(
    "x",
    `${coords.x + beatElement.boundingBox.width / 2}`
  );
  cursorElement.setAttribute("y", `${y}`);
  cursorElement.setAttribute("width", `${playerCursorWidth}`);
  cursorElement.setAttribute("height", `${height}`);
}

/**
 * Updates the player cursor position when the active-track beat changes.
 */
export class TrackPlayerSVGAnimator {
  /** True once event binding is active */
  private _bound: boolean;
  /** Cursor SVG rectangle */
  private _cursorElement: SVGRectElement;
  /** Track controller for beat element lookup */
  private _trackController: TrackController;
  /** Bound event handler reference */
  private _boundOnBeatChanged: (
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ) => void;

  constructor(cursorElement: SVGRectElement, trackController: TrackController) {
    this._bound = false;
    this._cursorElement = cursorElement;
    this._trackController = trackController;
    this._boundOnBeatChanged = this.onBeatChanged.bind(this);
  }

  /** Subscribes to active-track beat change events */
  public bindToBeatChanged(): void {
    if (this._bound) {
      return;
    }

    trackEvent.on(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._bound = true;
  }

  /** Unsubscribes from active-track beat change events */
  public unbindFromBeatChanged(): void {
    if (!this._bound) {
      return;
    }

    trackEvent.off(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._bound = false;
  }

  /** Finds the track line containing the beat element */
  private getContainingTrackLineElement(
    beatElement: BeatElement
  ): TrackLineElement {
    return beatElement.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }

  /** Moves the cursor directly to the newly active beat */
  private onBeatChanged(
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ): void {
    const beatElement = this._trackController.trackElement.getBeatElementByUUID(
      args.beatUUID
    );
    if (beatElement === undefined) {
      throw Error("Failed to get beat element on beat changed");
    }

    const trackLineElement = this.getContainingTrackLineElement(beatElement);
    renderPlayerCursor(this._cursorElement, beatElement, trackLineElement);
  }
}
