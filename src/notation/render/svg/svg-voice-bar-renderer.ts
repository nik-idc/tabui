import {
  NotationElement,
  TrackController,
  VoiceBarElement,
} from "../../controller";
import { createSVGG } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class SVGVoiceBarRenderer implements ElementRenderer {
  readonly trackController: TrackController;
  voiceBarElement: VoiceBarElement;
  readonly assetsPath: ResolvedAssetConfig;

  private _containerGroupSVG?: SVGGElement;

  constructor(
    trackController: TrackController,
    voiceBarElement: VoiceBarElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.voiceBarElement = voiceBarElement;
    this.assetsPath = assetsPath;
  }

  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `voice-bar-${this.voiceBarElement.voiceBar.uuid}`
    );
    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    this._containerGroupSVG?.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: VoiceBarElement): void {
    this.voiceBarElement = element;
  }

  public render(): void {
    this.ensureContainerGroup();
  }

  public unrender(): void {}
}
