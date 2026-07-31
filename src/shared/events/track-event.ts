export enum TrackEventType {
  /**
   * Fires when current beat in the player has been changed
   */
  PlayerCurBeatChanged,
  /**
   * Fires when playback state changes. Consumers should query current state
   * from the controller/player instead of relying on event payload state.
   */
  PlayerStateChanged,
  /**
   * Fires when track window renderer finishes rendering
   */
  RenderComplete,
}

// Define a mapping of event types to argument types
export type TrackEventArgs = {
  [TrackEventType.PlayerCurBeatChanged]: {
    trackUUID: number;
    playerUUID: number;
    beatUUID: number;
    nextBeatUUID?: number;
    startTime: number;
    endTime: number;
    playbackRunId: number;
  };
  [TrackEventType.PlayerStateChanged]: {
    playerUUID: number;
  };
  [TrackEventType.RenderComplete]: {};
};

/** Typed event emitter used by both internal and host-facing event owners. */
export class TrackEvent<EventMap extends object = TrackEventArgs> {
  private _listeners: Map<
    keyof EventMap,
    Array<(args: EventMap[keyof EventMap]) => void>
  >;

  constructor() {
    this._listeners = new Map();
  }

  public on<EventType extends keyof EventMap>(
    event: EventType,
    listener: (args: EventMap[EventType]) => void
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    const eventListeners = this._listeners.get(event);
    if (eventListeners === undefined) {
      throw Error("Event listener collection was not initialized");
    }

    eventListeners.push(listener as (args: EventMap[keyof EventMap]) => void);
    let subscribed = true;
    return () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;
      this.off(event, listener);
    };
  }

  public off<EventType extends keyof EventMap>(
    event: EventType,
    listener: (args: EventMap[EventType]) => void
  ): void {
    const eventListeners = this._listeners.get(event);
    if (eventListeners === undefined) {
      return;
    }

    const index = eventListeners.indexOf(
      listener as (args: EventMap[keyof EventMap]) => void
    );
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
  }

  public emit<EventType extends keyof EventMap>(
    event: EventType,
    args: EventMap[EventType]
  ): void {
    const eventListeners = this._listeners.get(event);
    if (eventListeners === undefined) {
      return;
    }

    for (const listener of [...eventListeners]) {
      listener(args);
    }
  }

  public clear(): void {
    this._listeners.clear();
  }
}

export const trackEvent = new TrackEvent();
