import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import {
  BeatGuitarTechniqueType,
  DEFAULT_STROKE_DURATION,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_ALIGNMENT_STARTS_ON_TIME,
  StrokeDirection,
  StrokeOptions,
} from "../../../../notation/model";
import {
  StrokeControlsTemplate,
  strokeDurationFromPosition,
} from "./stroke-controls-template";
import { StrokeControlsTemplateRenderer } from "./stroke-controls-template-renderer";

/** Settings shown for a beat without a stroke. */
const DEFAULT_STROKE_OPTIONS = new StrokeOptions({
  direction: StrokeDirection.Down,
  duration: DEFAULT_STROKE_DURATION,
  alignment: STROKE_ALIGNMENT_STARTS_ON_TIME,
});

/** Stroke settings dialog for the cursor beat or the selected beats. */
export class StrokeControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: StrokeControlsTemplate;
  readonly templateRenderer: StrokeControlsTemplateRenderer;

  /**
   * Draft duration in stroke ticks. Kept apart from the slider, so a saved
   * duration between slider steps stays exact until the slider moves.
   */
  private _draftDuration: number = DEFAULT_STROKE_DURATION;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new StrokeControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new StrokeControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }

  /** Shows the first selected stroke's settings, or the defaults, before opening. */
  public prepareForOpen(): void {
    const controller = this.notationComponent.trackController;
    const stroke = controller.getSelectedBeatTechnique(
      BeatGuitarTechniqueType.Stroke
    );
    const options = stroke?.options ?? DEFAULT_STROKE_OPTIONS;
    this._draftDuration = options.duration;
    this.templateRenderer.setOptions(options);
    this.template.removeButton.disabled = stroke === undefined;
  }

  /** Updates the draft duration from the slider position. */
  public onDurationInput(): void {
    const position = Number(this.template.durationInput.value);
    this._draftDuration = strokeDurationFromPosition(position);
    this.templateRenderer.setDurationText(this._draftDuration);
  }

  /** Updates the alignment text from the slider position. */
  public onAlignmentInput(): void {
    this.templateRenderer.setAlignmentText(this.draftAlignment);
  }

  /** Alignment from the slider, whose left end is "falls on time". */
  private get draftAlignment(): number {
    const position = Number(this.template.alignmentInput.value);
    return STROKE_ALIGNMENT_FALLS_ON_TIME - position;
  }

  /** Validated settings from the dialog inputs. */
  public getDraftOptions(): StrokeOptions {
    const direction = this.template.directionUpInput.checked
      ? StrokeDirection.Up
      : StrokeDirection.Down;
    return new StrokeOptions({
      direction,
      duration: this._draftDuration,
      alignment: this.draftAlignment,
    });
  }
}
