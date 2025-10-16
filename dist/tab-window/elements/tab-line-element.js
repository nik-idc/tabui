import { Rect } from "../shapes/rect";
import { BarElement } from "./bar-element";
/**
 * Class that handles a tab line element
 */
export class TabLineElement {
    /**
     * Tab
     */
    tab;
    /**
     * Tab window dimensions
     */
    dim;
    /**
     * Line encapsulating rectangle
     */
    rect;
    /**
     * Effects encapsulating rectangle (horizontal, as wide as 'rect')
     */
    effectLabelsRect;
    /**
     * Bar elements on this line
     */
    barElements;
    /**
     * Class that handles a tab line element
     * @param tab Tab
     * @param dim Tab window dimensions
     * @param coords Tab line coordinates
     */
    constructor(tab, dim, coords) {
        this.tab = tab;
        this.dim = dim;
        this.rect = new Rect(coords.x, coords.y, 0, dim.tabLineMinHeight);
        this.effectLabelsRect = new Rect(coords.x, coords.y, 0, 0);
        this.barElements = [];
    }
    /**
     * Justifies elements by scaling all their widths
     */
    justifyElements() {
        // Calc width of empty space
        const gapWidth = this.dim.width -
            this.barElements[this.barElements.length - 1].rect.rightTop.x;
        if (gapWidth === 0) {
            return;
        }
        // Calc sum width of all bar elements
        let sumWidth = 0;
        for (const barElement of this.barElements) {
            sumWidth += barElement.rect.width;
        }
        // Go through each bar element and increase their
        // width according to how their current width relates
        // to the width of the empty space
        // const scale = this.dim.width / this.rect.width;
        const scale = this.dim.width / sumWidth;
        for (const barElement of this.barElements) {
            barElement.scaleHorBy(scale);
        }
    }
    /**
     * True if the bar element fits in this line, false otherwise
     * @param barElement Bar element whose fitness to test
     * @returns True if the bar element fits in this line, false otherwise
     */
    barElementFits(barElement) {
        return this.rect.rightTop.x + barElement.rect.width <= this.dim.width;
    }
    /**
     * Changes the width of the encapsulating and effects rectangles
     * @param dWidth Width by which to change
     */
    changeWidth(dWidth) {
        this.rect.width += dWidth;
        this.effectLabelsRect.width += dWidth;
    }
    setHeight(newHeight) {
        for (const barElement of this.barElements) {
            barElement.setHeight(newHeight);
        }
        const diff = newHeight - this.rect.height;
        this.rect.height += diff;
        this.effectLabelsRect.height += diff;
    }
    insertEffectGap(gapHeight) {
        for (const barElement of this.barElements) {
            barElement.insertEffectGap(gapHeight);
        }
        this.rect.height += gapHeight;
        this.effectLabelsRect.height += gapHeight;
    }
    removeEffectGap() {
        for (const barElement of this.barElements) {
            barElement.removeEffectGap();
        }
        this.rect.height += this.dim.effectLabelHeight;
        this.effectLabelsRect.height += this.dim.effectLabelHeight;
    }
    /**
     * Attempts to add a bar to the line
     * @param bar Bar to add
     * @param prevBar Previous bar
     * @returns True if added succesfully, false otherwise
     */
    addBar(bar, prevBar) {
        const barElement = BarElement.createBarElement(this.dim, bar, prevBar, this.rect.rightTop.x, this.effectLabelsRect.height);
        if (!this.barElementFits(barElement)) {
            this.justifyElements();
            return false;
        }
        if (barElement.rect.height > this.rect.height) {
            const gapHeight = barElement.rect.height - this.rect.height;
            this.insertEffectGap(gapHeight);
        }
        this.barElements.push(barElement);
        this.changeWidth(barElement.rect.width);
        return true;
    }
    calc() {
        const bars = this.barElements.map((be) => be.bar);
        this.rect = new Rect(this.rect.x, this.rect.y, 0, this.dim.tabLineMinHeight);
        this.effectLabelsRect = new Rect(this.rect.x, this.rect.y, 0, 0);
        this.barElements = [];
        for (let i = 0; i < bars.length; i++) {
            const prevBarIndex = this.tab.bars.findIndex((bar) => bar.uuid === bars[i].uuid);
            const prevBar = prevBarIndex === 0 ? undefined : this.tab.bars[prevBarIndex - 1];
            this.addBar(bars[i], prevBar);
        }
        // this.justifyElements();
    }
    /**
     * Removes bar element
     * @param barElementId Index of the bar element in this line
     */
    removeBarElement(barElementId) {
        const barElement = this.barElements[barElementId];
        barElement.rect.x = 0;
        barElement.rect.y = 0;
        this.barElements.splice(barElementId, 1);
        this.changeWidth(-barElement.rect.width);
    }
    applyEffectSingle(barElementId, beatElementId, stringNum, effectType, effectOptions) {
        const beatElement = this.barElements[barElementId].beatElements[beatElementId];
        let beatId = 0;
        const barId = this.tab.bars.findIndex((bar) => {
            return bar.beats.some((beat, index) => {
                beatId = index;
                return beat === beatElement.beat;
            });
        });
        // Apply effect to selected element
        const applyRes = this.tab.applyEffectToNote(barId, beatId, stringNum, effectType, effectOptions);
        if (!applyRes) {
            return false;
        }
        // // Calc new beat gap height and apply the gap increase across the tab line
        // const prevHeight = beatElement.rect.height;
        // beatElement.calc();
        // const newHeight = beatElement.rect.height;
        // if (newHeight !== prevHeight) {
        //   this.setHeight(this.rect.height + (newHeight - prevHeight));
        // }
        this.calc();
        return true;
    }
    removeEffectSingle(barElementId, beatElementId, stringNum, effectIndex) {
        const beatElement = this.barElements[barElementId].beatElements[beatElementId];
        let beatId = 0;
        const barId = this.tab.bars.findIndex((bar) => {
            return bar.beats.some((beat, index) => {
                beatId = index;
                return beat === beatElement.beat;
            });
        });
        this.tab.removeEffectFromNote(barId, beatId, stringNum, effectIndex);
        // Compare max heights before and after calculating the beat element
        // If the max height of beats decreased, decrease entire tab line height
        // TODO: Explore basic recalc upon applying/removing effects
        // since when height changes we need to go trough the entire tab line
        // anyway PLUS effect application is unlikely to be done quickly in
        // succession so even if recalc is slow it probably wouldn'matter anyway
        // const prevMaxHeight = this.getMaxBeatHeight();
        // beatElement.calc();
        // const newMaxHeight = this.getMaxBeatHeight();
        // if (newMaxHeight < prevMaxHeight) {
        //   this.setHeight(this.rect.height - (prevMaxHeight - newMaxHeight));
        // }
        this.calc();
    }
    getFitToScale() {
        return this.rect.width / this.dim.width;
    }
}
//# sourceMappingURL=tab-line-element.js.map