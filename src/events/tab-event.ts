export enum TabEventType {
  /**
   * Triggers when an effect label has been added
   */
  EffectLabelAdded,
  /**
   * Triggers when an effect label has been removed
   */
  EffectLabelRemoved,
}

// Define a mapping of event types to argument types
export type TabEventArgs = {
  [TabEventType.EffectLabelAdded]: {
    beatUUID: number;
    totalLabelsHeight: number;
    newLabelHeight: number;
  };
  [TabEventType.EffectLabelRemoved]: {
    beatUUID: number;
    totalLabelsHeight: number;
    newLabelHeight: number;
  };
};

/**
 * ! This is not related to TabEvent !
 * TODO: Explored different options and figured that
 * the best way to go forward is to do the following:
 *   1. Try and separate rendering, i.e. calculating coordinates and dimensions
 *      of elements, to the '*ElementName*Renderer' classes. But this is optional
 *   2. Data editing will def. have to move to other places: maybe put it all in
 *      one class like 'TabEditor' or split into 'BarEditor', 'BeatEditor', etc.
 *   3. Selection DEFINITELY needs to be moved to its own class, like
 *      'SelectionManager' or something like that
 *   4. Other non-related stuff:
 *      4.1 Rename 'Beat' to 'Beat' because that is much more appropriate
 *
 * Main takeaway is that the 'Element' approach is currently the best but the way
 * it's implemented is not the best. It's too tightly coupled with the rendering
 * and the data editing. So, the best way to go forward is to separate these
 * concerns into different classes.
 * ! This is not related to TabEvent !
 */

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

    this._listeners.get(event.toString()).push(listener);
  }

  public emit<T extends TabEventType>(event: T, args: TabEventArgs[T]): void {
    if (!this._listeners.has(event.toString())) {
      return;
    }

    for (const listener of this._listeners.get(event.toString())) {
      listener(args);
    }
  }
}

export const tabEvent = new TabEvent();
