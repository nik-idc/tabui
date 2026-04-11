import { NotationComponent } from "@/notation/notation-component";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import { TopControlsTemplate } from "./top-controls-template";
import { createOption } from "@/shared";
import {
  TrackControlsComponent,
  TrackControlsTemplate,
} from "./score-controls/track-controls";

export class TopControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TopControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TopControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-top-controls";
    this.template.container.classList.add(cssClass);

    this.parentDiv.appendChild(this.template.container);
  }

  public render(): void {
    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
