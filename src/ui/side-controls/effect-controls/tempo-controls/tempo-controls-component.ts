import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../bend-controls";
import { TempoControlsTemplate } from "./tempo-controls-template";
import { TempoControlsTemplateRenderer } from "./tempo-controls-template-renderer";

export class TempoControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TempoControlsTemplate;
  readonly templateRenderer: TempoControlsTemplateRenderer;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new TempoControlsTemplate();
    this.templateRenderer = new TempoControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
