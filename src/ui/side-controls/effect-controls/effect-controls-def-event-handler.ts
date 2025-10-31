import { GuitarEffectType, NoteDuration } from "@/notation";

import { EffectControlsEventHandler } from "./effect-controls-event-handler";
import { NotationView } from "@/notation/notation-view";
import { showBendControls } from "./bend-controls/bend-controls";
import { BendControlsTemplate } from "./bend-controls/bend-controls-template";

export class EffectControlsDefaultEventHandler
  implements EffectControlsEventHandler
{
  onVibratoClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.Vibrato);
    notationView.renderAndBind();
  }

  onPalmMuteClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.PalmMute);
    notationView.renderAndBind();
  }

  onNHClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.NaturalHarmonic);
    notationView.renderAndBind();
  }

  onPHClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.PinchHarmonic);
    notationView.renderAndBind();
  }

  onHammerOnClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.HammerOnOrPullOff);
    notationView.renderAndBind();
  }

  onPullOffClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.HammerOnOrPullOff);
    notationView.renderAndBind();
  }

  onSlideClicked(notationView: NotationView): void {
    notationView.tabController.setEffect(GuitarEffectType.Slide);
    notationView.renderAndBind();
  }

  onBendClicked(
    notationView: NotationView,
    template: BendControlsTemplate
  ): void {
    showBendControls(template);
    template.bendControlsDialog.showModal();
  }
}
