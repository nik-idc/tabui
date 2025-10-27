import { MeasureControlsTemplate } from "./measure-controls-template";

const assetsPath = import.meta.env.BASE_URL;

function setupMeasureControlsContainer(
  template: MeasureControlsTemplate
): void {
  const cssClass = "tu-measure-controls";
  template.measureControlsContainer.classList.add(cssClass);
}

function setupMeasureButtons(template: MeasureControlsTemplate): void {
  template.tempoButton.setAttribute("src", `${assetsPath}/img/ui/tempo.svg`);
  template.tempoButton.setAttribute("alt", "Tempo");

  template.timeSignatureButton.setAttribute(
    "src",
    `${assetsPath}/img/ui/measure.svg`
  );
  template.timeSignatureButton.setAttribute("alt", "Time Signature");

  template.repeatStartButton.setAttribute(
    "src",
    `${assetsPath}/img/ui/repeat-start.svg`
  );
  template.repeatStartButton.setAttribute("alt", "Repeat Start");

  template.repeatEndButton.setAttribute(
    "src",
    `${assetsPath}/img/ui/repeat-end.svg`
  );
  template.repeatEndButton.setAttribute("alt", "Repeat Start");

  template.measureControlsContainer.append(
    template.tempoButton,
    template.timeSignatureButton,
    template.repeatStartButton,
    template.repeatEndButton
  );
}

/**
 * Responsible for setting up the template of measure controls:
 * - Tempo change
 * - Time signature change
 * - Repeat start/end
 */
export function setupMeasureControls(
  rootDiv: HTMLDivElement,
  template: MeasureControlsTemplate
): void {
  setupMeasureControlsContainer(template);
  setupMeasureButtons(template);

  rootDiv.appendChild(template.measureControlsContainer);
}
