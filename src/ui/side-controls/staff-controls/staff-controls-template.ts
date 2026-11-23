import { createButton, createDiv } from "../../../shared";

/** Template of the staff controls: add a staff below, remove a staff. */
export class StaffControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly addStaffButton: HTMLButtonElement = createButton();
  readonly removeStaffButton: HTMLButtonElement = createButton();
}
