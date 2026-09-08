import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import { FretControlsTemplate } from "./fret-controls-template";
import { FretControlsTemplateRenderer } from "./fret-controls-template-renderer";

/** Owns the fret editor dialog and its rendered controls. */
export class FretControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: FretControlsTemplate;
  readonly templateRenderer: FretControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = new FretControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new FretControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }

  public showControls(): void {
    this.render();
    this.dialog.showModal();
  }
}
