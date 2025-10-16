import { Beat } from "../../models/beat";
import { Tab } from "../../models/tab";
export declare const TonejsDurationMap: {
    1: string;
    0.5: string;
    0.25: string;
    0.125: string;
    0.0625: string;
    0.03125: string;
};
export declare class TabPlayer {
    private _tab;
    private _currentBeat?;
    private _synth;
    private _isPlaying;
    constructor(tab: Tab);
    start(): void;
    playFromCurrentBeat(): void;
    setCurrentBeat(beat: Beat): void;
    stop(): void;
    get isPlaying(): boolean;
    get currentBeat(): Beat | undefined;
}
