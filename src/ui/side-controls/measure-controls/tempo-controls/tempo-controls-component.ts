import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../../effect-controls/bend-controls";
import { TempoControlsTemplate } from "./tempo-controls-template";
import { TempoControlsTemplateRenderer } from "./tempo-controls-template-renderer";

export class TempoControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TempoControlsTemplate;
  readonly templateRenderer: TempoControlsTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TempoControlsTemplate();
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
