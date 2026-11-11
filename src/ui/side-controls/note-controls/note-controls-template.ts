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

/** One button per dynamic, from ppp to fff. */
type DynamicButtons = readonly [
  HTMLButtonElement, // ppp
  HTMLButtonElement, // pp
  HTMLButtonElement, // p
  HTMLButtonElement, // mp
  HTMLButtonElement, // mf
  HTMLButtonElement, // f
  HTMLButtonElement, // ff
  HTMLButtonElement, // fff
];

type VoiceButtons = readonly [
  HTMLButtonElement,
  HTMLButtonElement,
  HTMLButtonElement,
  HTMLButtonElement,
];

/**
 * Class defining the template of note controls:
 * Duration change, Tuplets, Dots and Dynamics
 */
export class NoteControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly fretSection: HTMLDivElement = createDiv();
  readonly fretGrid: HTMLDivElement = createDiv();
  readonly durationSection: HTMLDivElement = createDiv();
  readonly durationGrid: HTMLDivElement = createDiv();
  readonly fretButton: HTMLButtonElement = createButton();
  /** Button that raises the selected pitch by one semitone. */
  readonly shiftPitchUpButton: HTMLButtonElement = createButton();
  /** Button that lowers the selected pitch by one semitone. */
  readonly shiftPitchDownButton: HTMLButtonElement = createButton();
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
  /** Grid below the tuplet buttons that holds the dynamic buttons. */
  readonly dynamicGrid: HTMLDivElement = createDiv();
  /** Buttons that set a dynamic on the selected beats, in DYNAMICS order. */
  readonly dynamicButtons: DynamicButtons = [
    createButton(), // ppp
    createButton(), // pp
    createButton(), // p
    createButton(), // mp
    createButton(), // mf
    createButton(), // f
    createButton(), // ff
    createButton(), // fff
  ];
}
