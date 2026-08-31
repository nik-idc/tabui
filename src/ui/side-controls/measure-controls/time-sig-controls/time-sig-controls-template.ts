import {
  createButton,
  createDialog,
  createDiv,
  createSelect,
} from "../../../../shared";

export class TimeSigControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly beatsLabel: HTMLDivElement = createDiv();
  readonly beatsControl: HTMLDivElement = createDiv();
  readonly beatsDownButton: HTMLButtonElement = createButton();
  readonly beatsValue: HTMLDivElement = createDiv();
  readonly beatsUpButton: HTMLButtonElement = createButton();
  readonly beatsErrorText: HTMLDivElement = createDiv();
  readonly durationLabel: HTMLDivElement = createDiv();
  readonly durationSelect: HTMLSelectElement = createSelect();
  readonly durationErrorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
