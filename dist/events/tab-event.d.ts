export declare enum TabEventType {
    /**
     * Fires when current beat in the player has been changed
     */
    PlayerCurBeatChanged = 0,
    /**
     * Fires when tab window renderer finishes rendering
     */
    RenderComplete = 1
}
export type TabEventArgs = {
    [TabEventType.PlayerCurBeatChanged]: {
        beatUUID: number;
    };
    [TabEventType.RenderComplete]: {};
};
/**
 * Event class for tab events
 */
export declare class TabEvent {
    private _listeners;
    constructor();
    on<T extends TabEventType>(event: T, listener: (args: TabEventArgs[T]) => void): void;
    emit<T extends TabEventType>(event: T, args: TabEventArgs[T]): void;
}
export declare const tabEvent: TabEvent;
