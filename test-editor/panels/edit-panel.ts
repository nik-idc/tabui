import {
  GuitarEffectOptions,
  GuitarEffectType,
  NoteDuration,
  TabWindow,
} from "../../src/index";
import { BendSelectorManager } from "../../src/tab-window/render/bend-selectors/bend-selector-manager";
import { InputModal } from "./input-modal";

const NAME_TO_DURATION: { [key: string]: NoteDuration } = {
  "1": NoteDuration.Whole,
  "2": NoteDuration.Half,
  "4": NoteDuration.Quarter,
  "8": NoteDuration.Eighth,
  "16": NoteDuration.Sixteenth,
  "32": NoteDuration.ThirtySecond,
  "64": NoteDuration.SixtyFourth,
};

export class EditPanel {
  private tabWindow: TabWindow;
  private sideControls: HTMLElement;
  private renderAndBind: () => void;
  private bendSelectorManager: BendSelectorManager;
  private inputModal: InputModal;

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
    this.inputModal = new InputModal();
  }

  public bind(): void {
    this.sideControls.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") {
        return;
      }

      if (target.id === "tempoButton") {
        this.handleTempoButtonClick();
        return;
      }

      if (target.id === "measureButton") {
        this.handleMeasureButtonClick();
        return;
      }

      const duration = target.dataset.duration;
      if (duration) {
        this.handleDurationClick(duration);
        return;
      }

      const effect = target.dataset.effect;
      if (effect) {
        this.handleEffectClick(effect);
      }
    });
  }

  private handleTempoButtonClick(): void {
    this.inputModal.show(
      "Set Tempo",
      [{ label: "Tempo:", id: "tempo", value: "120" }],
      (values) => {
        const newTempo = parseInt(values["tempo"], 10);
        if (!isNaN(newTempo)) {
          this.tabWindow.changeSelectedBarTempo(newTempo);
          this.renderAndBind();
        }
      }
    );
  }

  private handleMeasureButtonClick(): void {
    this.inputModal.show(
      "Set Time Signature",
      [
        { label: "Beats:", id: "beats", value: "4" },
        {
          label: "Duration (e.g., 4):",
          id: "duration",
          value: "4",
        },
      ],
      (values) => {
        const newBeats = parseInt(values["beats"], 10);
        const newDuration = NAME_TO_DURATION[values["duration"]];
        if (!isNaN(newBeats) && newDuration) {
          this.tabWindow.changeSelectedBarBeats(newBeats);
          this.tabWindow.changeSelectedBarDuration(newDuration);
          this.renderAndBind();
        }
      }
    );
  }

  private handleDurationClick(duration: string): void {
    const newDuration = 1 / parseInt(duration, 10);
    this.tabWindow.changeSelectedBeatDuration(newDuration as NoteDuration);
    this.renderAndBind();
  }

  private handleEffectClick(effect: string): void {
    if (effect === "bend") {
      this.bendSelectorManager.show(
        (effectType: GuitarEffectType, options: GuitarEffectOptions) => {
          this.applyOrRemoveEffect(effectType, options);
        }
      );
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
