import { NotationComponent } from "../../../src/notation/notation-component";
import { TrackController } from "../../../src/notation/controller";
import { Score, Track } from "../../../src/notation/model";

type FakeEvent = { target: FakeElement };

type EventName =
  | "click"
  | "input"
  | "focus"
  | "focusout"
  | "focusin"
  | "change"
  | "keydown"
  | "keyup"
  | "mousedown"
  | "mousemove"
  | "mouseup"
  | "close";

type FakeEventMap = Record<EventName, FakeEvent> & {
  wheel: FakeEvent & { deltaY: number; preventDefault: () => void };
};

type Handler<K extends keyof FakeEventMap = keyof FakeEventMap> = (
  event: FakeEventMap[K]
) => void;

function asHandler<K extends keyof FakeEventMap>(handler: Handler<K>): Handler {
  return handler as Handler;
}

export class FakeElement {
  value = "";
  textContent = "";
  disabled = false;
  dataset: Record<string, string> = {};
  classList = {
    add: jest.fn(),
    toggle: jest.fn(),
  };
  close = jest.fn(() => this.dispatch("close"));
  setAttribute = jest.fn();

  private _children: FakeElement[] = [];
  private _listeners = new Map<string, Set<Handler>>();

  addEventListener<K extends keyof FakeEventMap>(
    event: K,
    handler: (event: FakeEventMap[K]) => void
  ): void {
    const handlers = this._listeners.get(event) ?? new Set<Handler>();
    handlers.add(asHandler(handler));
    this._listeners.set(event, handlers);
  }

  removeEventListener<K extends keyof FakeEventMap>(
    event: K,
    handler: (event: FakeEventMap[K]) => void
  ): void {
    this._listeners.get(event)?.delete(asHandler(handler));
  }

  appendChild(child: FakeElement): void {
    this._children.push(child);
  }

  contains(node: unknown): boolean {
    if (node === this) {
      return true;
    }

    return this._children.some((child) => child.contains(node));
  }

  dispatch<K extends keyof FakeEventMap>(
    event: K,
    payload: Partial<FakeEventMap[K]> = {}
  ): void {
    const handlers = this._listeners.get(event);
    if (handlers === undefined) {
      return;
    }

    for (const handler of handlers) {
      handler({ target: this, ...payload });
    }
  }
}

export function makeButton(): FakeElement {
  return new FakeElement();
}

export function makeInput(value: string = ""): FakeElement {
  const input = new FakeElement();
  input.value = value;
  return input;
}

export function makeText(): FakeElement {
  return new FakeElement();
}

export function makeDialog(): FakeElement {
  return new FakeElement();
}

export function dispatchClick(
  element: FakeElement,
  target?: FakeElement
): void {
  element.dispatch("click", { target: target ?? element });
}

export function dispatchEvent(
  element: FakeElement,
  event: keyof FakeEventMap
): void {
  element.dispatch(event);
}

export function dispatchInput(element: FakeElement, value: string): void {
  element.value = value;
  element.dispatch("input");
}

type ControllerActions = {
  [K in keyof TrackController as TrackController[K] extends (
    ...args: never[]
  ) => unknown
    ? K
    : never]: jest.Mock;
};

export type MockTrackController = {
  isPlaying: boolean;
  readonly isPlaybackActive: boolean;
  editingEnabled: boolean;
  track: Track;
  selectionCursor: unknown;
  hasSelectedNote: boolean;
} & ControllerActions;

export type MockNotationComponent = {
  score: Score;
  trackController: MockTrackController;
  loadTrack: jest.Mock;
  removeTrack: jest.Mock;
};

/** Converts the minimal callback fixture at the concrete component boundary. */
export function asNotationComponent(
  component: MockNotationComponent
): NotationComponent {
  return component as unknown as NotationComponent;
}

export function createNotationComponentMock(): MockNotationComponent {
  const score = new Score();
  score.name = "Score";
  const track = score.tracks[0];
  const actions = {} as ControllerActions;
  for (const name of Object.getOwnPropertyNames(TrackController.prototype)) {
    if (name !== "constructor") {
      actions[name as keyof ControllerActions] = jest.fn();
    }
  }
  actions.moveTrack.mockReturnValue(true);
  actions.removeTrack.mockReturnValue(true);
  actions.setTrackInstrument.mockReturnValue(true);
  actions.setScoreName.mockImplementation((nextScore: Score, name: string) => {
    nextScore.name = name;
    return true;
  });
  actions.setMasterVolume.mockImplementation(
    (nextScore: Score, volume: number) => {
      nextScore.masterVolume = volume;
      return true;
    }
  );
  actions.setMasterPan.mockImplementation((nextScore: Score, pan: number) => {
    nextScore.masterPan = pan;
    return true;
  });
  actions.setTrackName.mockImplementation((nextTrack: Track, name: string) => {
    nextTrack.name = name;
    return true;
  });
  actions.setTrackVolume.mockImplementation(
    (nextTrack: Track, volume: number) => {
      nextTrack.volume = volume;
      return true;
    }
  );
  actions.setTrackPan.mockImplementation((nextTrack: Track, pan: number) => {
    nextTrack.pan = pan;
    return true;
  });
  actions.toggleTrackMuted.mockImplementation((nextTrack: Track) => {
    nextTrack.muted = !nextTrack.muted;
    return true;
  });
  actions.toggleTrackSoloed.mockImplementation((nextTrack: Track) => {
    nextTrack.soloed = !nextTrack.soloed;
    return true;
  });

  return {
    score,
    trackController: {
      ...actions,
      isPlaying: false,
      get isPlaybackActive() {
        return this.isPlaying;
      },
      editingEnabled: true,
      track,
      selectionCursor: undefined,
      hasSelectedNote: false,
    },
    loadTrack: jest.fn(),
    removeTrack: jest.fn(),
  };
}
