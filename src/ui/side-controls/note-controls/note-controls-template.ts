import { createDiv, createImage } from "../../../shared";

type NoteDurationButtons = readonly [
  HTMLImageElement, // Whole
  HTMLImageElement, // Half
  HTMLImageElement, // Quarter
  HTMLImageElement, // Eighth
  HTMLImageElement, // Sixteenth
  HTMLImageElement, // Thirty-second
  HTMLImageElement, // Sixty-fourth
];

type VoiceButtons = readonly [
  HTMLImageElement,
  HTMLImageElement,
  HTMLImageElement,
  HTMLImageElement,
];

/**
 * Class defining the template of note controls:
 * Duration change, Tuplets and Dots
 */
export class NoteControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly fretSection: HTMLDivElement = createDiv();
  readonly durationSection: HTMLDivElement = createDiv();
  readonly durationGrid: HTMLDivElement = createDiv();
  readonly fretButton: HTMLImageElement = createImage();
  readonly beatSection: HTMLDivElement = createDiv();
  readonly beatGrid: HTMLDivElement = createDiv();
  readonly voiceSection: HTMLDivElement = createDiv();
  readonly voiceGrid: HTMLDivElement = createDiv();
  readonly durationButtons: NoteDurationButtons = [
    createImage(), // Whole
    createImage(), // Half
    createImage(), // Quarter
    createImage(), // Eighth
    createImage(), // Sixteenth
    createImage(), // Thirty-second
    createImage(), // Sixty-fourth
  ];
  readonly restButton: HTMLImageElement = createImage();
  readonly voiceButtons: VoiceButtons = [
    createImage(),
    createImage(),
    createImage(),
    createImage(),
  ];
  readonly dot1Button: HTMLImageElement = createImage();
  readonly dot2Button: HTMLImageElement = createImage();
  readonly insertBeatBeforeButton: HTMLImageElement = createImage();
  readonly insertBeatAfterButton: HTMLImageElement = createImage();
  readonly removeBeatButton: HTMLImageElement = createImage();
  readonly tuplet2Button: HTMLImageElement = createImage();
  readonly tuplet3Button: HTMLImageElement = createImage();
  readonly tupletButton: HTMLImageElement = createImage();
}
