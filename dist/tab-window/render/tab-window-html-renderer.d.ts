import { TabWindow } from "../tab-window";
export declare class TabWindowHTMLRenderer {
    private _tabWindow;
    private _assetsPath;
    private _container;
    private _detailed;
    private _credentials;
    private _renderedLines;
    private _result;
    constructor(tabWindow: TabWindow, assetsPath: string, container: HTMLElement | undefined, detailed?: boolean);
    private renderNoteDetail;
    private renderNoteEffects;
    private renderNormalNoteBackground;
    private renderSelectedNoteBackground;
    private renderNoteValue;
    private renderNoteElement;
    private renderBeatNotesDetail;
    private renderNoteElements;
    private renderBeatNotesElement;
    private renderEffectLabels;
    private renderBeatDetail;
    private renderBeatDuration;
    private renderBeatSelection;
    private renderBeatElement;
    private renderBarStaffLines;
    private renderBarSig;
    private renderBarTempo;
    private renderBarBeats;
    private renderBarElement;
    private renderTabLine;
    private renderTabLines;
    private renderTabInfo;
    private renderPlayerOverlay;
    render(showTabCredits?: boolean, showTabName?: boolean, showGuitarInfo?: boolean): void;
    /**
     * Changes whether to draw additional details
     * @param newDetailed
     */
    setDetailed(newDetailed: boolean): void;
    get result(): string;
}
