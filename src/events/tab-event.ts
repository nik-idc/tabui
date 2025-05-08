export enum TabEventType {
  /**
   * Fires when current beat in the player has been changed
   */
  PlayerCurBeatChanged,
  /**
   * Fires when tab window renderer finishes rendering
   */
  RenderComplete,
}

// Define a mapping of event types to argument types
export type TabEventArgs = {
  [TabEventType.PlayerCurBeatChanged]: {
    beatUUID: number;
  };
  [TabEventType.RenderComplete]: {};
};

/**
 * Event class for tab events
 */
export class TabEvent {
  private _listeners: Map<string, ((args: any) => void)[]>;

  constructor() {
    this._listeners = new Map();
  }

  public on<T extends TabEventType>(
    event: T,
    listener: (args: TabEventArgs[T]) => void
  ): void {
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

  public emit<T extends TabEventType>(event: T, args: TabEventArgs[T]): void {
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
