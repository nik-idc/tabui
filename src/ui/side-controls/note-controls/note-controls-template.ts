import { createDiv, createImage } from "@/shared";

type NoteDurationButtons = readonly [
  HTMLImageElement, // Whole
  HTMLImageElement, // Half
  HTMLImageElement, // Quarter
  HTMLImageElement, // Eighth
  HTMLImageElement, // Sixteenth
  HTMLImageElement, // Thirty-second
];

/**
 * Class defining the template of note controls:
 * Duration change, Tuplets and Dots
 */
export class NoteControlsTemplate {
  readonly noteControlsContainer: HTMLDivElement = createDiv();
  readonly noteDurationButtons: NoteDurationButtons = [
    createImage(), // Whole
    createImage(), // Half
    createImage(), // Quarter
    createImage(), // Eighth
    createImage(), // Sixteenth
    createImage(), // Thirty-second
  ];
  readonly dot1Button: HTMLImageElement = createImage();
  readonly dot2Button: HTMLImageElement = createImage();
  readonly tuplet2Button: HTMLImageElement = createImage();
  readonly tuplet3Button: HTMLImageElement = createImage();
  readonly tupletButton: HTMLImageElement = createImage();
}
