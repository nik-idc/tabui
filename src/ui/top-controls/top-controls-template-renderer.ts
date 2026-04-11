import { NotationComponent } from "@/notation/notation-component";
import { renderOnce } from "@/ui/shared";
import { TopControlsTemplate } from "./top-controls-template";

export class TopControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TopControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TopControlsTemplate
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-top-controls";
    this.template.container.classList.add(cssClass);

    this.parentDiv.appendChild(this.template.container);
  }

  public render(): void {
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
