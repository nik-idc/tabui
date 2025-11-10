import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../../effect-controls/bend-controls";

import { TimeSigControlsTemplate } from "./time-sig-controls-template";
import { TimeSigControlsTemplateRenderer } from "./time-sig-controls-template-renderer";
export class TimeSigControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TimeSigControlsTemplate;
  readonly templateRenderer: TimeSigControlsTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TimeSigControlsTemplate();
    this.templateRenderer = new TimeSigControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
