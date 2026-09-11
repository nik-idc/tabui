import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import { TupletControlsTemplate } from "./tuplet-controls-template";
import { TupletControlsTemplateRenderer } from "./tuplet-controls-template-renderer";

export class TupletControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TupletControlsTemplate;
  readonly templateRenderer: TupletControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    private readonly _announce: (text: string) => void
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TupletControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new TupletControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
    for (const control of [
      this.template.normalControl,
      this.template.tupletControl,
    ]) {
      control.addEventListener("focusin", () => this.announceValue());
    }
  }

  /** Announces both draft counts so each step retains the ratio context. */
  public announceValue(): void {
    this._announce(
      `Normal count ${this.template.normalValue.textContent}, ` +
        `tuplet count ${this.template.tupletValue.textContent}`
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
