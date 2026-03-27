import { NotationComponent } from "@/notation/notation-component";
import { createOption } from "@/shared";
import { TrackControlsTemplate } from "./track-controls-template";
import { Track } from "@/notation";

const assetsPath = import.meta.env.BASE_URL;

// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!
const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;
// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!

export class TrackControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackControlsTemplate;
  readonly assetsPath: string;
  readonly track: Track;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TrackControlsTemplate,
    track: Track,
    assetsPath: string = import.meta.env.BASE_URL
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
      this.template.removeButton,
      this.template.trackButton,
      this.template.volumeInput,
      this.template.panningInput,
      this.template.muteButton,
      this.template.soloButton,
      this.template.settingsButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderTrackName(): void {
    const cssClass = "tu-track-button";
    this.template.trackButton.classList.add(cssClass);
    this.template.trackButton.textContent = this.track.name;
  }

  private renderRemoveButton(): void {
    const cssClass = "tu-track-remove-button";
    this.template.muteButton.classList.add(cssClass);
    const src = `${assetsPath}/img/ui/remove.svg`;
    this.template.removeButton.src = src;
    this.template.removeButton.alt = "Remove";
  }

  private renderVolumeInput(): void {
    const cssClass = "tu-track-volume-input";
    this.template.volumeInput.classList.add(cssClass);
    this.template.volumeInput.type = "range";
    this.template.volumeInput.min = `${minVolume}`;
    this.template.volumeInput.max = `${maxVolume}`;
    this.template.volumeInput.step = `${volumeStep}`;

    this.template.volumeInput.value = `${(minVolume + maxVolume) / 2}`;
  }

  private renderPanningInput(): void {
    const cssClass = "tu-track-panning-input";
    this.template.panningInput.classList.add(cssClass);
    this.template.panningInput.type = "range";
    this.template.panningInput.min = `${minPanning}`;
    this.template.panningInput.max = `${maxPanning}`;
    this.template.panningInput.step = `${panningStep}`;

    this.template.panningInput.value = `${0}`;
  }

  private renderMuteButton(): void {
    const cssClass = "tu-track-mute-button";
    this.template.muteButton.classList.add(cssClass);
    const src = `${assetsPath}/img/ui/mute.svg`;
    this.template.muteButton.src = src;
    this.template.muteButton.alt = "Mute";
  }

  private renderSoloButton(): void {
    const cssClass = "tu-track-solo-button";
    this.template.soloButton.classList.add(cssClass);
    const src = `${assetsPath}/img/ui/solo.svg`;
    this.template.soloButton.src = src;
    this.template.soloButton.alt = "Solo";
  }

  private renderScoreSettingsButton(): void {
    const cssClass = "tu-track-settings-button";
    this.template.settingsButton.classList.add(cssClass);
    const src = `${assetsPath}/img/ui/settings.svg`;
    this.template.settingsButton.src = src;
    this.template.settingsButton.alt = "Track settings";
  }

  public render(): void {
    this.renderRemoveButton();
    this.renderTrackName();
    this.renderVolumeInput();
    this.renderPanningInput();
    this.renderMuteButton();
    this.renderSoloButton();
    this.renderScoreSettingsButton();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
