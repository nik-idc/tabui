import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../../effect-controls/bend-controls";
import { TupletControlsTemplate } from "./tuplet-controls-template";
import { TupletControlsTemplateRenderer } from "./tuplet-controls-template-renderer";

export class TupletControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TupletControlsTemplate;
  readonly templateRenderer: TupletControlsTemplateRenderer;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new TupletControlsTemplate();
    this.templateRenderer = new TupletControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
