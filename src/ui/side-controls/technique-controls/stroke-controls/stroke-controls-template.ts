import {
  createButton,
  createDiv,
  createInput,
  createLabel,
  randomInt,
} from "../../../../shared";
import {
  MAX_STROKE_DURATION,
  MIN_STROKE_DURATION,
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_HALF,
  STROKE_DURATION_QUARTER,
  STROKE_DURATION_SIXTEENTH,
  STROKE_DURATION_SIXTY_FOURTH,
  NoteDuration,
} from "../../../../notation/model";

/**
 * Duration slider steps per doubling of the stroke duration. The slider uses
 * a logarithmic scale, so each written note value has the same space, and
 * every note value is an exact step.
 */
export const STROKE_DURATION_STEPS_PER_OCTAVE = 12;

/** Highest duration slider position, at MAX_STROKE_DURATION. */
export const STROKE_DURATION_MAX_POSITION = Math.round(
  STROKE_DURATION_STEPS_PER_OCTAVE *
    Math.log2(MAX_STROKE_DURATION / MIN_STROKE_DURATION)
);

/** Converts a duration slider position to stroke ticks. */
export function strokeDurationFromPosition(position: number): number {
  const octaves = position / STROKE_DURATION_STEPS_PER_OCTAVE;
  return Math.round(MIN_STROKE_DURATION * 2 ** octaves);
}

/** Converts stroke ticks to the nearest duration slider position. */
export function strokeDurationToPosition(duration: number): number {
  const octaves = Math.log2(duration / MIN_STROKE_DURATION);
  return Math.round(STROKE_DURATION_STEPS_PER_OCTAVE * octaves);
}

/** Labelled duration slider marks, with the note glyph shown for each. */
export const STROKE_DURATION_MARKS: ReadonlyArray<{
  duration: number;
  noteDuration: NoteDuration;
}> = [
  {
    duration: STROKE_DURATION_SIXTY_FOURTH,
    noteDuration: NoteDuration.SixtyFourth,
  },
  { duration: STROKE_DURATION_SIXTEENTH, noteDuration: NoteDuration.Sixteenth },
  { duration: STROKE_DURATION_EIGHTH, noteDuration: NoteDuration.Eighth },
  { duration: STROKE_DURATION_QUARTER, noteDuration: NoteDuration.Quarter },
  { duration: STROKE_DURATION_HALF, noteDuration: NoteDuration.Half },
];

/** Elements of the stroke settings dialog. */
export class StrokeControlsTemplate {
  /** Makes element ids and the radio group name unique when several editors share a page. */
  readonly idSuffix: number = randomInt();

  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly dialogContent: HTMLFormElement = document.createElement("form");

  readonly inputContent: HTMLDivElement = createDiv();

  readonly directionFieldset: HTMLFieldSetElement =
    document.createElement("fieldset");
  readonly directionLegend: HTMLLegendElement =
    document.createElement("legend");
  readonly directionDownInput: HTMLInputElement = createInput();
  readonly directionDownLabel: HTMLLabelElement = createLabel();
  readonly directionUpInput: HTMLInputElement = createInput();
  readonly directionUpLabel: HTMLLabelElement = createLabel();

  readonly durationContent: HTMLDivElement = createDiv();
  readonly durationLabel: HTMLLabelElement = createLabel();
  readonly durationValue: HTMLDivElement = createDiv();
  readonly durationInput: HTMLInputElement = createInput();
  readonly durationMarkLabels: HTMLDivElement = createDiv();

  readonly alignmentContent: HTMLDivElement = createDiv();
  readonly alignmentLabel: HTMLLabelElement = createLabel();
  readonly alignmentValue: HTMLDivElement = createDiv();
  readonly alignmentInput: HTMLInputElement = createInput();
  readonly alignmentEnds: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly removeButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
