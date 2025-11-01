import { NotationView } from "@/notation/notation-view";
import { TopControlsTemplate } from "./top-controls-template";
import { createOption } from "@/shared";

const assetsPath = import.meta.env.BASE_URL;
const buttonSize = `30px`;

function setupTopControlsContainer(template: TopControlsTemplate): void {
  const cssClass = "tu-top-controls";
  template.topControlsContainer.classList.add(cssClass);

  template.topControlsContainer.append(
    template.showTracksButton,
    template.scoreControlsTemplate.scoreControlsContainer,
    template.playControlsTemplate.playControlsContainer
  );
}

function setupShowButton(template: TopControlsTemplate): void {
  const cssClass = "tu-show-tracks-button";
  template.showTracksButton.classList.add(cssClass);
  template.showTracksButton.textContent = "Tracks";
}

/**
 * Responsible for setting up the template of top controls:
 * - Score/track controls
 * - Play controls
 */
export function setupTopControls(
  rootDiv: HTMLDivElement,
  notationView: NotationView,
  template: TopControlsTemplate
): void {
  setupTopControlsContainer(template);
  setupShowButton(template);

  rootDiv.appendChild(template.topControlsContainer);
}
