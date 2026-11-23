import { createButton, createDiv } from "../../../shared";

/** Elements of the technique controls, listed in display order. */
export class TechniqueControlsTemplate {
  readonly container: HTMLDivElement = createDiv();

  /** Label rows above the staff, and the beat-level stroke. */
  readonly styleGroup: HTMLDivElement = createDiv();
  readonly vibratoButton: HTMLButtonElement = createButton();
  readonly palmMuteButton: HTMLButtonElement = createButton();
  readonly letRingButton: HTMLButtonElement = createButton();
  /** Opens the stroke settings dialog. */
  readonly strokeButton: HTMLButtonElement = createButton();

  /** Techniques that link to another note, change pitch, or set how the note is struck. */
  readonly articulationGroup: HTMLDivElement = createDiv();
  readonly tieButton: HTMLButtonElement = createButton();
  readonly legatoButton: HTMLButtonElement = createButton();
  readonly slideButton: HTMLButtonElement = createButton();
  readonly bendButton: HTMLButtonElement = createButton();
  /** Ties as far back as possible; sits next to Tie. */
  readonly tieBackButton: HTMLButtonElement = createButton();
  readonly tapButton: HTMLButtonElement = createButton();
  readonly nhButton: HTMLButtonElement = createButton();
  readonly phButton: HTMLButtonElement = createButton();

  /** Accent kinds. */
  readonly accentGroup: HTMLDivElement = createDiv();
  readonly accentButton: HTMLButtonElement = createButton();
  readonly heavyAccentButton: HTMLButtonElement = createButton();
}
