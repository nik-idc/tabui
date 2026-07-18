import { TrackController } from "../../controller";
import { createSVGRect, Rect } from "../../../shared";
import {
  renderPlayerCursor,
  TrackPlayerSVGAnimator,
} from "./player-svg-animator";

export class PlayerOverlayRenderer {
  private _playerGroup: SVGGElement;
  private _playerAnimator?: TrackPlayerSVGAnimator;
  private _playerCursorRect?: SVGRectElement;

  constructor(
    playerGroup: SVGGElement,
    private readonly trackController: TrackController
  ) {
    this._playerGroup = playerGroup;
  }

  private ensureCursorRect(): SVGRectElement {
    if (this._playerCursorRect !== undefined) {
      return this._playerCursorRect;
    }

    this._playerCursorRect = createSVGRect();
    this._playerCursorRect.setAttribute("id", "playerCursor");
    return this._playerCursorRect;
  }

  private ensureAnimator(): void {
    if (this._playerAnimator !== undefined) {
      return;
    }

    this._playerAnimator = new TrackPlayerSVGAnimator(
      this.ensureCursorRect(),
      this.trackController
    );
    this._playerAnimator.bindToBeatChanged();
  }

  public render(): void {
    if (this.trackController.isPlaying) {
      this.renderPlaying();
    } else {
      this.hide();
    }
  }

  private renderPlaying(): void {
    const cursorRectElement = this.ensureCursorRect();
    this._playerGroup.appendChild(cursorRectElement);
    this.ensureAnimator();

    const currentBeatElement = this.trackController.playerCurrentBeatElement;
    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const trackLineElement =
        currentBeatElement.barElement.notationStyleLineElement.staffLineElement
          .trackLineElement;
      renderPlayerCursor(
        cursorRectElement,
        currentBeatElement,
        trackLineElement
      );
      cursorRect = new Rect(
        Number(cursorRectElement.getAttribute("x") ?? 0),
        Number(cursorRectElement.getAttribute("y") ?? 0),
        Number(cursorRectElement.getAttribute("width") ?? 0),
        Number(cursorRectElement.getAttribute("height") ?? 0)
      );
    }

    cursorRectElement.setAttribute("x", `${cursorRect.x}`);
    cursorRectElement.setAttribute("y", `${cursorRect.y}`);
    cursorRectElement.setAttribute("width", `${cursorRect.width}`);
    cursorRectElement.setAttribute("height", `${cursorRect.height}`);
    cursorRectElement.setAttribute("stroke", "var(--tu-notation-ink)");
    cursorRectElement.setAttribute("fill", "var(--tu-notation-cursor)");
  }

  private hide(): void {
    const cursorRectElement = this.ensureCursorRect();
    this._playerGroup.appendChild(cursorRectElement);

    cursorRectElement.setAttribute("width", "0");
    cursorRectElement.setAttribute("height", "0");
  }

  public unrender(): void {
    if (this._playerAnimator !== undefined) {
      this._playerAnimator.unbindFromBeatChanged();
      this._playerAnimator = undefined;
    }
    if (this._playerCursorRect !== undefined) {
      this._playerCursorRect.remove();
      this._playerCursorRect = undefined;
    }
  }
}
