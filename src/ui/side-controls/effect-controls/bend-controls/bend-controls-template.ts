import {
  createButton,
  createDialog,
  createDiv,
  createImage,
  createSVG,
} from "@/shared";

// (VSCode Extension 'es6-string-html' makes
//  below template much easier to read)
// Bend controls structure:
/* html */ `
  <dialog class="tu-bend-controls-dialog">

    <div class="tu-bend-dialog-content">
      <div class="tu-bend-selector-content">

        <div class="tu-bend-types-list">
          <button>Bend</button>
          <button>Prebend</button>
          <button>Bend / Release</button>
          <button>Prebend / Release</button>
        </div>
        
        <svg class="tu-bend-controls-svg"></svg>
      </div>
    </div>

    <div class="tu-bend-actions-content">
      <button>Bend</button>
      <button>Preend</button>
    </div>
  </dialog>
`;

type BendTypesButtons = [
  HTMLButtonElement, // Regular bend button
  HTMLButtonElement, // Prebend button
  HTMLButtonElement, // Bend & release button
  HTMLButtonElement // Prebend & release button
];

export class BendControlsTemplate {
  readonly bendControlsDialog: HTMLDialogElement = createDialog();
  readonly bendControlsDialogContent: HTMLDivElement = createDiv();

  readonly bendSelectorContent: HTMLDivElement = createDiv();
  readonly bendTypeListContainer: HTMLDivElement = createDiv();
  readonly bendTypesButtons: BendTypesButtons = [
    createButton(),
    createButton(),
    createButton(),
    createButton(),
  ];
  readonly bendSelectorGraphSVG: SVGSVGElement = createSVG();

  readonly bendActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
