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
    notationComponent: NotationComponent,
    private readonly _announce: (text: string) => void
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
    this.template.valueControl.addEventListener("focusin", () =>
      this.announceValue()
    );
  }

  /** Announces the draft count for custom steps, not native input edits. */
  public announceValue(): void {
    this._announce(`Repeat count ${this.template.value.value}`);
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
