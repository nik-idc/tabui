import { NotationComponent } from "@/notation/notation-component";
import { SideControlsTemplate } from "./side-controls-template";

export class SideControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: SideControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: SideControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-side-controls";
    this.template.sideControlsContainer.classList.add(cssClass);

    this.template.sideControlsContainer.append(
      this.template.noteControlsTemplate.noteControlsContainer,
      this.template.effectControlsTemplate.effectControlsContainer,
      this.template.measureControlsTemplate.measureControlsContainer
    );

    this.rootDiv.appendChild(this.template.sideControlsContainer);
  }

  public render(): void {
    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
