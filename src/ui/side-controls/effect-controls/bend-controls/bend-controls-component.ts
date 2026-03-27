import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendControlsTemplateRenderer } from "./bend-controls-template-renderer";
import { BendSelectorManager } from "./bend-selectors";

export class BendControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: BendControlsTemplate;
  readonly templateRenderer: BendControlsTemplateRenderer;
  readonly bendSelectorManager: BendSelectorManager;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new BendControlsTemplate();
    this.templateRenderer = new BendControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
    this.bendSelectorManager = new BendSelectorManager(
      this.template.bendSelectorGraphSVG
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendSelectorManager.init();
  }
}
