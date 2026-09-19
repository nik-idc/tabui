import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";
import { template } from "@babel/core";

import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { TimeSigControlsComponent } from "../measure-controls/time-sig-controls";
import { TechniqueControlsTemplate } from "./technique-controls-template";
import { TechniqueControlsTemplateRenderer } from "./technique-controls-template-renderer";

export class TechniqueControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TechniqueControlsTemplate;
  readonly templateRenderer: TechniqueControlsTemplateRenderer;

  readonly bendControlsComponent: BendControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    announce: (text: string) => void
  ) {
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
      dialogEnforcer,
      this.notationComponent,
      announce
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendControlsComponent.render();
  }

  public showBendControls(): void {
    this.bendControlsComponent.prepareForOpen();
    this.bendControlsComponent.dialog.showModal();
  }
}
