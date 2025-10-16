import { Beat } from "../../models/beat";
import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { TabWindowDim } from "../tab-window-dim";
import { EffectLabelElement } from "./effects/effect-label-element";
import { BeatNotesElement } from "./beat-notes-element";
/**
 * Class that handles drawing beat element in the tab
 */
export declare class BeatElement {
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * Inidicates whether this beat element is selected
     */
    selected: boolean;
    /**
     * This beat's note elements
     */
    private _beatNotesElement;
    /**
     * This beat's duration rectangle
     */
    readonly durationRect: Rect;
    /**
     * This beat's rectangle
     */
    readonly rect: Rect;
    /**
     * The beat
     */
    readonly beat: Beat;
    /**
     * Effect label elements
     */
    private _effectLabelElements;
    /**
     * Effect labels rectangle
     */
    private _effectLabelsRect;
    /**
     * Class that handles drawing beat element in the tab
     * @param dim Tab window dimensions
     * @param beatCoords Beat element coords
     * @param beat Beat
     */
    constructor(dim: TabWindowDim, beatCoords: Point, beat: Beat, labelsGapHeight?: number);
    private calcRectAndNotes;
    private calcDurationDims;
    private calcEffectLabels;
    /**
     * Calculate dimensions of the beat element and its' child elements
     */
    calc(): void;
    setHeight(newHeight: number): void;
    /**
     * Inserts a gap between the durations rectangle and beat notes.
     * The result is that the beat element is taller, beat notes are
     * moved down and the gap between durations and notes is increased
     * (or created if there was none)
     */
    insertEffectGap(gapHeight: number): void;
    removeEffectGap(): void;
    scaleHorBy(scale: number): void;
    get beatNotesElement(): BeatNotesElement;
    get effectLabelElements(): EffectLabelElement[];
}
