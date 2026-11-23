/** @jest-environment jsdom */
import {
  decibelsToVolume,
  MAX_VOLUME,
  Score,
  volumeToDecibels,
} from "../../../src/notation/model";
import { deserializeScore, serializeScore } from "../../../src/notation/format";
import {
  faderPositionToVolume,
  formatVolume,
  readVolumeSlider,
  renderVolumeSlider,
  volumeToFaderPosition,
} from "../../../src/ui/shared/volume-slider";

describe("volume in decibels", () => {
  test("converts between gain and decibels from -170 to +10 dB", () => {
    expect(MAX_VOLUME).toBeCloseTo(3.1623, 4);
    expect(volumeToDecibels(1)).toBe(0);
    expect(volumeToDecibels(0.5)).toBeCloseTo(-6.02, 2);
    expect(volumeToDecibels(MAX_VOLUME)).toBeCloseTo(10);
    expect(volumeToDecibels(0)).toBe(-170);
    expect(decibelsToVolume(-6.0206)).toBeCloseTo(0.5, 4);
    expect(decibelsToVolume(-170)).toBe(0);
    expect(decibelsToVolume(20)).toBe(MAX_VOLUME);
  });

  test("saves and loads a boosted volume", () => {
    const score = new Score();
    score.masterVolume = MAX_VOLUME;
    score.tracks[0].volume = 2;

    const loaded = deserializeScore(serializeScore(score));

    expect(loaded.masterVolume).toBe(MAX_VOLUME);
    expect(loaded.tracks[0].volume).toBe(2);
  });
});

describe("volume fader", () => {
  test("follows a curve like Guitar Pro's faders", () => {
    expect(formatVolume(faderPositionToVolume(100))).toBe("+10.0 dB");
    expect(formatVolume(faderPositionToVolume(50))).toBe("-14.1 dB");
    expect(formatVolume(faderPositionToVolume(0))).toBe("-170 dB");
    expect(volumeToFaderPosition(1)).toBeCloseTo(75, 0);
    expect(volumeToFaderPosition(faderPositionToVolume(37))).toBeCloseTo(37);
  });

  test("shows the level in decibels and reads it back", () => {
    const input = document.createElement("input");

    renderVolumeSlider(input, 0.5, "Lead volume");

    expect(input.value).toBe("63");
    expect(input.title).toBe("Lead volume: -6.0 dB");
    expect(input.getAttribute("aria-valuetext")).toBe("-6.0 dB");
    expect(input.getAttribute("aria-label")).toBe("Lead volume");
    expect(volumeToDecibels(readVolumeSlider(input))).toBeCloseTo(-6.0, 0);
  });

  test("formats 0 dB without a sign", () => {
    expect(formatVolume(1)).toBe("0.0 dB");
    expect(formatVolume(0.99999)).toBe("0.0 dB");
  });
});
