import { NotationComponent } from "@/notation/notation-component";
import { renderOnce, setImageAsset } from "@/ui/shared";
import { TrackControlsTemplate } from "./track-controls-template";
import { Track } from "@/notation";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;

export class TrackControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;
  readonly track: Track;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TrackControlsTemplate,
    track: Track,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.track = track;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-track-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.selectButton,
      this.template.moveUpButton,
      this.template.moveDownButton,
      this.template.trackNameInput,
      this.template.volumeInput,
      this.template.panningInput,
      this.template.muteButton,
      this.template.soloButton,
      this.template.settingsButton,
      this.template.removeButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderSelectButton(): void {
    const cssClass = "tu-track-select-button";
    const isActive =
      this.notationComponent.trackController.track === this.track;
    this.template.selectButton.classList.add(cssClass);
    this.template.selectButton.textContent = isActive ? "●" : "○";
    this.template.selectButton.classList.toggle(
      "tu-track-control-active",
      isActive
    );
    this.template.selectButton.setAttribute("aria-pressed", `${isActive}`);
  }

  private renderMoveButtons(): void {
    const trackIndex = this.notationComponent.score.tracks.indexOf(this.track);
    this.template.moveUpButton.classList.add(
      "tu-track-move-button",
      "tu-track-move-up-button"
    );
    this.template.moveUpButton.textContent = "▲";
    this.template.moveUpButton.disabled = trackIndex <= 0;
    this.template.moveUpButton.title = "Move track up";
    this.template.moveUpButton.setAttribute("aria-label", "Move track up");

    this.template.moveDownButton.classList.add(
      "tu-track-move-button",
      "tu-track-move-down-button"
    );
    this.template.moveDownButton.textContent = "▼";
    this.template.moveDownButton.disabled =
      trackIndex === -1 ||
      trackIndex >= this.notationComponent.score.tracks.length - 1;
    this.template.moveDownButton.title = "Move track down";
    this.template.moveDownButton.setAttribute("aria-label", "Move track down");
  }

  private renderTrackNameInput(): void {
    const cssClass = "tu-track-name-input";
    this.template.trackNameInput.classList.add(cssClass);
    this.template.trackNameInput.value = this.track.name;
  }

  private renderRemoveButton(): void {
    const cssClass = "tu-track-remove-button";
    this.template.removeButton.classList.add(cssClass);
    this.template.removeButton.disabled =
      this.notationComponent.score.tracks.length <= 1;
    this.template.removeButton.title = this.template.removeButton.disabled
      ? "Cannot remove the only track"
      : "Remove track";
    if (this.template.removeButton.disabled) {
      this.template.removeButton.dataset.tooltip =
        this.template.removeButton.title;
    } else {
      this.template.removeButton.removeAttribute("data-tooltip");
    }
    this.template.removeButton.textContent = "−";
    this.template.removeButton.setAttribute(
      "aria-label",
      this.template.removeButton.title
    );
  }

  private renderVolumeInput(): void {
    const cssClass = "tu-track-volume-input";
    this.template.volumeInput.classList.add(cssClass);
    this.template.volumeInput.type = "range";
    this.template.volumeInput.min = `${minVolume}`;
    this.template.volumeInput.max = `${maxVolume}`;
    this.template.volumeInput.step = `${volumeStep}`;

    this.template.volumeInput.value = `${this.track.volume * maxVolume}`;
  }

  private renderPanningInput(): void {
    const cssClass = "tu-track-panning-input";
    this.template.panningInput.classList.add(cssClass);
    this.template.panningInput.type = "range";
    this.template.panningInput.min = `${minPanning}`;
    this.template.panningInput.max = `${maxPanning}`;
    this.template.panningInput.step = `${panningStep}`;

    this.template.panningInput.value = `${this.track.pan}`;
  }

  private renderMuteButton(): void {
    const cssClass = "tu-track-mute-button";
    this.template.muteButton.classList.add(cssClass);
    setImageAsset(
      this.template.muteButton,
      this.assetsPath,
      "img/ui/mute.svg",
      "Mute"
    );
  }

  private renderSoloButton(): void {
    const cssClass = "tu-track-solo-button";
    this.template.soloButton.classList.add(cssClass);
    setImageAsset(
      this.template.soloButton,
      this.assetsPath,
      "img/ui/solo.svg",
      "Solo"
    );
  }

  private renderPlaybackState(): void {
    this.template.muteButton.classList.toggle(
      "tu-track-control-active",
      this.track.muted
    );
    this.template.muteButton.setAttribute(
      "aria-pressed",
      `${this.track.muted}`
    );
    this.template.soloButton.classList.toggle(
      "tu-track-control-active",
      this.track.soloed
    );
    this.template.soloButton.setAttribute(
      "aria-pressed",
      `${this.track.soloed}`
    );
  }

  private renderScoreSettingsButton(): void {
    const cssClass = "tu-track-settings-button";
    this.template.settingsButton.classList.add(cssClass);
    setImageAsset(
      this.template.settingsButton,
      this.assetsPath,
      "img/ui/settings.svg",
      "Track settings"
    );
  }

  public render(): void {
    this.renderRemoveButton();
    this.renderSelectButton();
    this.renderMoveButtons();
    this.renderTrackNameInput();
    this.renderVolumeInput();
    this.renderPanningInput();
    this.renderMuteButton();
    this.renderSoloButton();
    this.renderPlaybackState();
    this.renderScoreSettingsButton();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
