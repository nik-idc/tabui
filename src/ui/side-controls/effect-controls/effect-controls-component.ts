import { NotationComponent } from "@/notation/notation-component";
import { template } from "@babel/core";

import { EffectControlsTemplate } from "./effect-controls-template";
import { EffectControlsTemplateRenderer } from "./effect-controls-template-renderer";
import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { TimeSigControlsComponent } from "./time-sig-controls";

export class EffectControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: EffectControlsTemplate;
  readonly templateRenderer: EffectControlsTemplateRenderer;

  readonly bendControlsComponent: BendControlsComponent;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new EffectControlsTemplate();
    this.templateRenderer = new EffectControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this.bendControlsComponent = new BendControlsComponent(
      this.template.effectControlsContainer,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendControlsComponent.render();
  }
}
