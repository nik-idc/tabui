import { TabWindow } from "../tab-window";
/**
 * Animates an SVG rectangle moving across beats while
 * playback is active
 */
export declare class TabPlayerSVGAnimator {
    private _bound;
    private _cursorElement;
    private _tabWindow;
    private _isAnimating;
    private _prevCoords;
    private _nextCoords;
    private _startTime;
    private _duration;
    constructor(cursorElement: SVGRectElement, tabWindow: TabWindow);
    bindToBeatChanged(): void;
    private onBeatChanged;
    private animate;
}
