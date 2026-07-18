import { TrackController } from "../../controller";
import { BeatElement } from "../../controller/element/beat/beat-element";
import { TabBeatElement } from "../../controller/element/beat/tab-beat-element";
import { TrackLineElement } from "../../controller/element/track/track-line-element";
import {
  trackEvent,
  TrackEventType,
  TrackEventArgs,
} from "../../../shared/events";

/** Renders the player cursor from a beat and its containing track line */
export function renderPlayerCursor(
  cursorElement: SVGRectElement,
  beatElement: BeatElement,
  trackLineElement?: TrackLineElement
): void {
  if (!(beatElement instanceof TabBeatElement)) {
    return;
  }

  const coords = beatElement.globalCoords;
  const playerCursorWidth = 5;
  const playerCursorAddHeight = 10;
  const x =
    beatElement.barElement.globalCoords.x +
    beatElement.barLocalCoords.x +
    beatElement.attackLocalX;
  let y = coords.y - playerCursorAddHeight;
  let height = beatElement.boundingBox.height + playerCursorAddHeight;

  const outlineLines = trackLineElement?.outlineLinesGlobal;
  if (outlineLines !== undefined) {
    y = outlineLines.left.y1;
    height = outlineLines.left.height;
  }

  cursorElement.setAttribute("y", `${y}`);
  cursorElement.setAttribute("width", `${playerCursorWidth}`);
  cursorElement.setAttribute("height", `${height}`);
  cursorElement.setAttribute("x", `${x - playerCursorWidth / 2}`);
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
  private _renderBeatElement: (beatElement: BeatElement) => void;
  /** Bound event handler reference */
  private _boundOnBeatChanged: (
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ) => void;

  constructor(
    cursorElement: SVGRectElement,
    trackController: TrackController,
    renderBeatElement?: (beatElement: BeatElement) => void
  ) {
    this._bound = false;
    this._cursorElement = cursorElement;
    this._trackController = trackController;
    this._renderBeatElement =
      renderBeatElement ??
      ((beatElement) => {
        const trackLineElement =
          this.getContainingTrackLineElement(beatElement);
        renderPlayerCursor(this._cursorElement, beatElement, trackLineElement);
      });
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
    const beatElement = this._trackController.getBeatElementByUUID(
      args.beatUUID
    );
    if (beatElement === undefined) {
      // WARNING: Should this still throw? Seems like a bug Phase 4 missed
      // Since now the required beat is not guaranteed to have a corresponding
      // beat element because lazy updating is used
      throw Error("Failed to get beat element on beat changed");
    }

    this._renderBeatElement(beatElement);
  }
}
