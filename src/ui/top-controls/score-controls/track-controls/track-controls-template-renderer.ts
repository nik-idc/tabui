import { NotationComponent } from "../../../../notation/notation-component";
import { renderOnce, renderVolumeSlider, setImageAsset } from "../../../shared";
import { TrackControlsTemplate } from "./track-controls-template";
import { Track } from "../../../../notation";
import type { ResolvedAssetConfig } from "../../../../assets";

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
      this.template.moveUpButton,
      this.template.moveDownButton,
      this.template.trackNameInput,
      this.template.trackNameLabel,
      this.template.volumeControls,
      this.template.panningControls,
      this.template.muteButton,
      this.template.soloButton,
      this.template.settingsButton,
      this.template.removeButton
    );
    this.template.volumeControls.append(this.template.volumeInput);
    this.template.panningControls.append(this.template.panningInput);
    this.parentDiv.appendChild(this.template.container);
  }

  private renderTrackRow(): void {
    const isActive =
      this.notationComponent.trackController.track === this.track;
    this.template.container.classList.toggle(
      "tu-track-control-active",
      isActive
    );
    this.template.container.setAttribute("role", "group");
    this.template.container.setAttribute(
      "aria-label",
      `Track: ${this.track.name}`
    );
    this.template.container.setAttribute("aria-current", `${isActive}`);
    this.template.container.tabIndex = 0;
  }

  private renderMoveButtons(): void {
    const trackIndex = this.notationComponent.score.tracks.indexOf(this.track);
    this.template.moveUpButton.classList.add(
      "tu-track-move-button",
      "tu-track-move-up-button"
    );
    this.template.moveUpButton.textContent = "▲";
    const controller = this.notationComponent.trackController;
    this.template.moveUpButton.disabled = !controller.canMoveTrack(
      this.track,
      trackIndex - 1
    );
    this.template.moveUpButton.title = "Move track up";
    this.template.moveUpButton.setAttribute(
      "aria-label",
      `Move ${this.track.name} up`
    );

    this.template.moveDownButton.classList.add(
      "tu-track-move-button",
      "tu-track-move-down-button"
    );
    this.template.moveDownButton.textContent = "▼";
    this.template.moveDownButton.disabled = !controller.canMoveTrack(
      this.track,
      trackIndex + 1
    );
    this.template.moveDownButton.title = "Move track down";
    this.template.moveDownButton.setAttribute(
      "aria-label",
      `Move ${this.track.name} down`
    );
  }

  private renderTrackNameInput(): void {
    const isActive =
      this.notationComponent.trackController.track === this.track;
    const cssClass = "tu-track-name-input";
    this.template.trackNameInput.classList.add(cssClass);
    this.template.trackNameInput.setAttribute(
      "aria-label",
      `${this.track.name} name`
    );
    this.template.trackNameInput.value = this.track.name;
    const controller = this.notationComponent.trackController;
    this.template.trackNameInput.disabled = !controller.canEdit;
    this.template.trackNameLabel.className = "tu-track-name-label";
    this.template.trackNameLabel.textContent = this.track.name;
    this.template.trackNameLabel.hidden = isActive;
    this.template.trackNameInput.hidden = !isActive;
  }

  private renderRemoveButton(): void {
    const cssClass = "tu-track-remove-button";
    this.template.removeButton.classList.add(cssClass);
    const disabled = !this.notationComponent.trackController.canRemoveTrack(
      this.notationComponent.score
    );
    this.template.removeButton.classList.toggle("tu-disabled-img", disabled);
    this.template.removeButton.disabled = disabled;
    this.template.removeButton.setAttribute("aria-disabled", `${disabled}`);
    setImageAsset(
      this.template.removeButton,
      this.assetsPath,
      "img/ui/remove.svg",
      "Remove track"
    );
    const label = disabled
      ? `Cannot remove ${this.track.name}; it is the only track`
      : `Remove ${this.track.name}`;
    this.template.removeButton.title = label;
    this.template.removeButton.dataset.tooltip = label;
    this.template.removeButton.setAttribute("aria-label", label);
  }

  private renderVolumeInput(): void {
    const cssClass = "tu-track-volume-input";
    this.template.volumeInput.classList.add(cssClass);
    renderVolumeSlider(
      this.template.volumeInput,
      this.track.volume,
      `${this.track.name} volume`
    );
    this.template.volumeInput.disabled =
      !this.notationComponent.trackController.canChangeMix;
    this.template.volumeControls.classList.add("tu-track-volume-controls");
  }

  private renderPanningInput(): void {
    const cssClass = "tu-track-panning-input";
    this.template.panningInput.classList.add(cssClass);
    this.template.panningInput.type = "range";
    this.template.panningInput.min = `${minPanning}`;
    this.template.panningInput.max = `${maxPanning}`;
    this.template.panningInput.step = `${panningStep}`;
    this.template.panningInput.setAttribute(
      "aria-label",
      `${this.track.name} panning`
    );
    this.template.panningInput.title = `${this.track.name} pan`;

    this.template.panningInput.value = `${this.track.pan}`;
    this.template.panningInput.disabled =
      !this.notationComponent.trackController.canChangeMix;
    this.template.panningControls.classList.add("tu-track-panning-controls");
  }

  private renderMuteButton(): void {
    const cssClass = "tu-track-mute-button";
    this.template.muteButton.classList.add(cssClass);
    setImageAsset(
      this.template.muteButton,
      this.assetsPath,
      "img/ui/mute.svg",
      `${this.track.name} mute`
    );
  }

  private renderSoloButton(): void {
    const cssClass = "tu-track-solo-button";
    this.template.soloButton.classList.add(cssClass);
    setImageAsset(
      this.template.soloButton,
      this.assetsPath,
      "img/ui/solo.svg",
      `${this.track.name} solo`
    );
  }

  private renderPlaybackState(): void {
    const editingDisabled =
      !this.notationComponent.trackController.canChangeMix;
    for (const button of [this.template.muteButton, this.template.soloButton]) {
      button.classList.toggle("tu-disabled-img", editingDisabled);
      button.disabled = editingDisabled;
      button.setAttribute("aria-disabled", `${editingDisabled}`);
    }
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
      `${this.track.name} settings`
    );
    const controller = this.notationComponent.trackController;
    const editingDisabled = !controller.canEdit;
    this.template.settingsButton.classList.toggle(
      "tu-disabled-img",
      editingDisabled
    );
    this.template.settingsButton.disabled = editingDisabled;
    this.template.settingsButton.setAttribute(
      "aria-disabled",
      `${editingDisabled}`
    );
  }

  public render(): void {
    this.renderRemoveButton();
    this.renderTrackRow();
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
