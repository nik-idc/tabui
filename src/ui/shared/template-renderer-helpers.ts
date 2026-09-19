import {
  ResolvedAssetConfig,
  resolveAssetUrl,
} from "../../config/asset-url-resolver";

export interface DialogSection {
  element: HTMLElement;
  className: string;
  children?: Node[];
}

/** Describes tuning in displayed string order, with spoken accidentals. */
export function getTuningValueText(
  tuning: string,
  stringIndex?: number
): string {
  const notes = tuning
    .trim()
    .split(/\s+/)
    .map((note) => note.replace(/#/g, " sharp").replace(/b/g, " flat"));
  if (stringIndex !== undefined) {
    return `String ${notes.length - stringIndex}: ${notes[stringIndex]}`;
  }
  return `Tuning, strings ${notes.length} to 1: ${notes.join(", ")}`;
}

export function renderOnce(
  isAssembled: boolean,
  assemble: () => void
): boolean {
  if (!isAssembled) {
    assemble();
    return true;
  }

  return isAssembled;
}

export function setImageAsset(
  button: HTMLButtonElement,
  assets: ResolvedAssetConfig,
  assetPath: string,
  alt: string,
  attrs: Record<string, string> = {}
): void {
  const imageElement =
    button.querySelector("img") ??
    button.appendChild(document.createElement("img"));
  imageElement.src = resolveAssetUrl(assets, assetPath);
  imageElement.alt = "";
  button.classList.add("tu-icon-button");
  button.setAttribute("aria-label", alt);
  button.title = alt;
  button.dataset.tooltip = alt;
  for (const [key, value] of Object.entries(attrs)) {
    button.setAttribute(key, value);
  }
}

/** Adds a keyboard binding to a tooltip without changing the button's name. */
export function setShortcutTooltip(
  button: HTMLButtonElement,
  label: string,
  shortcut: string
): void {
  const text = `${label} (${shortcut})`;
  button.title = text;
  button.dataset.tooltip = text;
}

/** Configures native form confirmation and action labels. */
export function setupDialogActionButtons(
  confirmButton: HTMLButtonElement,
  cancelButton: HTMLButtonElement,
  confirmClassName: string,
  cancelClassName: string,
  confirmLabel: string = "Confirm",
  cancelLabel: string = "Cancel"
): void {
  confirmButton.type = "submit";
  confirmButton.classList.add(confirmClassName);
  confirmButton.textContent = confirmLabel;
  cancelButton.classList.add(cancelClassName);
  cancelButton.textContent = cancelLabel;
}

/** Assembles dialog sections and assigns the dialog's accessible name. */
export function assembleDialog(
  dialog: HTMLDivElement,
  dialogClassName: string,
  accessibleName: string,
  dialogContent: HTMLFormElement,
  dialogContentClassName: string,
  sections: DialogSection[]
): void {
  dialog.setAttribute("aria-label", accessibleName);
  dialog.classList.add(dialogClassName);
  dialogContent.classList.add(dialogContentClassName);
  // Keep domain validation and its inline errors instead of browser popups.
  dialogContent.noValidate = true;
  for (const section of sections) {
    section.element.classList.add(section.className);
  }

  dialog.append(dialogContent);
  dialogContent.append(...sections.map((section) => section.element));
  for (const section of sections) {
    if (section.children !== undefined && section.children.length > 0) {
      section.element.append(...section.children);
    }
  }
}
