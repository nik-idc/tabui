import type { ScheduledAudioNode } from "./scheduled-audio-node";

/** Shared output level for the score-wide metronome bus. */
export const METRONOME_BUS_LEVEL = 0.48;

const ACCENT_FREQUENCY = 1760;
const REGULAR_FREQUENCY = 1320;
const ACCENT_DURATION_SECONDS = 0.045;
const REGULAR_DURATION_SECONDS = 0.035;
const ATTACK_SECONDS = 0.001;
const REGULAR_PEAK_GAIN = 0.625;

/** Creates and schedules one synthesized metronome click without choosing its route. */
export function createMetronomeClick(
  audioContext: AudioContext,
  startTime: number,
  maxStopTime: number,
  accented: boolean
): ScheduledAudioNode | null {
  const duration = Math.min(
    accented ? ACCENT_DURATION_SECONDS : REGULAR_DURATION_SECONDS,
    maxStopTime - startTime
  );
  if (duration <= 0) {
    return null;
  }

  const sourceNode = audioContext.createOscillator();
  let gainNode: GainNode | undefined;
  const stopTime = startTime + duration;
  try {
    gainNode = audioContext.createGain();
    sourceNode.frequency.value = accented
      ? ACCENT_FREQUENCY
      : REGULAR_FREQUENCY;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(
      accented ? 1 : REGULAR_PEAK_GAIN,
      startTime + ATTACK_SECONDS
    );
    gainNode.gain.linearRampToValueAtTime(0, stopTime);
    sourceNode.connect(gainNode);
    sourceNode.start(startTime);
    sourceNode.stop(stopTime);
  } catch (error) {
    try {
      sourceNode.stop(audioContext.currentTime);
    } catch {
      // The source may not have started.
    }
    sourceNode.disconnect();
    gainNode?.disconnect();
    throw error;
  }

  if (gainNode === undefined) {
    throw Error("Metronome gain node was not created");
  }
  return { sourceNode, gainNode, startTime };
}
