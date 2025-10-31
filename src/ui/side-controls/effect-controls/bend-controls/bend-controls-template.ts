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

export interface BendControlsTemplate {
  readonly bendControlsDialog: HTMLDialogElement;
  readonly bendControlsDialogContent: HTMLDivElement;

  readonly bendSelectorContent: HTMLDivElement;
  readonly bendTypeListContainer: HTMLDivElement;
  readonly bendTypesButtons: [
    HTMLButtonElement, // Regular bend button
    HTMLButtonElement, // Prebend button
    HTMLButtonElement, // Bend & release button
    HTMLButtonElement // Prebend & release button
  ];
  readonly bendSelectorGraphSVG: SVGSVGElement;

  readonly bendActionsContent: HTMLDivElement;
  readonly confirmButton: HTMLButtonElement;
  readonly cancelButton: HTMLButtonElement;
}
