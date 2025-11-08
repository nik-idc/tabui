import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { MeasureControlsTemplateRenderer } from "./measure-controls-template-renderer";
import { TimeSigControlsComponent } from "./time-sig-controls";
import { TempoControlsComponent } from "./tempo-controls";

export class MeasureControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: MeasureControlsTemplate;
  readonly templateRenderer: MeasureControlsTemplateRenderer;

  readonly timeSigControlsComponent: TimeSigControlsComponent;
  readonly tempoControlsComponent: TempoControlsComponent;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new MeasureControlsTemplate();
    this.templateRenderer = new MeasureControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this.timeSigControlsComponent = new TimeSigControlsComponent(
      this.rootDiv,
      this.notationComponent
    );
    this.tempoControlsComponent = new TempoControlsComponent(
      this.rootDiv,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.timeSigControlsComponent.render();
    this.tempoControlsComponent.render();
  }

  public showTempoControls(): void {
    this.tempoControlsComponent.template.tempoDialog.showModal();
  }

  public showTimeSigControls(): void {
    this.timeSigControlsComponent.template.timeSigDialog.showModal();
  }
}
