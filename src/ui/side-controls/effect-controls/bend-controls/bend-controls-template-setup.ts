import { BendControlsTemplate } from "./bend-controls-template";

function setupBendControlsDialog(template: BendControlsTemplate): void {
  const dialogCSSClass = "tu-bend-controls-dialog";
  template.bendControlsDialog.classList.add(dialogCSSClass);

  const dialogContentCssClass = "tu-bend-controls-content";
  template.bendControlsDialogContent.classList.add(dialogContentCssClass);
  const selectorCSSClass = "tu-bend-controls-selector-content";
  template.bendSelectorContent.classList.add(selectorCSSClass);
  const actionsCSSClass = "tu-bend-controls-actions-content";
  template.bendActionsContent.classList.add(actionsCSSClass);

  template.bendControlsDialog.appendChild(template.bendControlsDialogContent);
  template.bendControlsDialogContent.append(
    template.bendSelectorContent,
    template.bendActionsContent
  );
}

function setupBendTypesList(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-types";
  template.bendTypeListContainer.classList.add(cssClass);

  template.bendTypesButtons[0].textContent = "Bend";
  template.bendTypesButtons[1].textContent = "Prebend";
  template.bendTypesButtons[2].textContent = "Bend / Release";
  template.bendTypesButtons[3].textContent = "Prebend / Release";

  template.bendTypeListContainer.append(...template.bendTypesButtons);
  template.bendSelectorContent.appendChild(template.bendTypeListContainer);
}

function setupSVGGraph(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-controls-svg";
  template.bendSelectorGraphSVG.classList.add(cssClass);
  template.bendSelectorGraphSVG.setAttribute("width", "420px");
  template.bendSelectorGraphSVG.setAttribute("height", "300px");

  template.bendSelectorContent.appendChild(template.bendSelectorGraphSVG);
}

function setupActionButtons(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-controls-actions";
  template.bendActionsContent.classList.add(cssClass);

  template.confirmButton.textContent = "Confirm";
  template.cancelButton.textContent = "Cancel";

  template.bendActionsContent.append(
    template.confirmButton,
    template.cancelButton
  );
  template.bendControlsDialogContent.appendChild(template.bendActionsContent);
}

/**
 * Responsible for setting up the template of bend controls:
 * - Bend types list
 * - Actions (confirm / cancel)
 */
export function setupBendControls(
  rootDiv: HTMLDivElement,
  template: BendControlsTemplate
): void {
  setupBendControlsDialog(template);
  setupBendTypesList(template);
  setupSVGGraph(template);
  setupActionButtons(template);

  rootDiv.appendChild(template.bendControlsDialog);
}
