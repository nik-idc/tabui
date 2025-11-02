import { NotationComponent } from "@/notation/notation-component";
import { TopControlsTemplate } from "./top-controls-template";
import { createOption } from "@/shared";
import {
  TrackControlsComponent,
  TrackControlsTemplate,
} from "./score-controls/track-controls";

export class TopControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TopControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TopControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-top-controls";
    this.template.topControlsContainer.classList.add(cssClass);

    this.template.topControlsContainer.append(
      this.template.scoreControlsTemplate.scoreControlsContainer,
      this.template.playControlsTemplate.playControlsContainer
    );
    this.rootDiv.appendChild(this.template.topControlsContainer);
  }

  public render(): void {
    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
