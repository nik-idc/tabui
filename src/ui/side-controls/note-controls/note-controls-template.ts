import { createButton, createDiv } from "../../../shared";

type NoteDurationButtons = readonly [
  HTMLButtonElement, // Whole
  HTMLButtonElement, // Half
  HTMLButtonElement, // Quarter
  HTMLButtonElement, // Eighth
  HTMLButtonElement, // Sixteenth
  HTMLButtonElement, // Thirty-second
  HTMLButtonElement, // Sixty-fourth
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
  readonly fretSection: HTMLDivElement = createDiv();
  readonly durationSection: HTMLDivElement = createDiv();
  readonly durationGrid: HTMLDivElement = createDiv();
  readonly fretButton: HTMLButtonElement = createButton();
  readonly beatSection: HTMLDivElement = createDiv();
  readonly beatGrid: HTMLDivElement = createDiv();
  readonly voiceSection: HTMLDivElement = createDiv();
  readonly voiceGrid: HTMLDivElement = createDiv();
  readonly durationButtons: NoteDurationButtons = [
    createButton(), // Whole
    createButton(), // Half
    createButton(), // Quarter
    createButton(), // Eighth
    createButton(), // Sixteenth
    createButton(), // Thirty-second
    createButton(), // Sixty-fourth
  ];
  readonly restButton: HTMLButtonElement = createButton();
  readonly voiceButtons: VoiceButtons = [
    createButton(),
    createButton(),
    createButton(),
    createButton(),
  ];
  readonly dot1Button: HTMLButtonElement = createButton();
  readonly dot2Button: HTMLButtonElement = createButton();
  readonly insertBeatBeforeButton: HTMLButtonElement = createButton();
  readonly insertBeatAfterButton: HTMLButtonElement = createButton();
  readonly removeBeatButton: HTMLButtonElement = createButton();
  readonly tuplet2Button: HTMLButtonElement = createButton();
  readonly tuplet3Button: HTMLButtonElement = createButton();
  readonly tupletButton: HTMLButtonElement = createButton();
}
