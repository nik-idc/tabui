import { tabEvent, TabEventType } from "../../events/tab-event";
import * as Tone from "tone";
import { TonejsDurationMap } from "./tab-player";
import { Point } from "../shapes/point";
/**
 * Animates an SVG rectangle moving across beats while
 * playback is active
 */
export class TabPlayerSVGAnimator {
    _bound;
    _cursorElement;
    _tabWindow;
    _isAnimating;
    _prevCoords;
    _nextCoords;
    _startTime;
    _duration;
    constructor(cursorElement, tabWindow) {
        this._bound = false;
        this._cursorElement = cursorElement;
        this._isAnimating = false;
        this._tabWindow = tabWindow;
        this._prevCoords = new Point(cursorElement.getAttribute("x"), cursorElement.getAttribute("y"));
        this._startTime = 0;
        this._duration = 0;
    }
    bindToBeatChanged() {
        if (this._bound) {
            return;
        }
        tabEvent.on(TabEventType.PlayerCurBeatChanged, this.onBeatChanged.bind(this));
        this._bound = true;
    }
    onBeatChanged(args) {
        const beatElement = this._tabWindow.getBeatElementByUUID(args.beatUUID);
        if (beatElement === undefined) {
            throw Error("Could not find beat element");
        }
        const coords = this._tabWindow.getBeatElementGlobalCoords(beatElement);
        // Adjust to fix the playback feeling as if it's behind 1 beat
        coords.x += beatElement.rect.width / 2;
        const durationSeconds = Tone.Time(TonejsDurationMap[beatElement.beat.duration]).toSeconds();
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
    animate() {
        if (this._prevCoords === undefined || this._nextCoords === undefined) {
            return;
        }
        const elapsed = Tone.now() - this._startTime;
        const progress = Math.min(elapsed / this._duration, 1);
        const x = this._prevCoords.x + (this._nextCoords.x - this._prevCoords.x) * progress;
        const y = this._nextCoords.y; // optionally animate y too
        this._cursorElement.setAttribute("x", x.toString());
        this._cursorElement.setAttribute("y", (y - 10).toString());
        if (progress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        }
        else {
            this._prevCoords = this._nextCoords;
            this._isAnimating = false;
        }
    }
}
//# sourceMappingURL=tab-player-svg-animator.js.map