import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../../technique-controls/bend-controls";
import { TupletControlsTemplate } from "./tuplet-controls-template";
import { TupletControlsTemplateRenderer } from "./tuplet-controls-template-renderer";

export class TupletControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TupletControlsTemplate;
  readonly templateRenderer: TupletControlsTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TupletControlsTemplate();
    this.templateRenderer = new TupletControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
