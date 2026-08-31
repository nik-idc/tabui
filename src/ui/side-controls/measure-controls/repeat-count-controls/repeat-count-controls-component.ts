import { NotationComponent } from "../../../../notation/notation-component";
import { RepeatCountControlsTemplate } from "./repeat-count-controls-template";
import { RepeatCountControlsTemplateRenderer } from "./repeat-count-controls-template-renderer";

export class RepeatCountControlsComponent {
  readonly template: RepeatCountControlsTemplate;
  readonly templateRenderer: RepeatCountControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent
  ) {
    this.template = new RepeatCountControlsTemplate(dialogHost);
    this.templateRenderer = new RepeatCountControlsTemplateRenderer(
      parentDiv,
      notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
