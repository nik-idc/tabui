/** Web Audio boundary used by real transport/controller tests. */
type GraphNode = {
  connections: GraphNode[];
  isPanner: boolean;
  connect: jest.Mock<void, [GraphNode]>;
  gain: {
    setValueAtTime: jest.Mock;
  };
};

export function installTransportAudio() {
  const original = globalThis.AudioContext;
  const param = () => ({
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  });
  const node = (isPanner = false) => {
    const connections: GraphNode[] = [];
    return {
      connections,
      isPanner,
      gain: param(),
      connect: jest.fn((target: GraphNode) => {
        connections.push(target);
      }),
      disconnect: jest.fn(),
    };
  };
  const allSources: Array<ReturnType<typeof oscillator>> = [];
  function oscillator() {
    return {
      ...node(),
      type: "sine",
      frequency: param(),
      detune: param(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };
  }
  const bufferSources: Array<ReturnType<typeof bufferSource>> = [];
  function bufferSource() {
    return {
      ...node(),
      buffer: null,
      playbackRate: param(),
      detune: param(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };
  }
  function gain() {
    return { ...node(), gain: param() };
  }
  const context = {
    get currentTime() {
      return (Date.now() - origin) / 1000;
    },
    destination: node(),
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    createGain: jest.fn(gain),
    createStereoPanner: jest.fn(() => ({ ...node(true), pan: param() })),
    createOscillator: jest.fn(() => {
      const result = oscillator();
      allSources.push(result);
      return result;
    }),
    createBufferSource: jest.fn(() => {
      const result = bufferSource();
      bufferSources.push(result);
      return result;
    }),
    decodeAudioData: jest.fn(() => Promise.resolve({} as AudioBuffer)),
  };
  const origin = Date.now();
  const construct = jest.fn(() => context);
  globalThis.AudioContext = construct as unknown as typeof AudioContext;
  return {
    context,
    get sources() {
      return allSources.filter((source) => !isMetronomeSource(source));
    },
    allSources,
    bufferSources,
    construct,
    restore() {
      if (original === undefined) {
        Reflect.deleteProperty(globalThis, "AudioContext");
      } else {
        globalThis.AudioContext = original;
      }
    },
  };
}

function pannerCount(node: GraphNode, seen = new Set<GraphNode>()): number {
  if (seen.has(node)) return 0;
  seen.add(node);
  return (
    (node.isPanner ? 1 : 0) +
    node.connections.reduce((count, child) => {
      return count + pannerCount(child, seen);
    }, 0)
  );
}

function isMetronomeSource(source: GraphNode): boolean {
  // Clicks reach only the master panner; notes also pass through their track panner.
  return pannerCount(source) === 1;
}

/** Waits for the public void controller start action to finish its async startup. */
export async function settleTransport() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}
