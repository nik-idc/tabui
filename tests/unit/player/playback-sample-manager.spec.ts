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
    const buffer = { duration: 1 } as AudioBuffer;
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    let finishDecode!: (buffer: AudioBuffer) => void;
    let notifyDecodeStarted!: () => void;
    const decodeStarted = new Promise<void>((resolve) => {
      notifyDecodeStarted = resolve;
    });
    const decodeAudioData = jest.fn(
      () =>
        new Promise<AudioBuffer>((resolve) => {
          finishDecode = resolve;
          notifyDecodeStarted();
        })
    );
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(bytes),
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

    const pending = Promise.all([
      manager.loadSamplesForTones([
        ElectricGuitarTone.Clean,
        ElectricGuitarTone.Clean,
      ]),
      manager.loadSamplesForTones([ElectricGuitarTone.Clean]),
    ]);

    await decodeStarted;
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(decodeAudioData).toHaveBeenCalledWith(bytes);
    expect(manager.getSample(ElectricGuitarTone.Clean)).toBeUndefined();
    finishDecode(buffer);
    await pending;
    await manager.loadSamplesForTones([ElectricGuitarTone.Clean]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/clean.wav");
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(manager.getSample(ElectricGuitarTone.Clean)).toBe(buffer);
    expect(manager.getRootFrequency(ElectricGuitarTone.Clean)).toBe(110);
  });

  test.each(["network", "http", "body", "decode"] as const)(
    "leaves a failed %s sample unavailable without blocking other tones",
    async (failureStage) => {
      const failure = Error(failureStage);
      const failedBody = jest.fn(async () => {
        if (failureStage === "body") {
          throw failure;
        }
        return new Uint8Array([1]).buffer;
      });
      const successfulBytes = new Uint8Array([2]).buffer;
      const retryBytes = new Uint8Array([3]).buffer;
      const buffer = { duration: 2 } as AudioBuffer;
      let failedUrlRequests = 0;
      const decodeAudioData = jest.fn(async (bytes: ArrayBuffer) => {
        if (bytes !== successfulBytes && bytes !== retryBytes) {
          throw failure;
        }
        return buffer;
      });
      const fetchMock = jest.fn(async (url: string) => {
        if (url === "/missing.wav" && failedUrlRequests++ === 0) {
          if (failureStage === "network") {
            throw failure;
          }
          return {
            ok: failureStage !== "http",
            status: 404,
            arrayBuffer: failedBody,
          };
        }
        return {
          ok: true,
          arrayBuffer: async () =>
            url === "/missing.wav" ? retryBytes : successfulBytes,
        };
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const manager = new PlaybackSampleManager(
        { decodeAudioData } as unknown as AudioContext,
        {
          [ElectricGuitarTone.Clean]: {
            url: "/missing.wav",
            rootFrequency: 110,
          },
          [ElectricGuitarTone.Overdrive]: {
            url: "/overdrive.wav",
            rootFrequency: 220,
          },
        }
      );
      jest.spyOn(console, "error").mockImplementation(() => {});

      await manager.loadSamplesForTones([
        ElectricGuitarTone.Clean,
        ElectricGuitarTone.Overdrive,
      ]);

      expect(manager.getSample(ElectricGuitarTone.Clean)).toBeUndefined();
      expect(manager.getSample(ElectricGuitarTone.Overdrive)).toBe(buffer);
      expect(manager.getRootFrequency(ElectricGuitarTone.Clean)).toBe(110);
      expect(manager.getRootFrequency(ElectricGuitarTone.Overdrive)).toBe(220);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith("/missing.wav");
      expect(fetchMock).toHaveBeenCalledWith("/overdrive.wav");
      await manager.loadSamplesForTones([ElectricGuitarTone.Clean]);
      expect(manager.getSample(ElectricGuitarTone.Clean)).toBe(buffer);
      await manager.loadSamplesForTones([ElectricGuitarTone.Clean]);
      expect(decodeAudioData).toHaveBeenCalledWith(successfulBytes);
      expect(decodeAudioData).toHaveBeenCalledWith(retryBytes);
      expect(decodeAudioData).toHaveBeenCalledTimes(
        failureStage === "decode" ? 3 : 2
      );
      expect(fetchMock).toHaveBeenCalledTimes(3);
      if (failureStage === "network" || failureStage === "http") {
        expect(failedBody).not.toHaveBeenCalled();
      }
    }
  );

  test("does not fetch or decode tones without sample configuration", async () => {
    const fetchMock = jest.fn();
    const decodeAudioData = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const manager = new PlaybackSampleManager(
      { decodeAudioData } as unknown as AudioContext,
      {}
    );

    await manager.loadSamplesForTones([ElectricGuitarTone.Overdrive]);

    expect(manager.getSample(ElectricGuitarTone.Overdrive)).toBeUndefined();
    expect(
      manager.getRootFrequency(ElectricGuitarTone.Overdrive)
    ).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(decodeAudioData).not.toHaveBeenCalled();
  });
});
