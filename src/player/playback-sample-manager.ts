import { ResolvedPlaybackConfig } from "@/config/tabui-config";
import { InstrumentTone } from "@/notation/model";

/**
 * Loads and stores configured playback samples by instrument tone.
 * Sample loads are cached as promises so concurrent requests for the same
 * tone share one fetch/decode operation instead of starting duplicates.
 */
export class PlaybackSampleManager {
  /** Audio context used to decode sample data. */
  private _audioContext: AudioContext;
  /** Resolved playback sample configuration by instrument tone. */
  private _playbackConfig: ResolvedPlaybackConfig;
  /** Decoded samples ready for scheduling. */
  private _samples: Map<InstrumentTone, AudioBuffer>;
  /** In-flight sample load promises used to deduplicate concurrent loads. */
  private _sampleLoads: Map<InstrumentTone, Promise<void>>;

  /**
   * Loads and stores configured playback samples by instrument tone.
   * @param audioContext Audio context used to decode sample data
   * @param playbackConfig Resolved playback sample configuration
   */
  constructor(
    audioContext: AudioContext,
    playbackConfig: ResolvedPlaybackConfig
  ) {
    this._audioContext = audioContext;
    this._playbackConfig = playbackConfig;
    this._samples = new Map();
    this._sampleLoads = new Map();
  }

  /**
   * Fetches, decodes, and stores a sample for an instrument tone.
   * @param tone Instrument tone
   * @param url Sample URL
   */
  private async fetchSample(tone: InstrumentTone, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw Error(`Failed to load playback sample: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer);
      this._samples.set(tone, audioBuffer);
    } catch (error) {
      console.error("Failed to load playback sample", error);
    }
  }

  /**
   * Loads a sample for the provided tone if configured and not already loaded.
   * @param tone Instrument tone
   */
  private async loadSample(tone: InstrumentTone): Promise<void> {
    const sampleConfig = this._playbackConfig[tone];
    if (sampleConfig === undefined || this._samples.has(tone)) {
      return;
    }

    const existingSampleLoad = this._sampleLoads.get(tone);
    if (existingSampleLoad !== undefined) {
      return existingSampleLoad;
    }

    const sampleLoad = this.fetchSample(tone, sampleConfig.url);

    this._sampleLoads.set(tone, sampleLoad);
    return sampleLoad;
  }

  /** Loads every sample present in the resolved playback config. */
  public async loadConfiguredSamples(): Promise<void> {
    const loads = Object.keys(this._playbackConfig).map((tone) =>
      this.loadSample(tone as InstrumentTone)
    );

    await Promise.all(loads);
  }

  /**
   * Gets the decoded sample for an instrument tone.
   * @param tone Instrument tone
   * @returns Decoded sample, or undefined when no sample is available
   */
  public getSample(tone: InstrumentTone): AudioBuffer | undefined {
    return this._samples.get(tone);
  }

  /**
   * Gets the root frequency for an instrument tone's sample.
   * @param tone Instrument tone
   * @returns Root frequency, or undefined when no sample is configured
   */
  public getRootFrequency(tone: InstrumentTone): number | undefined {
    return this._playbackConfig[tone]?.rootFrequency;
  }
}
