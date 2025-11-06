import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendControlsTemplateRenderer } from "./bend-controls-template-renderer";
import { BendSelectorManager } from "./bend-selectors";

export class BendControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: BendControlsTemplate;
  readonly templateRenderer: BendControlsTemplateRenderer;
  readonly bendSelectorManager: BendSelectorManager;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new BendControlsTemplate();
    this.templateRenderer = new BendControlsTemplateRenderer(
      this.rootDiv,
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
