import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../bend-controls";

import { TimeSigControlsTemplate } from "./time-sig-controls-template";
import { TimeSigControlsTemplateRenderer } from "./time-sig-controls-template-renderer";
export class TimeSigControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TimeSigControlsTemplate;
  readonly templateRenderer: TimeSigControlsTemplateRenderer;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new TimeSigControlsTemplate();
    this.templateRenderer = new TimeSigControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
