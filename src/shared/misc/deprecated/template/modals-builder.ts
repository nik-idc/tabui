import { createButton, createDiv, createH3, createSVG } from "@/shared";

/**
 * Class responsible for building the modals:
 * - Bend modals
 * - Input modals
 */
export class ModalsBuilder {
  private _rootDiv: HTMLDivElement;

  constructor(rootDiv: HTMLDivElement) {
    this._rootDiv = rootDiv;
  }

  private buildBendGraphModal(): void {
    // Bend types list
    const bendGraphModal = createDiv();
    bendGraphModal.setAttribute("id", "bend-graph-modal");
    bendGraphModal.setAttribute("class", "modal-overlay");
    bendGraphModal.setAttribute("style", "display: none");

    const modalContainer = createDiv();
    modalContainer.setAttribute("class", "modal-container");
    bendGraphModal.appendChild(modalContainer);

    const modalContent = createDiv();
    modalContent.setAttribute("class", "modal-content");
    modalContainer.appendChild(modalContent);

    const bendTypeList = new HTMLUListElement();
    bendTypeList.setAttribute("class", "bend-type-list");

    const bendTypes = [
      { type: "bend" },
      { type: "bend-release" },
      { type: "prebend" },
      { type: "prebend-release" },
    ];
    for (const bt of bendTypes) {
      const li = new HTMLLIElement();
      li.setAttribute("data-bend-type", bt.type);
      bendTypeList.appendChild(li);
    }
    modalContent.appendChild(bendTypeList);

    const graphSVG = createSVG();
    graphSVG.setAttribute("id", "bend-graph-svg");
    graphSVG.setAttribute("width", "400");
    graphSVG.setAttribute("height", "300");
    modalContent.appendChild(graphSVG);

    // Modal buttons
    const modalButtons = createDiv();
    modalButtons.setAttribute("class", "modal-buttons");
    modalContainer.appendChild(modalButtons);

    const confirmButton = createButton();
    confirmButton.setAttribute("id", "bend-modal-confirm");
    modalButtons.appendChild(confirmButton);

    const cancelButton = createButton();
    confirmButton.setAttribute("id", "bend-modal-cancel");
    modalButtons.appendChild(cancelButton);

    this._rootDiv.appendChild(bendGraphModal);
  }

  private buildInputModal(): void {
    const inputModal = createDiv();
    inputModal.setAttribute("id", "input-modal");
    inputModal.setAttribute("class", "modal-overlay");
    inputModal.setAttribute("style", "display: none");

    const modalContent = createDiv();
    modalContent.setAttribute("class", "modal-content");
    inputModal.appendChild(modalContent);

    const title = createH3();
    title.setAttribute("id", "input-modal-title");
    modalContent.appendChild(title);

    const inputs = createDiv();
    inputs.setAttribute("id", "input-modal-inputs");
    modalContent.appendChild(title);

    const modalButtons = createDiv();
    modalButtons.setAttribute("class", "modal-buttons");
    modalContent.appendChild(modalButtons);

    const confirmButton = createButton();
    confirmButton.setAttribute("id", "bend-modal-confirm");
    modalButtons.appendChild(confirmButton);

    const cancelButton = createButton();
    confirmButton.setAttribute("id", "bend-modal-cancel");
    modalButtons.appendChild(cancelButton);

    this._rootDiv.appendChild(inputModal);
  }

  public build(): void {
    // Clear everything
    this._rootDiv.replaceChildren();

    this.buildBendGraphModal();
    this.buildInputModal();
  }
}
