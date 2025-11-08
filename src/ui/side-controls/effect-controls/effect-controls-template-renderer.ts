import { createDiv, createImage } from "@/shared";
import { EffectControlsTemplate } from "./effect-controls-template";
import { NotationComponent } from "@/notation/notation-component";
import {
  EFFECT_TYPE_TO_SCOPE,
  GuitarEffectScope,
  GuitarEffectType,
} from "@/notation";

export class EffectControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: EffectControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: EffectControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-effect-controls";
    this.template.effectControlsContainer.classList.add(cssClass);

    this.template.effectControlsContainer.append(
      this.template.vibratoButton,
      this.template.palmMuteButton,
      this.template.nhButton,
      this.template.phButton,
      this.template.hammerOnButton,
      this.template.pullOffButton,
      this.template.slideButton,
      this.template.bendButton
    );
    this.rootDiv.appendChild(this.template.effectControlsContainer);
  }

  private renderEffectButtonState(
    effectType: GuitarEffectType,
    button: HTMLImageElement
  ): void {
    const selection =
      this.notationComponent.tabController.getSelectionAsArray();
    const selectedElement =
      this.notationComponent.tabController.getSelectedElement();
    const appliedCssClass = "tu-applied-img";
    const disabledCssClass = "tu-disabled-img";

    if (selectedElement === undefined) {
      if (
        EFFECT_TYPE_TO_SCOPE[effectType] === GuitarEffectScope.NoteLevelEffect
      ) {
        button.classList.remove(appliedCssClass);
        button.classList.add(disabledCssClass);
        return;
      }

      if (selection.some((b) => b.hasEffect(effectType))) {
        button.classList.add(appliedCssClass);
        button.classList.remove(disabledCssClass);
        return;
      }

      button.classList.remove(appliedCssClass);
      button.classList.remove(disabledCssClass);
    } else {
      if (
        EFFECT_TYPE_TO_SCOPE[effectType] ===
          GuitarEffectScope.NoteLevelEffect &&
        selectedElement.note.fret === undefined
      ) {
        button.classList.remove(appliedCssClass);
        button.classList.add(disabledCssClass);
        return;
      }

      if (selectedElement.note.hasEffect(effectType)) {
        button.classList.add(appliedCssClass);
        button.classList.remove(disabledCssClass);
        return;
      }

      if (selectedElement.note.effectApplicable(effectType)) {
        button.classList.remove(appliedCssClass);
        button.classList.remove(disabledCssClass);
        return;
      }

      button.classList.remove(appliedCssClass);
      button.classList.add(disabledCssClass);
    }
  }

  private renderEffectButtons(): void {
    const vibratoSrc = `${this.assetsPath}/img/effects/vibrato.svg`;
    this.template.vibratoButton.setAttribute("src", vibratoSrc);
    this.template.vibratoButton.setAttribute("alt", "Vibrato");
    this.renderEffectButtonState(
      GuitarEffectType.Vibrato,
      this.template.vibratoButton
    );

    const pmSrc = `${this.assetsPath}/img/effects/pm.svg`;
    this.template.palmMuteButton.setAttribute("src", pmSrc);
    this.template.palmMuteButton.setAttribute("alt", "Palm Mute");
    this.renderEffectButtonState(
      GuitarEffectType.PalmMute,
      this.template.palmMuteButton
    );

    const nhSrc = `${this.assetsPath}/img/effects/nh.svg`;
    this.template.nhButton.setAttribute("src", nhSrc);
    this.template.nhButton.setAttribute("alt", "Nat. Harmonic");
    this.renderEffectButtonState(
      GuitarEffectType.NaturalHarmonic,
      this.template.nhButton
    );

    const phSrc = `${this.assetsPath}/img/effects/ph.svg`;
    this.template.phButton.setAttribute("src", phSrc);
    this.template.phButton.setAttribute("alt", "Pinch Harmonic");
    this.renderEffectButtonState(
      GuitarEffectType.PinchHarmonic,
      this.template.phButton
    );

    const hammerOnSrc = `${this.assetsPath}/img/effects/hammer-on.svg`;
    this.template.hammerOnButton.setAttribute("src", hammerOnSrc);
    this.template.hammerOnButton.setAttribute("alt", "Hammer-on");
    this.renderEffectButtonState(
      GuitarEffectType.HammerOnOrPullOff,
      this.template.hammerOnButton
    );

    const pullOffSrc = `${this.assetsPath}/img/effects/pull-off.svg`;
    this.template.pullOffButton.setAttribute("src", pullOffSrc);
    this.template.pullOffButton.setAttribute("alt", "Pull-off");
    this.renderEffectButtonState(
      GuitarEffectType.HammerOnOrPullOff,
      this.template.pullOffButton
    );

    const slideSrc = `${this.assetsPath}/img/effects/slide-up.svg`;
    this.template.slideButton.setAttribute("src", slideSrc);
    this.template.slideButton.setAttribute("alt", "Slide");
    this.renderEffectButtonState(
      GuitarEffectType.Slide,
      this.template.slideButton
    );

    const bendSrc = `${this.assetsPath}/img/effects/bend.svg`;
    this.template.bendButton.setAttribute("src", bendSrc);
    this.template.bendButton.setAttribute("alt", "Bend");
    this.renderEffectButtonState(
      GuitarEffectType.Bend,
      this.template.bendButton
    );
  }

  public render(): void {
    this.renderEffectButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
