import { NotationView } from "@/notation/notation-view";
import { createOption } from "@/shared";
import { PlayControlsTemplate } from "./play-controls-template";

const assetsPath = import.meta.env.BASE_URL;
const buttonSize = `30px`;

function setupPlayControlsContainer(template: PlayControlsTemplate): void {
  const cssClass = "tu-play-controls";
  template.playControlsContainer.classList.add(cssClass);
}

function setupPlayButtons(template: PlayControlsTemplate): void {
  template.firstButton.setAttribute("src", `${assetsPath}/img/ui/first.svg`);
  template.firstButton.setAttribute("alt", "First bar");
  template.firstButton.setAttribute("width", buttonSize);
  template.firstButton.setAttribute("height", buttonSize);

  template.prevButton.setAttribute("src", `${assetsPath}/img/ui/prev.svg`);
  template.prevButton.setAttribute("alt", "Prev bar");
  template.prevButton.setAttribute("width", buttonSize);
  template.prevButton.setAttribute("height", buttonSize);

  template.playButton.setAttribute("src", `${assetsPath}/img/ui/play.svg`);
  template.playButton.setAttribute("alt", "Play");
  template.playButton.setAttribute("width", buttonSize);
  template.playButton.setAttribute("height", buttonSize);

  template.nextButton.setAttribute("src", `${assetsPath}/img/ui/next.svg`);
  template.nextButton.setAttribute("alt", "Next bar");
  template.nextButton.setAttribute("width", buttonSize);
  template.nextButton.setAttribute("height", buttonSize);

  template.lastButton.setAttribute("src", `${assetsPath}/img/ui/last.svg`);
  template.lastButton.setAttribute("alt", "Last bar");
  template.lastButton.setAttribute("width", buttonSize);
  template.lastButton.setAttribute("height", buttonSize);

  template.loopButton.setAttribute("src", `${assetsPath}/img/ui/loop.svg`);
  template.loopButton.setAttribute("alt", "Loop");
  template.loopButton.setAttribute("width", buttonSize);
  template.loopButton.setAttribute("height", buttonSize);

  template.playControlsContainer.append(
    template.firstButton,
    template.prevButton,
    template.playButton,
    template.nextButton,
    template.lastButton,
    template.loopButton
  );
}

/**
 * Responsible for setting up the template of play controls:
 * - First bar button
 * - Prev bar button
 * - Play/pause button
 * - Next bar button
 * - Last bar button
 */
export function setupPlayControls(
  rootDiv: HTMLDivElement,
  notationView: NotationView,
  template: PlayControlsTemplate
): void {
  setupPlayControlsContainer(template);
  setupPlayButtons(template);

  rootDiv.appendChild(template.playControlsContainer);
}
