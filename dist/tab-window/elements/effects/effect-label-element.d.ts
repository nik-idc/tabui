import { GuitarEffect } from "../../../models/guitar-effect/guitar-effect";
import { Rect } from "../../shapes/rect";
import { TabWindowDim } from "../../tab-window-dim";
/**
 * Class that contains an effect label
 */
export declare class EffectLabelElement {
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * Outer rectangle
     */
    private _rect;
    /**
     * Effect
     */
    readonly effect: GuitarEffect;
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
     * Class that contains an effect label
     * @param dim Tab window dimensions
     * @param rect Outer rectangle
     * @param effect Effect
     */
    constructor(dim: TabWindowDim, rect: Rect, effect: GuitarEffect);
    /**
     * Generates bend pitch HTML
     */
    private bendPitchHTML;
    /**
     * Generates prebend pitch HTML
     */
    private prebendPitchHTML;
    /**
     * Generates bend-and-release pitch HTML
     */
    private bendAndReleasePitchHTML;
    /**
     * Generates prebend-and-release pitch HTMLА
     */
    private prebendAndReleasePitchHTML;
    /**
     * Generates regular vibrato HTML
     */
    private vibratoHTML;
    /**
     * Generates Palm Mute HTML
     */
    private palmMuteHTML;
    /**
     * Calc effect label element
     */
    calc(): void;
    scaleHorBy(scale: number): void;
    /**
     * Outer rectangle
     */
    get rect(): Rect;
    /**
     * SVG path (full path HTML including styling, i.e. transparent/non-transparent)
     */
    get fullHTML(): string | undefined;
}
