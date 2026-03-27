export enum TrackEventType {
  /**
   * Fires when current beat in the player has been changed
   */
  PlayerCurBeatChanged,
  /**
   * Fires when track window renderer finishes rendering
   */
  RenderComplete,
}

// Define a mapping of event types to argument types
export type TrackEventArgs = {
  [TrackEventType.PlayerCurBeatChanged]: {
    beatUUID: number;
  };
  [TrackEventType.RenderComplete]: {};
};

/**
 * Event class for track events
 */
export class TrackEvent {
  private _listeners: Map<string, ((args: any) => void)[]>;

  constructor() {
    this._listeners = new Map();
  }

  public on<T extends TrackEventType>(
    event: T,
    listener: (args: TrackEventArgs[T]) => void
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

  public emit<T extends TrackEventType>(
    event: T,
    args: TrackEventArgs[T]
  ): void {
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

export const trackEvent = new TrackEvent();
