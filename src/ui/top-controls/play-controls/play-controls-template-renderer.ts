import { NotationComponent } from "../../../notation/notation-component";
import { renderOnce, setImageAsset } from "../../shared";
import { PlayControlsTemplate } from "./play-controls-template";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

const buttonSize = `30px`;

export class PlayControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: PlayControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: PlayControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-play-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.firstButton,
      this.template.prevButton,
      this.template.playButton,
      this.template.nextButton,
      this.template.lastButton,
      this.template.loopButton,
      this.template.rangeButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderPlayButtons(): void {
    setImageAsset(
      this.template.firstButton,
      this.assetsPath,
      "img/ui/first.svg",
      "First bar",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );

    setImageAsset(
      this.template.prevButton,
      this.assetsPath,
      "img/ui/prev.svg",
      "Prev bar",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );

    const isPlaying = this.notationComponent.trackController.isPlaying;
    setImageAsset(
      this.template.playButton,
      this.assetsPath,
      isPlaying ? "img/ui/pause.svg" : "img/ui/play.svg",
      isPlaying ? "Pause" : "Play",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );
    this.template.playButton.classList.toggle(
      "tu-track-control-active",
      isPlaying
    );
    this.template.playButton.setAttribute("aria-pressed", `${isPlaying}`);

    setImageAsset(
      this.template.nextButton,
      this.assetsPath,
      "img/ui/next.svg",
      "Next bar",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );

    setImageAsset(
      this.template.lastButton,
      this.assetsPath,
      "img/ui/last.svg",
      "Last bar",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );

    setImageAsset(
      this.template.loopButton,
      this.assetsPath,
      "img/ui/loop.svg",
      "Loop",
      {
        width: buttonSize,
        height: buttonSize,
      }
    );
    this.template.loopButton.classList.toggle(
      "tu-track-control-active",
      this.notationComponent.trackController.isLooped
    );
    this.template.loopButton.setAttribute(
      "aria-pressed",
      String(this.notationComponent.trackController.isLooped)
    );

    const hasSelectionAnchor =
      this.notationComponent.trackController.hasSelectionAnchor;
    this.template.rangeButton.classList.add("tu-range-selection-button");
    const label = hasSelectionAnchor ? "Clear range" : "Set anchor";
    setImageAsset(
      this.template.rangeButton,
      this.assetsPath,
      `img/ui/${hasSelectionAnchor ? "clear-range" : "set-anchor"}.svg`,
      label,
      { width: buttonSize, height: buttonSize }
    );
    this.template.rangeButton.title = label;
  }
  /**
   * Responsible for setting up the note controls:
   * Duration change, Dots & Tuplets
   */
  public render(): void {
    this.renderPlayButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
