/**
 * Interface defining the template of note controls:
 * Duration change, Tuplets and Dots
 */
export interface NoteControlsTemplate {
  readonly noteControlsContainer: HTMLDivElement;

  readonly noteDurationButtons: readonly [
    HTMLImageElement, // Whole
    HTMLImageElement, // Half
    HTMLImageElement, // Quarter
    HTMLImageElement, // Eighth
    HTMLImageElement, // Sixteenth
    HTMLImageElement // Thirty-second
  ];
  readonly dot1Button: HTMLImageElement;
  readonly dot2Button: HTMLImageElement;
  readonly tuplet2Button: HTMLImageElement;
  readonly tuplet3Button: HTMLImageElement;
  readonly tupletButton: HTMLImageElement;
}
