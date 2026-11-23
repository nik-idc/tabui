import { NotationComponent } from "../../../../notation/notation-component";
import {
  DURATION_TO_NAME,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_ALIGNMENT_STARTS_ON_TIME,
  StrokeDirection,
  StrokeOptions,
} from "../../../../notation/model";
import {
  describeStrokeAlignment,
  describeStrokeDuration,
} from "../../../../notation/accessibility/stroke-description";
import { resolveAssetUrl, type ResolvedAssetConfig } from "../../../../assets";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import {
  STROKE_DURATION_MARKS,
  STROKE_DURATION_MAX_POSITION,
  StrokeControlsTemplate,
  strokeDurationToPosition,
} from "./stroke-controls-template";

/** Upper-cases the first letter, for visible value text. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Builds the stroke settings dialog and shows draft values.
 * The alignment slider runs left to right like a timeline: left plays the
 * whole stroke before the beat (falls on time), right starts it on the beat.
 */
export class StrokeControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: StrokeControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: StrokeControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const t = this.template;
    assembleDialog(
      t.dialogContainer,
      "tu-stroke-dialog",
      "Stroke",
      t.dialogContent,
      "tu-stroke-dialog-content",
      [
        {
          element: t.inputContent,
          className: "tu-stroke-inputs",
          children: [
            t.directionFieldset,
            t.durationContent,
            t.alignmentContent,
          ],
        },
        {
          element: t.actionsContent,
          className: "tu-stroke-actions",
          children: [t.confirmButton, t.removeButton, t.cancelButton],
        },
      ]
    );

    t.directionDownLabel.append(t.directionDownInput, "Down");
    t.directionUpLabel.append(t.directionUpInput, "Up");
    t.directionFieldset.append(
      t.directionLegend,
      t.directionDownLabel,
      t.directionUpLabel
    );
    t.durationContent.append(
      t.durationLabel,
      t.durationValue,
      t.durationInput,
      t.durationMarkLabels
    );
    t.alignmentContent.append(
      t.alignmentLabel,
      t.alignmentValue,
      t.alignmentInput,
      t.alignmentEnds
    );
    this.assembleDurationMarks();
    this.assembleAlignmentEnds();
  }

  /**
   * Adds note glyphs below the duration slider at the note value steps.
   * There is no datalist, so browsers do not draw native ticks as well.
   * Each note value is an exact slider step, so the thumb can stop on it.
   */
  private assembleDurationMarks(): void {
    for (const mark of STROKE_DURATION_MARKS) {
      const position = strokeDurationToPosition(mark.duration);
      // The slider's value text names the mark, so the glyph is decorative.
      const glyph = document.createElement("img");
      const name = DURATION_TO_NAME[mark.noteDuration];
      glyph.src = resolveAssetUrl(this.assetsPath, `img/notes/${name}.svg`);
      glyph.alt = "";
      glyph.classList.add("tu-stroke-duration-mark");
      glyph.style.left = `${(position / STROKE_DURATION_MAX_POSITION) * 100}%`;
      this.template.durationMarkLabels.append(glyph);
    }
  }

  private assembleAlignmentEnds(): void {
    const fallsOnTime = document.createElement("span");
    fallsOnTime.textContent = "Falls on time";
    const startsOnTime = document.createElement("span");
    startsOnTime.textContent = "Starts on time";
    this.template.alignmentEnds.append(fallsOnTime, startsOnTime);
  }

  private renderDirection(): void {
    const t = this.template;
    t.directionFieldset.classList.add("tu-stroke-direction");
    t.directionLegend.textContent = "Direction";
    const radios = [
      [t.directionDownInput, StrokeDirection.Down],
      [t.directionUpInput, StrokeDirection.Up],
    ] as const;
    for (const [input, direction] of radios) {
      input.type = "radio";
      // Unique per editor, so radios of several editors stay separate groups.
      input.name = `tu-stroke-direction-${t.idSuffix}`;
      input.value = `${direction}`;
    }
  }

  private renderDuration(): void {
    const t = this.template;
    t.durationContent.classList.add("tu-stroke-duration");
    t.durationLabel.textContent = "Duration";
    t.durationInput.id = `tu-stroke-duration-input-${t.idSuffix}`;
    t.durationLabel.htmlFor = t.durationInput.id;
    t.durationInput.type = "range";
    t.durationInput.min = "0";
    t.durationInput.max = `${STROKE_DURATION_MAX_POSITION}`;
    t.durationInput.step = "1";
    t.durationValue.classList.add("tu-stroke-value");
    // The input's value text already speaks this value.
    t.durationValue.setAttribute("aria-hidden", "true");
    t.durationMarkLabels.classList.add("tu-stroke-duration-marks");
    t.durationMarkLabels.setAttribute("aria-hidden", "true");
  }

  private renderAlignment(): void {
    const t = this.template;
    t.alignmentContent.classList.add("tu-stroke-alignment");
    t.alignmentLabel.textContent = "Timing";
    t.alignmentInput.id = `tu-stroke-alignment-input-${t.idSuffix}`;
    t.alignmentLabel.htmlFor = t.alignmentInput.id;
    t.alignmentInput.type = "range";
    t.alignmentInput.min = `${STROKE_ALIGNMENT_STARTS_ON_TIME}`;
    t.alignmentInput.max = `${STROKE_ALIGNMENT_FALLS_ON_TIME}`;
    t.alignmentInput.step = "1";
    t.alignmentValue.classList.add("tu-stroke-value");
    t.alignmentValue.setAttribute("aria-hidden", "true");
    t.alignmentEnds.classList.add("tu-stroke-alignment-ends");
    t.alignmentEnds.setAttribute("aria-hidden", "true");
  }

  private renderActionButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-stroke-confirm-button",
      "tu-stroke-cancel-button"
    );
    this.template.removeButton.textContent = "Remove";
    this.template.removeButton.classList.add("tu-stroke-remove-button");
  }

  /** Shows the options in the inputs; the duration is shown at its nearest slider step. */
  public setOptions(options: StrokeOptions): void {
    const t = this.template;
    t.directionDownInput.checked = options.direction === StrokeDirection.Down;
    t.directionUpInput.checked = options.direction === StrokeDirection.Up;
    t.durationInput.value = `${strokeDurationToPosition(options.duration)}`;
    t.alignmentInput.value = `${STROKE_ALIGNMENT_FALLS_ON_TIME - options.alignment}`;
    this.setDurationText(options.duration);
    this.setAlignmentText(options.alignment);
  }

  /** Shows the draft duration as visible and spoken slider text. */
  public setDurationText(duration: number): void {
    const text = capitalize(describeStrokeDuration(duration));
    this.template.durationValue.textContent = text;
    this.template.durationInput.setAttribute("aria-valuetext", text);
  }

  /** Shows the draft alignment as visible and spoken slider text. */
  public setAlignmentText(alignment: number): void {
    const text = capitalize(describeStrokeAlignment(alignment));
    this.template.alignmentValue.textContent = text;
    this.template.alignmentInput.setAttribute("aria-valuetext", text);
  }

  public render(): void {
    this.renderDirection();
    this.renderDuration();
    this.renderAlignment();
    this.renderActionButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
