import { NotationComponent } from "../../../notation/notation-component";
import { StaffControlsTemplate } from "./staff-controls-template";
import { StaffControlsTemplateRenderer } from "./staff-controls-template-renderer";

export class StaffControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: StaffControlsTemplate;
  readonly templateRenderer: StaffControlsTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new StaffControlsTemplate();
    this.templateRenderer = new StaffControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
