import { NotationComponent } from "@/notation/notation-component";
import { createOption } from "@/shared";
import { ScoreControlsTemplate } from "./score-controls-template";
import { Score } from "@/notation";

const assetsPath = import.meta.env.BASE_URL;

// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!
const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;
// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!

export class ScoreControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: ScoreControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  private _currentScoreName: string = "Score name";

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: ScoreControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-score-controls";
    this.template.scoreControlsContainer.classList.add(cssClass);

    this.template.scoreControlsContainer.append(
      this.template.masterContainer,
      this.template.scoreNameInput,
      this.template.tracksContainer
    );
    this.template.masterContainer.append(
      this.template.showTracksButton,
      this.template.newTrackButton,
      this.template.masterVolumeInput,
      this.template.masterPanningInput
    );

    this.rootDiv.appendChild(this.template.scoreControlsContainer);
  }

  private renderShowButton(): void {
    const cssClass = "tu-show-tracks-button";
    this.template.showTracksButton.classList.add(cssClass);
    this.template.showTracksButton.textContent = "Tracks";
  }

  private renderMasterContainer(): void {
    const cssClass = "tu-master-controls";
    this.template.masterContainer.classList.add(cssClass);
  }

  private renderNewTrackButton(): void {
    const cssClass = "tu-new-track-button";
    this.template.newTrackButton.classList.add(cssClass);
    const src = `${assetsPath}/img/ui/add.svg`;
    this.template.newTrackButton.src = src;
    this.template.newTrackButton.alt = "New track";
  }

  private renderMasterVolumeInput(): void {
    const cssClass = "tu-master-volume-input";
    this.template.masterVolumeInput.classList.add(cssClass);
    this.template.masterVolumeInput.type = "range";
    this.template.masterVolumeInput.min = `${minVolume}`;
    this.template.masterVolumeInput.max = `${maxVolume}`;
    this.template.masterVolumeInput.step = `${volumeStep}`;

    this.template.masterVolumeInput.value = `${(minVolume + maxVolume) / 2}`;
  }

  private renderMasterPanningInput(): void {
    const cssClass = "tu-master-panning-input";
    this.template.masterPanningInput.classList.add(cssClass);
    this.template.masterPanningInput.type = "range";
    this.template.masterPanningInput.min = `${minPanning}`;
    this.template.masterPanningInput.max = `${maxPanning}`;
    this.template.masterPanningInput.step = `${panningStep}`;

    this.template.masterPanningInput.value = `${0}`;
  }

  private renderScoreNameInput(): void {
    const cssClass = "tu-score-name-input";
    this.template.scoreNameInput.classList.add(cssClass);
    this.template.scoreNameInput.value = this._currentScoreName;
  }

  private renderTracksContainer(): void {
    const cssClass = "tu-tracks";
    this.template.tracksContainer.classList.add(cssClass);
  }

  public render(score: Score): void {
    this._currentScoreName = score.name;

    this.renderShowButton();
    this.renderMasterContainer();
    this.renderNewTrackButton();
    this.renderMasterVolumeInput();
    this.renderMasterPanningInput();
    this.renderScoreNameInput();
    this.renderTracksContainer();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
