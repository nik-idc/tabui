import { NotationComponent } from "@/notation/notation-component";
import { template } from "@babel/core";

import { TechniqueControlsTemplate } from "./technique-controls-template";
import { TechniqueControlsTemplateRenderer } from "./technique-controls-template-renderer";
import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { TimeSigControlsComponent } from "../measure-controls/time-sig-controls";

export class TechniqueControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TechniqueControlsTemplate;
  readonly templateRenderer: TechniqueControlsTemplateRenderer;

  readonly bendControlsComponent: BendControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TechniqueControlsTemplate();
    this.templateRenderer = new TechniqueControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.bendControlsComponent = new BendControlsComponent(
      this.template.container,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendControlsComponent.render();
  }

  public showBendControls(): void {
    this.bendControlsComponent.template.dialog.showModal();
  }
}
