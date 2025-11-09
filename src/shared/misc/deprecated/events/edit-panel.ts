import { TabController } from "@/notation/element";
import {
  NoteDuration,
  GuitarEffectType,
  GuitarEffectOptions,
} from "@/notation/model";
import { BendSelectorManager } from "../../../../ui/side-controls/effect-controls/bend-controls/bend-selectors";
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
  private tabController: TabController;
  private sideControls: HTMLElement;
  private bindAfterRender: () => void;
  private bendSelectorManager: BendSelectorManager;
  private inputModal: InputModal;
  private boundSideControlsClickHandler: (event: MouseEvent) => void;

  constructor(
    tabController: TabController,
    sideControls: HTMLElement,
    bindAfterRender: () => void,
    bendSelectorManager: BendSelectorManager
  ) {
    this.tabController = tabController;
    this.sideControls = sideControls;
    this.bindAfterRender = bindAfterRender;
    this.bendSelectorManager = bendSelectorManager;
    this.inputModal = new InputModal();

    this.boundSideControlsClickHandler = (event) => {
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

      if (target.id === "repeatStartButton") {
        this.handleRepeatStartClick();
        return;
      }

      if (target.id === "repeatEndButton") {
        this.handleRepeatEndClick();
        return;
      }

      const duration = target.dataset.duration;
      if (duration) {
        this.handleDurationClick(duration);
        return;
      }

      const dot = target.dataset.dot;
      if (dot !== undefined) {
        this.handleDotClick(dot);
        return;
      }

      const tuplet = target.dataset.tuplet;
      if (tuplet !== undefined) {
        this.handleTupletClick(tuplet);
        return;
      }

      const effect = target.dataset.effect;
      if (effect) {
        this.handleEffectClick(effect);
      }
    };
  }

  public bind(): void {
    this.sideControls.addEventListener(
      "click",
      this.boundSideControlsClickHandler
    );
  }

  public dispose(): void {
    this.sideControls.removeEventListener(
      "click",
      this.boundSideControlsClickHandler
    );
  }

  private handleTempoButtonClick(): void {
    this.inputModal.show(
      "Set Tempo",
      [{ label: "Tempo:", id: "tempo", value: "120" }],
      (values) => {
        const newTempo = parseInt(values["tempo"], 10);
        if (!isNaN(newTempo)) {
          this.tabController.changeSelectedBarTempo(newTempo);
          this.bindAfterRender();
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
          this.tabController.changeSelectedBarBeats(newBeats);
          this.tabController.changeSelectedBarDuration(newDuration);
          this.bindAfterRender();
        }
      }
    );
  }

  private handleRepeatStartClick(): void {
    this.tabController.setSelectedBarRepeatStart();
    this.bindAfterRender();
  }

  private handleRepeatEndClick(): void {
    this.tabController.setSelectedBarRepeatEnd();
    this.bindAfterRender();
  }

  private handleDurationClick(duration: string): void {
    const newDuration = 1 / parseInt(duration, 10);
    this.tabController.changeSelectedBeatDuration(newDuration as NoteDuration);
    this.bindAfterRender();
  }

  private handleDotClick(newDots: string): void {
    this.tabController.setSelectedBeatDots(Number(newDots));
    this.bindAfterRender();
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
      case "nat-harmonic":
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

  private handleTupletClick(tuplet: string): void {
    if (tuplet === "3") {
      this.tabController.setSelectedBeatsTuplet(3, 2);
      this.bindAfterRender();
      return;
    } else if (tuplet === "2") {
      this.tabController.setSelectedBeatsTuplet(2, 1);
      this.bindAfterRender();
      return;
    }

    this.inputModal.show(
      "Set tuplet",
      [
        { label: "Normal count:", id: "normalCount", value: "3" },
        { label: "Tuplet count:", id: "tupletCount", value: "2" },
      ],
      (values) => {
        const newNormalCount = parseInt(values["normalCount"], 10);
        const newTupletCount = parseInt(values["tupletCount"], 10);
        if (!isNaN(newNormalCount) && !isNaN(newTupletCount)) {
          this.tabController.setSelectedBeatsTuplet(
            newNormalCount,
            newTupletCount
          );
          this.bindAfterRender();
        }
      }
    );
  }

  private applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this.tabController.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    const effectIndex = selected.note.effects.findIndex((e) => {
      return e.effectType === effectType;
    });

    if (effectIndex === -1) {
      this.tabController.applyEffectSingle(effectType, options);
    } else {
      this.tabController.removeEffectSingle(effectType, options);
    }

    this.bindAfterRender();
  }
}
