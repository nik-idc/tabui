/** Web Audio boundary used by real transport/controller tests. */
export function installTransportAudio() {
  const original = globalThis.AudioContext;
  const param = () => ({
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  });
  const node = () => ({ connect: jest.fn(), disconnect: jest.fn() });
  const sources: Array<ReturnType<typeof oscillator>> = [];
  function oscillator() {
    return {
      ...node(),
      type: "sine",
      frequency: param(),
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
    createStereoPanner: jest.fn(() => ({ ...node(), pan: param() })),
    createOscillator: jest.fn(() => {
      const result = oscillator();
      sources.push(result);
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
    sources,
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

/** Waits for the public void controller start action to finish its async startup. */
export async function settleTransport() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}
