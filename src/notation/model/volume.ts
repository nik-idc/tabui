/** Highest volume level, in decibels. Like Guitar Pro, volumes can boost by up to 10 dB. */
export const MAX_VOLUME_DECIBELS = 10;

/**
 * Lowest volume level, in decibels. Like Guitar Pro, this is the level shown
 * for silence; lower gains, including 0, are shown as this level.
 */
export const MIN_VOLUME_DECIBELS = -170;

/**
 * Highest track or master volume, as a gain (about 3.16). Volumes are gains
 * that multiply the sound: 1 keeps it unchanged (0 dB), 0.5 is about -6 dB,
 * and 0 is silent.
 */
export const MAX_VOLUME = 10 ** (MAX_VOLUME_DECIBELS / 20);

/** Returns a volume gain in decibels, from MIN_VOLUME_DECIBELS to MAX_VOLUME_DECIBELS. */
export function volumeToDecibels(volume: number): number {
  if (volume <= 0) {
    return MIN_VOLUME_DECIBELS;
  }
  const decibels = 20 * Math.log10(volume);
  return Math.min(MAX_VOLUME_DECIBELS, Math.max(MIN_VOLUME_DECIBELS, decibels));
}

/** Returns the gain of a level in decibels, from 0 to MAX_VOLUME. */
export function decibelsToVolume(decibels: number): number {
  const clamped = Math.min(MAX_VOLUME_DECIBELS, decibels);
  return clamped <= MIN_VOLUME_DECIBELS ? 0 : 10 ** (clamped / 20);
}
