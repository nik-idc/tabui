import { ResolvedPlaybackConfig } from "@/config/tabui-config";
import { MusicInstrumentPreset } from "@/notation/model";

/**
 * Loads and stores configured playback samples by instrument preset.
 * Sample loads are cached as promises so concurrent requests for the same
 * preset share one fetch/decode operation instead of starting duplicates.
 */
export class PlaybackSampleManager {
  /** Audio context used to decode sample data. */
  private _audioContext: AudioContext;
  /** Resolved playback sample configuration by instrument preset. */
  private _playbackConfig: ResolvedPlaybackConfig;
  /** Decoded samples ready for scheduling. */
  private _samples: Map<MusicInstrumentPreset, AudioBuffer>;
  /** In-flight sample load promises used to deduplicate concurrent loads. */
  private _sampleLoads: Map<MusicInstrumentPreset, Promise<void>>;

  /**
   * Loads and stores configured playback samples by instrument preset.
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
   * Fetches, decodes, and stores a sample for an instrument preset.
   * @param preset Instrument preset
   * @param url Sample URL
   */
  private async fetchSample(
    preset: MusicInstrumentPreset,
    url: string
  ): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw Error(`Failed to load playback sample: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer);
      this._samples.set(preset, audioBuffer);
    } catch (error) {
      console.error("Failed to load playback sample", error);
    }
  }

  /**
   * Loads a sample for the provided preset if configured and not already loaded.
   * @param preset Instrument preset
   */
  private async loadSample(preset: MusicInstrumentPreset): Promise<void> {
    const sampleConfig = this._playbackConfig[preset];
    if (sampleConfig === undefined || this._samples.has(preset)) {
      return;
    }

    const existingSampleLoad = this._sampleLoads.get(preset);
    if (existingSampleLoad !== undefined) {
      return existingSampleLoad;
    }

    const sampleLoad = this.fetchSample(preset, sampleConfig.url);

    this._sampleLoads.set(preset, sampleLoad);
    return sampleLoad;
  }

  /** Loads every sample present in the resolved playback config. */
  public async loadConfiguredSamples(): Promise<void> {
    const loads = Object.keys(this._playbackConfig).map((preset) =>
      this.loadSample(preset as MusicInstrumentPreset)
    );

    await Promise.all(loads);
  }

  /**
   * Gets the decoded sample for an instrument preset.
   * @param preset Instrument preset
   * @returns Decoded sample, or undefined when no sample is available
   */
  public getSample(preset: MusicInstrumentPreset): AudioBuffer | undefined {
    return this._samples.get(preset);
  }

  /**
   * Gets the root frequency for an instrument preset's sample.
   * @param preset Instrument preset
   * @returns Root frequency, or undefined when no sample is configured
   */
  public getRootFrequency(preset: MusicInstrumentPreset): number | undefined {
    return this._playbackConfig[preset]?.rootFrequency;
  }
}
