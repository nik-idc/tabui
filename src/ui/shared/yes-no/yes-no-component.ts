import { ContainedDialog } from "../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";
import { YesNoTemplateRenderer } from "./yes-no-template-renderer";
import { YesNoTemplate } from "./yes-no-template";

export class YesNoComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: YesNoTemplate;
  readonly templateRenderer: YesNoTemplateRenderer;

  private _text: string;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    text: string = "Are you sure?"
  ) {
    this._text = text;

    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new YesNoTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new YesNoTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template,
      this._text
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }

  public setText(text: string): void {
    this._text = text;
    this.templateRenderer.setText(text);
  }
}
