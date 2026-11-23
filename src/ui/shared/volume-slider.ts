import {
  MAX_VOLUME,
  MIN_VOLUME_DECIBELS,
  volumeToDecibels,
} from "../../notation/model/volume";

/** Slider position for MAX_VOLUME (+10 dB). Position 0 is silent. */
const FADER_MAX_POSITION = 100;

/**
 * Exponent of the fader curve. Like Guitar Pro's faders, most of the slider
 * covers useful levels: the middle is about -14 dB and three quarters is
 * about +5 dB. A slider that is linear in decibels would spend most of its
 * length near silence.
 */
const FADER_CURVE = 4;

/** Returns the slider position (0 to 100) for a volume gain. */
export function volumeToFaderPosition(volume: number): number {
  const ratio = Math.min(1, Math.max(0, volume / MAX_VOLUME));
  return ratio ** (1 / FADER_CURVE) * FADER_MAX_POSITION;
}

/** Returns the volume gain for a slider position (0 to 100). */
export function faderPositionToVolume(position: number): number {
  const ratio = Math.min(1, Math.max(0, position / FADER_MAX_POSITION));
  return MAX_VOLUME * ratio ** FADER_CURVE;
}

/** Formats a volume in decibels, such as "-6.0 dB", "0.0 dB", or "+3.5 dB". */
export function formatVolume(volume: number): string {
  const decibels = volumeToDecibels(volume);
  if (decibels <= MIN_VOLUME_DECIBELS) {
    return `${MIN_VOLUME_DECIBELS} dB`;
  }
  // Avoid "-0.0 dB" for levels that round to zero.
  const rounded = Math.round(decibels * 10) / 10 || 0;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)} dB`;
}

/**
 * Sets up a range input as a volume fader in decibels and shows a volume.
 * @param label Accessible name, such as "Master volume".
 */
export function renderVolumeSlider(
  input: HTMLInputElement,
  volume: number,
  label: string
): void {
  input.type = "range";
  input.min = "0";
  input.max = `${FADER_MAX_POSITION}`;
  input.step = "1";
  input.setAttribute("aria-label", label);
  // Browsers snap to the step anyway; rounding keeps every renderer the same.
  input.value = `${Math.round(volumeToFaderPosition(volume))}`;
  showVolume(input, volume, label);
}

/**
 * Shows a volume in a fader's tooltip and spoken value, without moving it.
 * Call while dragging, before the editor renders again.
 */
export function showVolume(
  input: HTMLInputElement,
  volume: number,
  label: string
): void {
  const text = formatVolume(volume);
  input.title = `${label}: ${text}`;
  input.setAttribute("aria-valuetext", text);
}

/** Returns the volume gain at a fader's current position. */
export function readVolumeSlider(input: HTMLInputElement): number {
  return faderPositionToVolume(Number(input.value));
}
