/**
 * Class that contains all necessary information
 * about a selection element
 */
export declare class SelectionElement {
    readonly tabLineElementId: number;
    readonly barElementId: number;
    readonly beatElementId: number;
    readonly beatElementSeqId: number;
    /**
     * Class that contains all necessary information
     * about a selection element
     * @param tabLineElementId Id of the tab line of bar elements
     * @param barElementId Bar element id
     * @param beatElementId Beat element id (inside the bar)
     * @param beatElementSeqId Beat element id (among all beat elements)
     */
    constructor(tabLineElementId: number, barElementId: number, beatElementId: number, beatElementSeqId: number);
    /**
     *
     * @returns
     */
    ids(): number[];
}
