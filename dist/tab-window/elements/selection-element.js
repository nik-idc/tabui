/**
 * Class that contains all necessary information
 * about a selection element
 */
export class SelectionElement {
    tabLineElementId;
    barElementId;
    beatElementId;
    beatElementSeqId;
    /**
     * Class that contains all necessary information
     * about a selection element
     * @param tabLineElementId Id of the tab line of bar elements
     * @param barElementId Bar element id
     * @param beatElementId Beat element id (inside the bar)
     * @param beatElementSeqId Beat element id (among all beat elements)
     */
    constructor(tabLineElementId, barElementId, beatElementId, beatElementSeqId) {
        this.tabLineElementId = tabLineElementId;
        this.barElementId = barElementId;
        this.beatElementId = beatElementId;
        this.beatElementSeqId = beatElementSeqId;
    }
    /**
     *
     * @returns
     */
    ids() {
        return [this.tabLineElementId, this.barElementId, this.beatElementId];
    }
}
//# sourceMappingURL=selection-element.js.map