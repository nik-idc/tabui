import { createButton, createDiv, createImage } from "../../../shared";

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
  HTMLButtonElement,
  HTMLButtonElement,
  HTMLButtonElement,
  HTMLButtonElement,
];

/**
 * Class defining the template of note controls:
 * Duration change, Tuplets and Dots
 */
export class NoteControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly durationButtons: NoteDurationButtons = [
    createImage(), // Whole
    createImage(), // Half
    createImage(), // Quarter
    createImage(), // Eighth
    createImage(), // Sixteenth
    createImage(), // Thirty-second
    createImage(), // Sixty-fourth
  ];
  readonly restButton: HTMLButtonElement = createButton();
  readonly voiceButtons: VoiceButtons = [
    createButton(),
    createButton(),
    createButton(),
    createButton(),
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
