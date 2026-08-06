import {
  NotationElement,
  TrackController,
  VoiceBarRhythmElement,
} from "../../controller";
import { createSVGG } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class SVGVoiceBarRhythmRenderer implements ElementRenderer {
  readonly trackController: TrackController;
  voiceBarRhythmElement: VoiceBarRhythmElement;
  readonly assetsPath: ResolvedAssetConfig;

  private _containerGroupSVG?: SVGGElement;

  constructor(
    trackController: TrackController,
    voiceBarRhythmElement: VoiceBarRhythmElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.voiceBarRhythmElement = voiceBarRhythmElement;
    this.assetsPath = assetsPath;
  }

  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `voice-bar-rhythm-${this.voiceBarRhythmElement.uuid}`
    );
    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    this._containerGroupSVG?.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: VoiceBarRhythmElement): void {
    this.voiceBarRhythmElement = element;
  }

  public render(): void {
    this.ensureContainerGroup();
  }

  public unrender(): void {}
}
