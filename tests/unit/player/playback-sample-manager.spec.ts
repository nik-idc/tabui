import type { ResolvedPlaybackSampleConfigs } from "../../../src/config/tabui-config";
import { ElectricGuitarTone } from "../../../src/notation/model";
import { PlaybackSampleManager } from "../../../src/player/playback-sample-manager";

describe("PlaybackSampleManager", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("deduplicates configured tone loads and retains the decoded sample", async () => {
    const buffer = {} as AudioBuffer;
    const decodeAudioData = jest.fn(() => Promise.resolve(buffer));
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const samples: ResolvedPlaybackSampleConfigs = {
      [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 110 },
    };
    const manager = new PlaybackSampleManager(
      { decodeAudioData } as unknown as AudioContext,
      samples
    );

    await Promise.all([
      manager.loadSamplesForTones([ElectricGuitarTone.Clean]),
      manager.loadSamplesForTones([ElectricGuitarTone.Clean]),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(manager.getSample(ElectricGuitarTone.Clean)).toBe(buffer);
    expect(manager.getRootFrequency(ElectricGuitarTone.Clean)).toBe(110);
  });

  test("keeps oscillator fallback available when a configured sample fails", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.reject(Error("network"))
    ) as unknown as typeof fetch;
    const manager = new PlaybackSampleManager(
      { decodeAudioData: jest.fn() } as unknown as AudioContext,
      {
        [ElectricGuitarTone.Clean]: {
          url: "/missing.wav",
          rootFrequency: 110,
        },
      }
    );
    jest.spyOn(console, "error").mockImplementation(() => {});

    await manager.loadSamplesForTones([
      ElectricGuitarTone.Clean,
      ElectricGuitarTone.Overdrive,
    ]);

    expect(manager.getSample(ElectricGuitarTone.Clean)).toBeUndefined();
    expect(
      manager.getRootFrequency(ElectricGuitarTone.Overdrive)
    ).toBeUndefined();
  });
});
