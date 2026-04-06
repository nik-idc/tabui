import { TrackController } from "@/notation/controller";
// import { TonejsDurationMap } from "@/player/staff-player";
import { Point } from "@/shared";
import { trackEvent, TrackEventType, TrackEventArgs } from "@/shared/events";
import * as Tone from "tone";

/**
 * Animates an SVG rectangle moving across beats while
 * playback is active
 */
export class TrackPlayerSVGAnimator {
  private _bound: boolean;
  private _cursorElement: SVGRectElement;
  private _trackController: TrackController;
  private _isAnimating: boolean;
  private _prevCoords: Point;
  private _nextCoords: Point | undefined;
  private _startTime: number;
  private _duration: number;

  constructor(cursorElement: SVGRectElement, trackController: TrackController) {
    this._bound = false;
    this._cursorElement = cursorElement;
    this._isAnimating = false;
    this._trackController = trackController;
    this._prevCoords = new Point(
      cursorElement.getAttribute("x") as unknown as number,
      cursorElement.getAttribute("y") as unknown as number
    );
    this._startTime = 0;
    this._duration = 0;
  }

  public bindToBeatChanged(): void {
    if (this._bound) {
      return;
    }

    trackEvent.on(
      TrackEventType.PlayerCurBeatChanged,
      this.onBeatChanged.bind(this)
    );
    this._bound = true;
  }

  private onBeatChanged(
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ) {
    const beatElement = this._trackController.trackElement.getBeatElementByUUID(
      args.beatUUID
    );
    if (beatElement === undefined) {
      throw Error("Could not find beat element");
    }

    const coords =
      this._trackController.trackElement.getBeatElementGlobalCoords(
        beatElement
      );
    // Adjust to fix the playback feeling as if it's behind 1 beat
    coords.x += beatElement.rect.width / 2;
    const durationSeconds = Tone.Time(
      TonejsDurationMap[beatElement.beat.baseDuration]
    ).toSeconds();

    this._prevCoords =
      this._nextCoords === undefined ? coords : this._nextCoords;
    this._nextCoords = coords;
    this._duration = durationSeconds;
    this._startTime = Tone.now();

    if (!this._isAnimating) {
      this._isAnimating = true;
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  private animate(): void {
    if (this._prevCoords === undefined || this._nextCoords === undefined) {
      return;
    }

    const elapsed = Tone.now() - this._startTime;
    const progress = Math.min(elapsed / this._duration, 1);

    const x =
      this._prevCoords.x + (this._nextCoords.x - this._prevCoords.x) * progress;
    const y = this._nextCoords.y; // optionally animate y too

    this._cursorElement.setAttribute("x", x.toString());
    this._cursorElement.setAttribute("y", (y - 10).toString());

    if (progress < 1) {
      requestAnimationFrame(this.animate.bind(this));
    } else {
      this._prevCoords = this._nextCoords;
      this._isAnimating = false;
    }
  }
}
