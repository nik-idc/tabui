import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";

import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { StrokeControlsComponent } from "./stroke-controls/stroke-controls-component";

import { TechniqueControlsTemplate } from "./technique-controls-template";
import { TechniqueControlsTemplateRenderer } from "./technique-controls-template-renderer";

export class TechniqueControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TechniqueControlsTemplate;
  readonly templateRenderer: TechniqueControlsTemplateRenderer;

  readonly bendControlsComponent: BendControlsComponent;
  readonly strokeControlsComponent: StrokeControlsComponent;

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
    this.strokeControlsComponent = new StrokeControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendControlsComponent.render();
    this.strokeControlsComponent.render();
  }

  public showBendControls(): void {
    this.bendControlsComponent.prepareForOpen();
    this.bendControlsComponent.dialog.showModal();
  }

  /** Opens stroke settings for the cursor beat or the selected beats. */
  public showStrokeControls(): void {
    this.strokeControlsComponent.prepareForOpen();
    this.strokeControlsComponent.dialog.showModal();
  }
}
