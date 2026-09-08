import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";

import { TimeSigControlsTemplate } from "./time-sig-controls-template";
import { TimeSigControlsTemplateRenderer } from "./time-sig-controls-template-renderer";
export class TimeSigControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TimeSigControlsTemplate;
  readonly templateRenderer: TimeSigControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TimeSigControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
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
