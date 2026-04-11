import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setImageAsset,
  setupDialogActionButtons,
} from "@/ui/shared";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { createButton, createImage } from "@/shared";
import { INSTRUMENT_KINDS } from "./new-track-controls-component";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

export class NewTrackControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NewTrackControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _currentKind: string = Object.keys(INSTRUMENT_KINDS)[0];
  private _currentType: string = Object.keys(
    INSTRUMENT_KINDS[this._currentKind]
  )[0];
  private _currentPreset: string =
    INSTRUMENT_KINDS[this._currentKind][this._currentType][0];
  private _currentTrackName: string = "New track";
  private _currentStringCount: number = 6;
  private _currentTuning: string = "E A D G B E";

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: NewTrackControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    assembleDialog(
      this.parentDiv,
      this.template.dialog,
      "tu-nt-dialog",
      this.template.dialogContent,
      "tu-nt-content",
      [
        {
          element: this.template.settingsContainer,
          className: "tu-nt-settings-container",
          children: [
            this.template.instrKindsContainer,
            this.template.instrSelectContainer,
            this.template.trackInfoContainer,
          ],
        },
        {
          element: this.template.actionsContainer,
          className: "tu-nt-actions-container",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.instrKindsContainer.classList.add("tu-nt-kinds-container");
    this.template.instrSelectContainer.classList.add(
      "tu-nt-instr-settings-container"
    );
    this.template.instrTypesContainer.classList.add("tu-nt-types-container");
    this.template.instrPresetsContainer.classList.add(
      "tu-nt-presets-container"
    );
    this.template.trackInfoContainer.classList.add(
      "tu-nt-track-info-container"
    );

    this.template.instrKindsContainer.append(
      ...this.template.instrKindsButtons
    );
    this.template.instrSelectContainer.append(
      this.template.instrTypesContainer,
      this.template.instrPresetsContainer
    );
    this.template.instrTypesContainer.append(
      ...this.template.instrTypesButtons
    );
    this.template.instrPresetsContainer.append(
      ...this.template.instrPresetsButtons
    );
    this.template.trackInfoContainer.append(
      this.template.trackNameInput,
      this.template.trackNameError,
      this.template.stringCountInput,
      this.template.stringCountError,
      this.template.tuningInput,
      this.template.tuningError
    );
  }

  private renderMusicInstrumentKindsButtons(): void {
    const kinds = Object.keys(INSTRUMENT_KINDS);
    if (this.template.instrKindsButtons.length === 0) {
      for (const kind of kinds) {
        this.template.instrKindsButtons.push(createImage());
      }
    }

    // Mark applied/disabled
    for (let i = 0; i < kinds.length; i++) {
      const imageButton = this.template.instrKindsButtons[i];
      const kind = kinds[i];
      setImageAsset(
        imageButton,
        this.assetsPath,
        `img/ui/${kind.toLowerCase()}.svg`,
        kind
      );
    }
  }

  private renderMusicInstrumentTypesButtons(): void {
    const types = Object.keys(INSTRUMENT_KINDS[this._currentKind]);
    if (this.template.instrTypesButtons.length === 0) {
      for (const type of types) {
        this.template.instrTypesButtons.push(createButton());
      }
      this.template.instrTypesContainer.append(
        ...this.template.instrTypesButtons
      );
    }

    for (let i = 0; i < types.length; i++) {
      const typeButton = this.template.instrTypesButtons[i];
      typeButton.textContent = `${types[i]}`;

      // Mark applied/disabled
    }
  }

  private renderMusicInstrumentPresetsButtons(): void {
    const presets = INSTRUMENT_KINDS[this._currentKind][this._currentType];

    if (this.template.instrPresetsButtons.length === 0) {
      for (const preset of presets) {
        this.template.instrPresetsButtons.push(createButton());
      }
      this.template.instrPresetsContainer.append(
        ...this.template.instrPresetsButtons
      );
    }

    for (let i = 0; i < presets.length; i++) {
      const typeButton = this.template.instrPresetsButtons[i];
      typeButton.textContent = `${presets[i]}`;

      // Mark applied/disabled
    }
  }

  private renderInputs(): void {
    const newTrackInputCSSClass = "tu-nt-input";
    const newTrackErrorCSSClass = "tu-nt-error";

    this.template.trackNameInput.classList.add(newTrackInputCSSClass);
    this.template.trackNameInput.value = this._currentTrackName;
    this.template.trackNameError.classList.add(newTrackErrorCSSClass);

    this.template.stringCountInput.classList.add(newTrackInputCSSClass);
    this.template.stringCountInput.type = "number";
    this.template.stringCountInput.value = `${this._currentStringCount}`;
    this.template.stringCountError.classList.add(newTrackErrorCSSClass);

    this.template.tuningInput.classList.add(newTrackInputCSSClass);
    this.template.tuningInput.value = this._currentTuning;
    this.template.tuningError.classList.add(newTrackErrorCSSClass);
  }

  private renderActionButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-nt-confirm-button",
      "tu-nt-cancel-button"
    );
  }

  public render(
    currentKind: string,
    currentType: string,
    currentPreset: string,
    currentTrackName: string,
    currentStringCount: number,
    currentTuning: string
  ): void {
    if (this._currentKind !== currentKind) {
      this.template.instrTypesContainer.replaceChildren();
      this.template.instrTypesButtons = [];
      this._currentKind = currentKind;
    }
    if (this._currentType !== currentType) {
      this.template.instrPresetsContainer.replaceChildren();
      this.template.instrPresetsButtons = [];
      this._currentType = currentType;
    }
    this._currentPreset = currentPreset;
    this._currentTrackName = currentTrackName;
    this._currentStringCount = currentStringCount;
    this._currentTuning = currentTuning;

    this.renderMusicInstrumentKindsButtons();
    this.renderMusicInstrumentTypesButtons();
    this.renderMusicInstrumentPresetsButtons();
    this.renderInputs();
    this.renderActionButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
