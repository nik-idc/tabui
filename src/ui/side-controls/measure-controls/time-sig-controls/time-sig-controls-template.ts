import { createButton, createDiv, createSelect } from "../../../../shared";

export class TimeSigControlsTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly dialogContent: HTMLFormElement = document.createElement("form");

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
}
