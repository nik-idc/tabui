import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setImageAsset,
  setupDialogActionButtons,
} from "@/ui/shared";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { createButton, createImage } from "@/shared";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import {
  InstrumentFamily,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  InstrumentType,
  StringInstrumentType,
} from "@/notation";

export class TrackSettingsControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackSettingsControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _currentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _currentType: InstrumentType = StringInstrumentType.ElectricGuitar;
  private _currentTone: string = INSTRUMENT_TONES[this._currentType]?.[0] ?? "";
  private _currentTrackName: string = "Edit track";
  private _currentStringCount: number = 6;
  private _currentTuning: string = "E A D G B E";

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TrackSettingsControlsTemplate,
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
      "tu-ts-dialog",
      this.template.dialogContent,
      "tu-ts-content",
      [
        {
          element: this.template.settingsContainer,
          className: "tu-ts-settings-container",
          children: [
            this.template.instrFamiliesContainer,
            this.template.instrSelectContainer,
            this.template.trackInfoContainer,
          ],
        },
        {
          element: this.template.actionsContainer,
          className: "tu-ts-actions-container",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.instrFamiliesContainer.classList.add(
      "tu-ts-families-container"
    );
    this.template.instrSelectContainer.classList.add(
      "tu-ts-instr-settings-container"
    );
    this.template.instrTypesContainer.classList.add("tu-ts-types-container");
    this.template.instrTonesContainer.classList.add("tu-ts-tones-container");
    this.template.trackInfoContainer.classList.add(
      "tu-ts-track-info-container"
    );

    this.template.instrFamiliesContainer.append(
      ...this.template.instrFamiliesButtons
    );
    this.template.instrSelectContainer.append(
      this.template.instrTypesContainer,
      this.template.instrTonesContainer
    );
    this.template.instrTypesContainer.append(
      ...this.template.instrTypesButtons
    );
    this.template.instrTonesContainer.append(
      ...this.template.instrTonesButtons
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

  private renderInstrumentFamiliesButtons(): void {
    const families = Object.values(InstrumentFamily);
    if (this.template.instrFamiliesButtons.length === 0) {
      for (const family of families) {
        this.template.instrFamiliesButtons.push(createImage());
      }
    }

    for (let i = 0; i < families.length; i++) {
      const imageButton = this.template.instrFamiliesButtons[i];
      const family = families[i];
      imageButton.classList.toggle(
        "tu-applied-img",
        family === this._currentFamily
      );
      setImageAsset(
        imageButton,
        this.assetsPath,
        `img/ui/${family.toLowerCase()}.svg`,
        family
      );
    }
  }

  private renderInstrumentTypesButtons(): void {
    const types = INSTRUMENT_TYPES[this._currentFamily];
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
      typeButton.classList.toggle(
        "tu-applied-button",
        types[i] === this._currentType
      );
    }
  }

  private renderInstrumentTonesButtons(): void {
    const tones = INSTRUMENT_TONES[this._currentType] ?? [];
    if (this.template.instrTonesButtons.length === 0) {
      for (const tone of tones) {
        this.template.instrTonesButtons.push(createButton());
      }
      this.template.instrTonesContainer.append(
        ...this.template.instrTonesButtons
      );
    }

    for (let i = 0; i < tones.length; i++) {
      const toneButton = this.template.instrTonesButtons[i];
      toneButton.textContent = `${tones[i]}`;
      toneButton.classList.toggle(
        "tu-applied-button",
        tones[i] === this._currentTone
      );
    }
  }

  private renderInputs(): void {
    const newTrackInputCSSClass = "tu-ts-input";
    const newTrackErrorCSSClass = "tu-ts-error";

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
      "tu-ts-confirm-button",
      "tu-ts-cancel-button"
    );
  }

  public render(
    currentFamily: InstrumentFamily,
    currentType: InstrumentType,
    currentTone: string,
    currentTrackName: string,
    currentStringCount: number,
    currentTuning: string
  ): void {
    if (this._currentFamily !== currentFamily) {
      this.template.instrTypesContainer.replaceChildren();
      this.template.instrTypesButtons = [];
      this._currentFamily = currentFamily;
    }
    if (this._currentType !== currentType) {
      this.template.instrTonesContainer.replaceChildren();
      this.template.instrTonesButtons = [];
      this._currentType = currentType;
    }
    this._currentTone = currentTone;
    this._currentTrackName = currentTrackName;
    this._currentStringCount = currentStringCount;
    this._currentTuning = currentTuning;

    this.renderInstrumentFamiliesButtons();
    this.renderInstrumentTypesButtons();
    this.renderInstrumentTonesButtons();
    this.renderInputs();
    this.renderActionButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
