import { GuitarEffect } from "../../../models/guitar-effect/guitar-effect";
import { Rect } from "../../shapes/rect";
import { TabWindowDim } from "../../tab-window-dim";
/**
 * Class that represents a guitar effect.
 * Represents specifically a UI element near the note
 * to which the effect is applied
 */
export declare class GuitarEffectElement {
    /**
     * Effect
     */
    readonly effect: GuitarEffect;
    /**
     * String number (for bends)
     */
    readonly stringNum: number;
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * Starting point (center of the provided rect)
     */
    private _startPoint;
    /**
     * Note's rect
     */
    private _noteRect;
    /**
     * Effect element's rect
     */
    private _rect?;
    /**
     * Image source
     */
    private _src?;
    /**
     * SVG path (full path HTML including styling,
     * i.e. transparent/non-transparent)
     */
    private _fullHTML?;
    /**
     * Effects HTML generator
     */
    private _svgUtils;
    /**
     * Class that represents a guitar effect
     * @param effect Effect
     * @param stringNum String number
     * @param noteRect Note rectangle
     * @param dim Tab window dimensions
     */
    constructor(effect: GuitarEffect, stringNum: number, noteRect: Rect, dim: TabWindowDim);
    /**
     * Build a regular bend path SVG path HTML element
     */
    private calcBendPath;
    /**
     * Build a bend-and-release path SVG path HTML element
     */
    private calcBendAndReleasePath;
    /**
     * Build a prebend path SVG path HTML element
     */
    private calcPrebendPath;
    /**
     * Build a prebend-and-release path SVG path HTML element
     */
    private calcPrebendAndReleasePath;
    /**
     * Calc slide path
     */
    private calcSlidePath;
    /**
     * Calc hammer-on or pull-off path
     */
    private calcHammerOnOrPullOffPath;
    /**
     * Calc natural harmonic path
     */
    private calcNaturalHarmonicPath;
    /**
     * Calc pinch harmonic path
     */
    private calcPinchHarmonicPath;
    /**
     * Calculates rectangle depending on effect type
     */
    private calc;
    scaleHorBy(scale: number): void;
    /**
     * Effect rect
     */
    get rect(): Rect | undefined;
    /**
     * Image source
     */
    get src(): string | undefined;
    /**
     * SVG Path
     */
    get fullHTML(): string | undefined;
}
