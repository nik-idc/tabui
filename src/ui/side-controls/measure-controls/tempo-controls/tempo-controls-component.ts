import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import { TempoControlsTemplate } from "./tempo-controls-template";
import { TempoControlsTemplateRenderer } from "./tempo-controls-template-renderer";

export class TempoControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TempoControlsTemplate;
  readonly templateRenderer: TempoControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TempoControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new TempoControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
