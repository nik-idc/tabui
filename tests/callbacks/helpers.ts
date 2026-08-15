type Handler = (...args: any[]) => void;

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

  addEventListener(event: string, handler: Handler): void {
    const handlers = this._listeners.get(event) ?? new Set<Handler>();
    handlers.add(handler);
    this._listeners.set(event, handlers);
  }

  removeEventListener(event: string, handler: Handler): void {
    this._listeners.get(event)?.delete(handler);
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

  dispatch(event: string, payload: Record<string, unknown> = {}): void {
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

export function dispatchEvent(element: FakeElement, event: string): void {
  element.dispatch(event);
}

export function dispatchInput(element: FakeElement, value: string): void {
  element.value = value;
  element.dispatch("input");
}

export function createNotationComponentMock() {
  return {
    trackController: {
      isPlaying: false,
      editingEnabled: true,
      startPlayer: jest.fn(),
      stopPlayer: jest.fn(),
      toggleLoop: jest.fn(),
      syncTrackPlaybackState: jest.fn(),
      syncMasterPlaybackState: jest.fn(),
      moveTrack: jest.fn(() => true),
      setScoreName: jest.fn((score, name) => {
        score.name = name;
        return true;
      }),
      setMasterVolume: jest.fn((score, volume) => {
        score.masterVolume = volume;
        return true;
      }),
      setMasterPan: jest.fn((score, pan) => {
        score.masterPan = pan;
        return true;
      }),
      setTrackName: jest.fn((track, name) => {
        track.name = name;
        return true;
      }),
      setTrackVolume: jest.fn((track, volume) => {
        track.volume = volume;
        return true;
      }),
      setTrackPan: jest.fn((track, pan) => {
        track.pan = pan;
        return true;
      }),
      toggleTrackMuted: jest.fn((track) => {
        track.muted = !track.muted;
        return true;
      }),
      toggleTrackSoloed: jest.fn((track) => {
        track.soloed = !track.soloed;
        return true;
      }),
      addTrack: jest.fn(),
      removeTrack: jest.fn(() => true),
      setTrackInstrument: jest.fn(() => true),
      setSelectedBarTempo: jest.fn(),
      setSelectedBarTimeSignature: jest.fn(),
      setSelectedBeatsTuplet: jest.fn(),
      setSelectedBarRepeatStatus: jest.fn(),
      setDuration: jest.fn(),
      setDots: jest.fn(),
      setTechnique: jest.fn(),
      insertBeatBeforeSelected: jest.fn(),
      insertBeatAfterSelected: jest.fn(),
      removeSelectedBeat: jest.fn(),
      insertBarBeforeSelected: jest.fn(),
      insertBarAfterSelected: jest.fn(),
      removeSelectedBar: jest.fn(),
      selectedNote: undefined,
      hasSelectedNote: false,
      trackControllerEditor: {
        setSelectedBarTempo: jest.fn(),
        setSelectedBarTimeSignature: jest.fn(),
        setSelectedBeatsTuplet: jest.fn(),
        setSelectedBarRepeatStatus: jest.fn(),
        setDuration: jest.fn(),
        setDots: jest.fn(),
        setTechnique: jest.fn(),
        insertBeatBeforeSelected: jest.fn(),
        insertBeatAfterSelected: jest.fn(),
        removeSelectedBeat: jest.fn(),
        insertBarBeforeSelected: jest.fn(),
        insertBarAfterSelected: jest.fn(),
        removeSelectedBar: jest.fn(),
      },
    },
    loadTrack: jest.fn(),
    removeTrack: jest.fn(),
  } as any;
}
