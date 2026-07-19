import { BeatElement } from "../../controller/element/beat/beat-element";
import { TabBeatElement } from "../../controller/element/beat/tab-beat-element";
import { TrackLineElement } from "../../controller/element/track/track-line-element";

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
  /** Cursor SVG rectangle */
  private _cursorElement: SVGRectElement;
  private _renderPlayerCursor: (beatElement: BeatElement) => void;

  constructor(
    cursorElement: SVGRectElement,
    renderBeatElement?: (beatElement: BeatElement) => void
  ) {
    this._cursorElement = cursorElement;
    this._renderPlayerCursor = renderBeatElement ?? this.renderPlayerCursor;
  }

  private renderPlayerCursor(beatElement: BeatElement): void {
    const trackLineElement = beatElement.owningTrackLineElement;
    renderPlayerCursor(this._cursorElement, beatElement, trackLineElement);
  }

  /** Moves the cursor directly to the provided beat. */
  public snapToBeat(beatElement: BeatElement): void {
    this._renderPlayerCursor(beatElement);
  }
}
