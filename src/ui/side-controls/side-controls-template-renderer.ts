import { NotationComponent } from "../../notation/notation-component";
import { SideControlsTemplate } from "./side-controls-template";
import { renderOnce } from "../shared";

export class SideControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: SideControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: SideControlsTemplate
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-side-controls";
    this.template.container.classList.add(cssClass);

    this.parentDiv.appendChild(this.template.container);
  }

  public render(): void {
    const controller = this.notationComponent.trackController;
    const editingDisabled =
      !controller.editingEnabled || controller.isPlaybackActive;
    this.template.container.inert = editingDisabled;
    this.template.container.classList.toggle(
      "tu-editing-disabled",
      editingDisabled
    );
    this.template.container.setAttribute("aria-disabled", `${editingDisabled}`);
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
