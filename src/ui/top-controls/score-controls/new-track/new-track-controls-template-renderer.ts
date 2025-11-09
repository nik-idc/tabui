import { NotationComponent } from "@/notation/notation-component";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { createButton, createImage } from "@/shared";
import { INSTRUMENT_KINDS } from "./new-track-controls-component";

export class NewTrackControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NewTrackControlsTemplate;
  readonly assetsPath: string;

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
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: NewTrackControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-nt-dialog";
    const dialogContentCssClass = "tu-nt-content";
    const settingsCSSClass = "tu-nt-settings-container";
    const kindsCSSClass = "tu-nt-kinds-container";
    const instrSelectCSSClass = "tu-nt-instr-settings-container";
    const typesCSSClass = "tu-nt-types-container";
    const presetsCSSClass = "tu-nt-presets-container";
    const trackInfoCSSClass = "tu-nt-track-info-container";
    const actionsCSSClass = "tu-nt-actions-container";

    this.template.newTrackDialog.classList.add(dialogCSSClass);
    this.template.newTrackDialogContent.classList.add(dialogContentCssClass);
    this.template.newTrackSettingsContainer.classList.add(settingsCSSClass);
    this.template.instrKindsContainer.classList.add(kindsCSSClass);
    this.template.instrSelectContainer.classList.add(instrSelectCSSClass);
    this.template.instrTypesContainer.classList.add(typesCSSClass);
    this.template.instrPresetsContainer.classList.add(presetsCSSClass);
    this.template.trackInfoContainer.classList.add(trackInfoCSSClass);
    this.template.newTrackActionsContainer.classList.add(actionsCSSClass);

    this.template.newTrackDialog.appendChild(
      this.template.newTrackDialogContent
    );
    this.template.newTrackDialogContent.append(
      this.template.newTrackSettingsContainer,
      this.template.newTrackActionsContainer
    );
    this.template.newTrackSettingsContainer.append(
      this.template.instrKindsContainer,
      this.template.instrSelectContainer,
      this.template.trackInfoContainer
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
    this.template.newTrackActionsContainer.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.rootDiv.appendChild(this.template.newTrackDialog);
  }

  private renderInstrumentKindsButtons(): void {
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
      imageButton.src = `${this.assetsPath}/img/ui/${kind.toLowerCase()}`;
      imageButton.alt = kind;
    }
  }

  private renderInstrumentTypesButtons(): void {
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

  private renderInstrumentPresetsButtons(): void {
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
    const confirmCSSClass = "tu-nt-confirm-button";
    const cancelCSSClass = "tu-nt-cancel-button";

    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";
    this.template.cancelButton.classList.add(cancelCSSClass);
    this.template.cancelButton.textContent = "Cancel";
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

    this.renderInstrumentKindsButtons();
    this.renderInstrumentTypesButtons();
    this.renderInstrumentPresetsButtons();
    this.renderInputs();
    this.renderActionButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
