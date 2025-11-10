import { NotationComponent } from "@/notation/notation-component";
import { SideControlsTemplate } from "./side-controls-template";

export class SideControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: SideControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: SideControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-side-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.noteControlsTemplate.container,
      this.template.effectControlsTemplate.container,
      this.template.measureControlsTemplate.container
    );

    this.parentDiv.appendChild(this.template.container);
  }

  public render(): void {
    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
