import {
  ResolvedAssetConfig,
  resolveAssetUrl,
} from "@/config/asset-url-resolver";

export interface DialogSection {
  element: HTMLElement;
  className: string;
  children?: Node[];
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
  image: HTMLImageElement,
  assets: ResolvedAssetConfig,
  assetPath: string,
  alt: string,
  attrs: Record<string, string> = {}
): void {
  image.src = resolveAssetUrl(assets, assetPath);
  image.alt = alt;
  for (const [key, value] of Object.entries(attrs)) {
    image.setAttribute(key, value);
  }
}

export function setupDialogActionButtons(
  confirmButton: HTMLButtonElement,
  cancelButton: HTMLButtonElement,
  confirmClassName: string,
  cancelClassName: string,
  confirmLabel: string = "Confirm",
  cancelLabel: string = "Cancel"
): void {
  confirmButton.classList.add(confirmClassName);
  confirmButton.textContent = confirmLabel;
  cancelButton.classList.add(cancelClassName);
  cancelButton.textContent = cancelLabel;
}

export function assembleDialog(
  parentDiv: HTMLDivElement,
  dialog: HTMLDialogElement,
  dialogClassName: string,
  dialogContent: HTMLDivElement,
  dialogContentClassName: string,
  sections: DialogSection[]
): void {
  dialog.classList.add(dialogClassName);
  dialogContent.classList.add(dialogContentClassName);
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

  parentDiv.appendChild(dialog);
}
