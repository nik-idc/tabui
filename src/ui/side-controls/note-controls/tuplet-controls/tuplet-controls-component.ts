import { NotationComponent } from "../../../../notation/notation-component";
import { TupletControlsTemplate } from "./tuplet-controls-template";
import { TupletControlsTemplateRenderer } from "./tuplet-controls-template-renderer";

export class TupletControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TupletControlsTemplate;
  readonly templateRenderer: TupletControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TupletControlsTemplate(dialogHost);
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
