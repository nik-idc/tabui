export var TabEventType;
(function (TabEventType) {
    /**
     * Fires when current beat in the player has been changed
     */
    TabEventType[TabEventType["PlayerCurBeatChanged"] = 0] = "PlayerCurBeatChanged";
    /**
     * Fires when tab window renderer finishes rendering
     */
    TabEventType[TabEventType["RenderComplete"] = 1] = "RenderComplete";
})(TabEventType || (TabEventType = {}));
/**
 * Event class for tab events
 */
export class TabEvent {
    _listeners;
    constructor() {
        this._listeners = new Map();
    }
    on(event, listener) {
        if (!this._listeners.has(event.toString())) {
            this._listeners.set(event.toString(), []);
        }
        const eventListeners = this._listeners.get(event.toString());
        if (eventListeners === undefined) {
            this._listeners.set(event.toString(), []);
            return;
        }
        eventListeners.push(listener);
    }
    emit(event, args) {
        if (!this._listeners.has(event.toString())) {
            return;
        }
        const eventListeners = this._listeners.get(event.toString());
        if (eventListeners === undefined) {
            return;
        }
        for (const listener of eventListeners) {
            listener(args);
        }
    }
}
export const tabEvent = new TabEvent();
//# sourceMappingURL=tab-event.js.map