import {
  GuitarEffectOptions,
  GuitarEffectType,
  NoteDuration,
  TabWindow,
} from "../../src/index";
import { BendSelectorManager } from "../../src/tab-window/render/bend-selectors/bend-selector-manager";

export class EditPanel {
  private tabWindow: TabWindow;
  private sideControls: HTMLElement;
  private renderAndBind: () => void;
  private bendSelectorManager: BendSelectorManager;

  constructor(
    tabWindow: TabWindow,
    sideControls: HTMLElement,
    renderAndBind: () => void,
    bendSelectorManager: BendSelectorManager
  ) {
    this.tabWindow = tabWindow;
    this.sideControls = sideControls;
    this.renderAndBind = renderAndBind;
    this.bendSelectorManager = bendSelectorManager;
  }

  public bind(): void {
    this.sideControls.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") {
        return;
      }

      const duration = target.dataset.duration;
      if (duration) {
        const newDuration = 1 / parseInt(duration, 10);
        this.tabWindow.changeSelectedBeatDuration(newDuration as NoteDuration);
        this.renderAndBind();
        return;
      }

      const effect = target.dataset.effect;
      if (effect) {
        if (effect === "bend") {
          this.bendSelectorManager.show();
          return;
        }

        let effectType: GuitarEffectType | undefined;
        switch (effect) {
          case "vibrato":
            effectType = GuitarEffectType.Vibrato;
            break;
          case "palm-mute":
            effectType = GuitarEffectType.PalmMute;
            break;
          case "natural-harmonic":
            effectType = GuitarEffectType.NaturalHarmonic;
            break;
          case "pinch-harmonic":
            effectType = GuitarEffectType.PinchHarmonic;
            break;
          case "hammer-on":
          case "pull-off":
            effectType = GuitarEffectType.HammerOnOrPullOff;
            break;
          case "slide-up":
          case "slide-down":
            effectType = GuitarEffectType.Slide;
            break;
        }

        if (effectType !== undefined) {
          this.applyOrRemoveEffect(effectType);
        }
      }
    });
  }

  private applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this.tabWindow.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    const effectIndex = selected.note.effects.findIndex((e) => {
      return e.effectType === effectType;
    });

    if (effectIndex === -1) {
      this.tabWindow.applyEffectSingle(effectType, options);
    } else {
      this.tabWindow.removeEffectSingle(effectType, options);
    }

    this.renderAndBind();
  }
}
