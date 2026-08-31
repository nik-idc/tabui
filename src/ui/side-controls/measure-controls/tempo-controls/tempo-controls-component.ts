import { NotationComponent } from "../../../../notation/notation-component";
import { TempoControlsTemplate } from "./tempo-controls-template";
import { TempoControlsTemplateRenderer } from "./tempo-controls-template-renderer";

export class TempoControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TempoControlsTemplate;
  readonly templateRenderer: TempoControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TempoControlsTemplate(dialogHost);
    this.templateRenderer = new TempoControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
