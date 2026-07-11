import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setImageAsset,
  setupDialogActionButtons,
} from "@/ui/shared";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { createButton, createDiv, createImage } from "@/shared";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import {
  InstrumentFamily,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  InstrumentType,
  StringInstrumentType,
  TrackInstrumentChangeMode,
} from "@/notation";

export class TrackSettingsControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackSettingsControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _currentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _currentType: InstrumentType = StringInstrumentType.ElectricGuitar;
  private _currentTone: string = INSTRUMENT_TONES[this._currentType]?.[0] ?? "";
  private _currentStringCount: number = 6;
  private _originalTuning: string = "E A D G B E";
  private _currentTuning: string = "E A D G B E";
  private _currentTuningChangeMode: TrackInstrumentChangeMode = "keepFrets";

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
      this.template.tuningContainer,
      this.template.wholeTuningContainer,
      this.template.tuningError,
      this.template.tuningModeContainer
    );
    this.template.wholeTuningContainer.append(
      this.template.wholeTuningDownButton,
      this.template.wholeTuningUpButton
    );
    this.template.tuningModeContainer.append(
      this.template.keepFretsButton,
      this.template.transposeButton
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
    const newTrackErrorCSSClass = "tu-ts-error";

    this.renderTuningControls();
    this.template.tuningError.classList.add(newTrackErrorCSSClass);
    this.template.tuningModeContainer.classList.add(
      "tu-ts-tuning-mode-container"
    );
    this.template.tuningModeContainer.style.visibility =
      this._currentTuning === this._originalTuning ? "hidden" : "visible";
    this.template.keepFretsButton.textContent = "Keep frets";
    this.template.transposeButton.textContent = "Transpose";
    this.template.keepFretsButton.classList.toggle(
      "tu-applied-button",
      this._currentTuningChangeMode === "keepFrets"
    );
    this.template.transposeButton.classList.toggle(
      "tu-applied-button",
      this._currentTuningChangeMode === "transpose"
    );
  }

  private renderTuningControls(): void {
    // Split on one or more whitespace characters between note names.
    const notes = this._currentTuning.trim().split(/\s+/);
    while (this.template.tuningStringContainers.length < notes.length) {
      const stringContainer = createDiv();
      const label = createDiv();
      const upButton = createButton();
      const noteLabel = createDiv();
      const downButton = createButton();

      stringContainer.append(label, upButton, noteLabel, downButton);
      this.template.tuningStringContainers.push(stringContainer);
      this.template.tuningStringLabels.push(label);
      this.template.tuningUpButtons.push(upButton);
      this.template.tuningNoteLabels.push(noteLabel);
      this.template.tuningDownButtons.push(downButton);
    }

    this.template.tuningContainer.replaceChildren(
      ...this.template.tuningStringContainers.slice(0, notes.length)
    );
    this.template.tuningContainer.classList.add("tu-ts-tuning-container");
    this.template.wholeTuningContainer.classList.add(
      "tu-ts-whole-tuning-container"
    );
    this.template.wholeTuningDownButton.textContent = "All -1";
    this.template.wholeTuningUpButton.textContent = "All +1";

    for (let i = 0; i < notes.length; i++) {
      const stringNumber = notes.length - i;
      this.template.tuningStringContainers[i].classList.add(
        "tu-ts-tuning-string"
      );
      this.template.tuningStringLabels[i].classList.add(
        "tu-ts-tuning-string-label"
      );
      this.template.tuningStringLabels[i].textContent =
        this.getStringLabel(stringNumber);
      this.template.tuningUpButtons[i].classList.add("tu-ts-tuning-step");
      this.template.tuningUpButtons[i].textContent = "▲";
      this.template.tuningNoteLabels[i].classList.add("tu-ts-tuning-note");
      this.template.tuningNoteLabels[i].textContent = notes[i];
      this.template.tuningDownButtons[i].classList.add("tu-ts-tuning-step");
      this.template.tuningDownButtons[i].textContent = "▼";
    }
  }

  private getStringLabel(stringNumber: number): string {
    if (stringNumber === 1) {
      return "1st";
    }
    if (stringNumber === 2) {
      return "2nd";
    }
    if (stringNumber === 3) {
      return "3rd";
    }

    return `${stringNumber}th`;
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
    currentStringCount: number,
    currentTuning: string,
    originalTuning: string,
    currentTuningChangeMode: TrackInstrumentChangeMode
  ): void {
    if (this._currentFamily !== currentFamily) {
      this.template.instrTypesContainer.replaceChildren();
      this.template.instrTypesButtons.splice(0);
      this._currentFamily = currentFamily;
    }
    if (this._currentType !== currentType) {
      this.template.instrTonesContainer.replaceChildren();
      this.template.instrTonesButtons.splice(0);
      this._currentType = currentType;
    }
    this._currentTone = currentTone;
    this._currentStringCount = currentStringCount;
    this._currentTuning = currentTuning;
    this._originalTuning = originalTuning;
    this._currentTuningChangeMode = currentTuningChangeMode;

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
