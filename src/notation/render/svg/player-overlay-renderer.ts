import { TrackController } from "../../controller";
import { TrackLineElement } from "../../controller/element/track/track-line-element";
import { createSVGRect, Rect } from "../../../shared";
import {
  trackEvent,
  TrackEventArgs,
  TrackEventType,
} from "../../../shared/events";
import {
  renderPlayerCursor,
  TrackPlayerSVGAnimator,
} from "./player-svg-animator";

export class PlayerOverlayRenderer {
  private _playerGroup: SVGGElement;
  private _playerAnimator?: TrackPlayerSVGAnimator;
  private _playerCursorRect?: SVGRectElement;
  private _beatChangedBound: boolean;
  private _boundOnBeatChanged: (
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ) => void;

  constructor(
    playerGroup: SVGGElement,
    private readonly trackController: TrackController,
    private readonly ensureTrackLineVisible?: (
      trackLine: TrackLineElement
    ) => void
  ) {
    this._playerGroup = playerGroup;
    this._beatChangedBound = false;
    this._boundOnBeatChanged = this.onBeatChanged.bind(this);
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

    this._playerAnimator = new TrackPlayerSVGAnimator(this.ensureCursorRect());
  }

  private bindToBeatChanged(): void {
    if (this._beatChangedBound) {
      return;
    }

    trackEvent.on(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._beatChangedBound = true;
  }

  private unbindFromBeatChanged(): void {
    if (!this._beatChangedBound) {
      return;
    }

    trackEvent.off(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._beatChangedBound = false;
  }

  private onBeatChanged(
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ): void {
    const beat = this.trackController.getBeatByUUID(args.beatUUID);
    if (beat === undefined) {
      return;
    }

    const trackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(beat);
    if (trackLineElement === undefined) {
      return;
    }

    this.ensureTrackLineVisible?.(trackLineElement);
    const beatElement = this.trackController.trackElement.getBeatElement(beat);
    if (beatElement === undefined) {
      return;
    }

    this.ensureAnimator();
    this._playerAnimator?.snapToBeat(beatElement);
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
    this.bindToBeatChanged();

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
    this.unbindFromBeatChanged();
    this._playerAnimator = undefined;
    if (this._playerCursorRect !== undefined) {
      this._playerCursorRect.remove();
      this._playerCursorRect = undefined;
    }
  }
}
