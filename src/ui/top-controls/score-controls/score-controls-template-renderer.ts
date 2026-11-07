import { NotationComponent } from "../../../notation/notation-component";
import { renderOnce, setImageAsset } from "../../shared";
import { ScoreControlsTemplate } from "./score-controls-template";
import { Score } from "../../../notation";
import type { ResolvedAssetConfig } from "../../../assets";

const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;

export class ScoreControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly overlayParent: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: ScoreControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  private _currentScoreName: string = "Score name";

  constructor(
    parentDiv: HTMLDivElement,
    overlayParent: HTMLDivElement,
    notationComponent: NotationComponent,
    template: ScoreControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.overlayParent = overlayParent;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const containerCSSClass = "tu-score-controls";
    const masterCSSClass = "tu-master-controls";
    const settingsCSSClass = "tu-settings";

    this.template.container.classList.add(containerCSSClass);
    this.template.masterContainer.classList.add(masterCSSClass);
    this.template.settingsContainer.classList.add(settingsCSSClass);
    this.template.tracksContainer.classList.add(
      "tu-tracks",
      "tu-track-controls-overlay"
    );

    this.template.container.append(this.template.masterContainer);
    this.template.masterContainer.append(
      this.template.scoreNameInput,
      this.template.settingsContainer
    );
    this.template.settingsContainer.append(
      this.template.newTrackButton,
      this.template.showTracksButton,
      this.template.masterVolumeControls,
      this.template.masterPanningControls
    );
    this.template.masterVolumeControls.append(this.template.masterVolumeInput);
    this.template.masterPanningControls.append(
      this.template.masterPanningInput
    );

    this.parentDiv.appendChild(this.template.container);
    this.overlayParent.appendChild(this.template.tracksContainer);
  }

  private renderShowButton(score: Score, tracksAreDisplayed: boolean): void {
    const cssClass = "tu-show-tracks-button";
    const trackCount = score.tracks.length;
    const trackCountLabel =
      trackCount === 1 ? "1 track" : `${trackCount} tracks`;
    const label = `Tracks · ${this.notationComponent.trackController.track.name} · ${trackCountLabel}`;
    this.template.showTracksButton.classList.add(cssClass);
    this.template.showTracksButton.textContent = label;
    this.template.showTracksButton.setAttribute("aria-label", label);
    this.template.showTracksButton.title = label;
    this.template.showTracksButton.setAttribute(
      "aria-expanded",
      `${tracksAreDisplayed}`
    );
  }

  private renderNewTrackButton(): void {
    const cssClass = "tu-new-track-button";
    this.template.newTrackButton.classList.add(cssClass);
    setImageAsset(
      this.template.newTrackButton,
      this.assetsPath,
      "img/ui/add.svg",
      "New track"
    );
    const controller = this.notationComponent.trackController;
    const editingDisabled =
      !controller.editingEnabled || controller.isPlaybackActive;
    this.template.newTrackButton.classList.toggle(
      "tu-disabled-img",
      editingDisabled
    );
    this.template.newTrackButton.setAttribute(
      "aria-disabled",
      `${editingDisabled}`
    );
    this.template.newTrackButton.disabled = editingDisabled;
  }

  private renderMasterVolumeInput(score: Score): void {
    const cssClass = "tu-master-volume-input";
    this.template.masterVolumeControls.classList.add(
      "tu-master-volume-controls"
    );
    this.template.masterVolumeInput.classList.add(cssClass);
    this.template.masterVolumeInput.type = "range";
    this.template.masterVolumeInput.min = `${minVolume}`;
    this.template.masterVolumeInput.max = `${maxVolume}`;
    this.template.masterVolumeInput.step = `${volumeStep}`;
    this.template.masterVolumeInput.ariaLabel = "Master volume";
    this.template.masterVolumeInput.title = "Master volume";

    this.template.masterVolumeInput.value = `${score.masterVolume * 100}`;
    this.template.masterVolumeInput.disabled =
      !this.notationComponent.trackController.editingEnabled;
  }

  private renderMasterPanningInput(score: Score): void {
    const cssClass = "tu-master-panning-input";
    this.template.masterPanningControls.classList.add(
      "tu-master-panning-controls"
    );
    this.template.masterPanningInput.classList.add(cssClass);
    this.template.masterPanningInput.type = "range";
    this.template.masterPanningInput.min = `${minPanning}`;
    this.template.masterPanningInput.max = `${maxPanning}`;
    this.template.masterPanningInput.step = `${panningStep}`;
    this.template.masterPanningInput.ariaLabel = "Master panning";
    this.template.masterPanningInput.title = "Master pan";

    this.template.masterPanningInput.value = `${score.masterPan}`;
    this.template.masterPanningInput.disabled =
      !this.notationComponent.trackController.editingEnabled;
  }

  private renderScoreNameInput(): void {
    const cssClass = "tu-score-name-input";
    this.template.scoreNameInput.classList.add(cssClass);
    this.template.scoreNameInput.ariaLabel = "Score name";
    this.template.scoreNameInput.value = this._currentScoreName;
    const controller = this.notationComponent.trackController;
    const readOnly = !controller.editingEnabled || controller.isPlaybackActive;
    this.template.scoreNameInput.disabled = readOnly;
    this.template.scoreNameInput.tabIndex = readOnly ? -1 : 0;
  }

  private renderTracksContainer(): void {
    const cssClass = "tu-tracks";
    this.template.tracksContainer.classList.add(cssClass);
  }

  public render(score: Score, tracksAreDisplayed: boolean): void {
    this._currentScoreName = score.name;

    this.renderShowButton(score, tracksAreDisplayed);
    this.renderNewTrackButton();
    this.renderMasterVolumeInput(score);
    this.renderMasterPanningInput(score);
    this.renderScoreNameInput();
    this.renderTracksContainer();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
