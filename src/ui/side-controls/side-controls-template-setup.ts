import { SideControlsTemplate } from "./side-controls-template";

function setupSideControlsContainer(template: SideControlsTemplate): void {
  const cssClass = "tu-side-controls";
  template.sideControlsContainer.classList.add(cssClass);

  template.sideControlsContainer.append(
    template.noteControlsTemplate.noteControlsContainer,
    template.effectControlsTemplate.effectControlsContainer,
    template.measureControlsTemplate.measureControlsContainer
  );
}

/**
 * Responsible for setting up the side controls:
 * - Note controls
 * - Effect controls
 * - Measure controls
 */
export function setupSideControls(
  rootDiv: HTMLDivElement,
  template: SideControlsTemplate
): void {
  setupSideControlsContainer(template);

  rootDiv.appendChild(template.sideControlsContainer);
}
