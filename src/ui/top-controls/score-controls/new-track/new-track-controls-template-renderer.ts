import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setImageAsset,
  setupDialogActionButtons,
} from "@/ui/shared";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { createButton, createDiv, createImage } from "@/shared";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import {
  InstrumentFamily,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  InstrumentType,
  StringInstrumentType,
} from "@/notation/model";

export class NewTrackControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NewTrackControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _currentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _currentType: InstrumentType = StringInstrumentType.ElectricGuitar;
  private _currentTone: string = INSTRUMENT_TONES[this._currentType]?.[0] ?? "";
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
            this.template.instrFamiliesContainer,
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
    this.template.instrFamiliesContainer.classList.add(
      "tu-nt-families-container"
    );
    this.template.instrSelectContainer.classList.add(
      "tu-nt-instr-settings-container"
    );
    this.template.instrTypesContainer.classList.add("tu-nt-types-container");
    this.template.instrTonesContainer.classList.add("tu-nt-tones-container");
    this.template.trackInfoContainer.classList.add(
      "tu-nt-track-info-container"
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
      this.template.stringCountContainer,
      this.template.stringCountError,
      this.template.tuningContainer,
      this.template.wholeTuningContainer,
      this.template.tuningError
    );
    this.template.stringCountContainer.append(
      this.template.stringCountDownButton,
      this.template.stringCountValue,
      this.template.stringCountUpButton
    );
    this.template.wholeTuningContainer.append(
      this.template.wholeTuningDownButton,
      this.template.wholeTuningUpButton
    );
  }

  private renderInstrumentFamiliesButtons(): void {
    const families = Object.values(InstrumentFamily);
    if (this.template.instrFamiliesButtons.length === 0) {
      for (const family of families) {
        this.template.instrFamiliesButtons.push(createImage());
      }
    }

    // Mark applied/disabled
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
    const newTrackInputCSSClass = "tu-nt-input";
    const newTrackErrorCSSClass = "tu-nt-error";

    this.template.trackNameInput.classList.add(newTrackInputCSSClass);
    this.template.trackNameInput.value = this._currentTrackName;
    this.template.trackNameError.classList.add(newTrackErrorCSSClass);

    this.template.stringCountContainer.classList.add(
      "tu-nt-string-count-container"
    );
    this.template.stringCountDownButton.textContent = "-";
    this.template.stringCountDownButton.disabled =
      this._currentStringCount <= 1;
    this.template.stringCountValue.classList.add("tu-nt-string-count-value");
    this.template.stringCountValue.textContent = `${this._currentStringCount}`;
    this.template.stringCountUpButton.textContent = "+";
    this.template.stringCountUpButton.disabled = this._currentStringCount >= 12;
    this.template.stringCountError.classList.add(newTrackErrorCSSClass);

    this.renderTuningControls();
    this.template.tuningError.classList.add(newTrackErrorCSSClass);
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
    this.template.tuningContainer.classList.add("tu-nt-tuning-container");
    this.template.wholeTuningContainer.classList.add(
      "tu-nt-whole-tuning-container"
    );
    this.template.wholeTuningDownButton.textContent = "All -1";
    this.template.wholeTuningUpButton.textContent = "All +1";

    for (let i = 0; i < notes.length; i++) {
      const stringNumber = notes.length - i;
      this.template.tuningStringContainers[i].classList.add(
        "tu-nt-tuning-string"
      );
      this.template.tuningStringLabels[i].classList.add(
        "tu-nt-tuning-string-label"
      );
      this.template.tuningStringLabels[i].textContent =
        this.getStringLabel(stringNumber);
      this.template.tuningUpButtons[i].classList.add("tu-nt-tuning-step");
      this.template.tuningUpButtons[i].textContent = "▲";
      this.template.tuningNoteLabels[i].classList.add("tu-nt-tuning-note");
      this.template.tuningNoteLabels[i].textContent = notes[i];
      this.template.tuningDownButtons[i].classList.add("tu-nt-tuning-step");
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
      "tu-nt-confirm-button",
      "tu-nt-cancel-button"
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
      this.template.instrTypesButtons.splice(0);
      this._currentFamily = currentFamily;
    }
    if (this._currentType !== currentType) {
      this.template.instrTonesContainer.replaceChildren();
      this.template.instrTonesButtons.splice(0);
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
