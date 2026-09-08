import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import { RepeatCountControlsTemplate } from "./repeat-count-controls-template";
import { RepeatCountControlsTemplateRenderer } from "./repeat-count-controls-template-renderer";

export class RepeatCountControlsComponent {
  readonly dialog: ContainedDialog;
  readonly template: RepeatCountControlsTemplate;
  readonly templateRenderer: RepeatCountControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.template = new RepeatCountControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
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
