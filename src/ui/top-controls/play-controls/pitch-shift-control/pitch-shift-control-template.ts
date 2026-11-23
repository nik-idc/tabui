import { createButton, createDiv } from "../../../../shared";

export class PitchShiftControlTemplate {
  readonly element = createDiv();
  readonly valueElement = document.createElement("output");
  readonly increaseButton = createButton();
  readonly decreaseButton = createButton();
  readonly image = document.createElement("img");
  readonly iconButton = document.createElement("span");
  readonly buttons = createDiv();
}
