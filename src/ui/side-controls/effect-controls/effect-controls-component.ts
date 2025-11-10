import { NotationComponent } from "@/notation/notation-component";
import { template } from "@babel/core";

import { EffectControlsTemplate } from "./effect-controls-template";
import { EffectControlsTemplateRenderer } from "./effect-controls-template-renderer";
import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { TimeSigControlsComponent } from "../measure-controls/time-sig-controls";

export class EffectControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: EffectControlsTemplate;
  readonly templateRenderer: EffectControlsTemplateRenderer;

  readonly bendControlsComponent: BendControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new EffectControlsTemplate();
    this.templateRenderer = new EffectControlsTemplateRenderer(
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
