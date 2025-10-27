import { createDiv, createImage } from "@/shared";
import { EffectControlsTemplate } from "./effect-controls-template";

const assetsPath = import.meta.env.BASE_URL;

function setupEffectControlsContainer(template: EffectControlsTemplate): void {
  const cssClass = "tu-effect-controls";
  template.effectControlsContainer.classList.add(cssClass);
}

function setupEffectButtons(template: EffectControlsTemplate): void {
  template.vibratoButton.setAttribute(
    "src",
    `${assetsPath}/img/effects/vibrato.svg`
  );
  template.vibratoButton.setAttribute("alt", "Vibrato");

  template.palmMuteButton.setAttribute(
    "src",
    `${assetsPath}/img/effects/pm.svg`
  );
  template.palmMuteButton.setAttribute("alt", "Palm Mute");

  template.nhButton.setAttribute("src", `${assetsPath}/img/effects/nh.svg`);
  template.nhButton.setAttribute("alt", "Nat. Harmonic");

  template.phButton.setAttribute("src", `${assetsPath}/img/effects/ph.svg`);
  template.phButton.setAttribute("alt", "Pinch Harmonic");

  template.hammerOnButton.setAttribute(
    "src",
    `${assetsPath}/img/effects/hammer-on.svg`
  );
  template.hammerOnButton.setAttribute("alt", "Hammer-on");

  template.pullOffButton.setAttribute(
    "src",
    `${assetsPath}/img/effects/pull-off.svg`
  );
  template.pullOffButton.setAttribute("alt", "Pull-off");

  template.slideButton.setAttribute(
    "src",
    `${assetsPath}/img/effects/slide-up.svg`
  );
  template.slideButton.setAttribute("alt", "Slide");

  template.bendButton.setAttribute("src", `${assetsPath}/img/effects/bend.svg`);
  template.bendButton.setAttribute("alt", "Bend");

  template.effectControlsContainer.append(
    template.vibratoButton,
    template.palmMuteButton,
    template.nhButton,
    template.phButton,
    template.hammerOnButton,
    template.pullOffButton,
    template.slideButton,
    template.bendButton
  );
}

/**
 * Responsible for setting up the effect controls:
 * - Vibrato
 * - P.M.
 * - NH
 * - PH
 * - Hammer-on
 * - Pull-off
 * - Slide
 * - Bend
 */
export function setupEffectControls(
  rootDiv: HTMLDivElement,
  template: EffectControlsTemplate
): void {
  setupEffectControlsContainer(template);
  setupEffectButtons(template);

  rootDiv.appendChild(template.effectControlsContainer);
}
