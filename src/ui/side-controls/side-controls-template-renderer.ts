import { NotationComponent } from "@/notation/notation-component";
import { SideControlsTemplate } from "./side-controls-template";
import { renderOnce } from "@/ui/shared";

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
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
