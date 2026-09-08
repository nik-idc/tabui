import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { MeasureControlsTemplateRenderer } from "./measure-controls-template-renderer";
import { TimeSigControlsComponent } from "./time-sig-controls";
import { TempoControlsComponent } from "./tempo-controls";
import { RepeatCountControlsComponent } from "./repeat-count-controls";

export class MeasureControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: MeasureControlsTemplate;
  readonly templateRenderer: MeasureControlsTemplateRenderer;

  readonly timeSigControlsComponent: TimeSigControlsComponent;
  readonly tempoControlsComponent: TempoControlsComponent;
  readonly repeatCountControlsComponent: RepeatCountControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new MeasureControlsTemplate();
    this.templateRenderer = new MeasureControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.timeSigControlsComponent = new TimeSigControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent
    );
    this.tempoControlsComponent = new TempoControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent
    );
    this.repeatCountControlsComponent = new RepeatCountControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.timeSigControlsComponent.render();
    this.tempoControlsComponent.render();
    this.repeatCountControlsComponent.render();
  }

  public showTempoControls(): void {
    this.tempoControlsComponent.render();
    this.tempoControlsComponent.dialog.showModal();
  }

  public showTimeSigControls(): void {
    this.timeSigControlsComponent.render();
    this.timeSigControlsComponent.dialog.showModal();
  }

  public showRepeatCountControls(): void {
    this.repeatCountControlsComponent.render();
    this.repeatCountControlsComponent.dialog.showModal();
  }
}
