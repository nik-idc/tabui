import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls/bend-controls-template";
import { GuitarEffectType } from "@/notation";
import { BendControlsComponent } from "./bend-controls/bend-controls-component";

export interface EffectControlsEventHandler {
  onVibratoClicked(notationComponent: NotationComponent): void;
  onPalmMuteClicked(notationComponent: NotationComponent): void;
  onNHClicked(notationComponent: NotationComponent): void;
  onPHClicked(notationComponent: NotationComponent): void;
  onHammerOnClicked(notationComponent: NotationComponent): void;
  onPullOffClicked(notationComponent: NotationComponent): void;
  onSlideClicked(notationComponent: NotationComponent): void;
  onBendClicked(
    notationComponent: NotationComponent,
    bendControlsComponent: BendControlsComponent
  ): void;
}

export class EffectControlsDefaultEventHandler
  implements EffectControlsEventHandler
{
  onVibratoClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.Vibrato);
    notationComponent.renderAndBind();
  }

  onPalmMuteClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.PalmMute);
    notationComponent.renderAndBind();
  }

  onNHClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.NaturalHarmonic);
    notationComponent.renderAndBind();
  }

  onPHClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.PinchHarmonic);
    notationComponent.renderAndBind();
  }

  onHammerOnClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.HammerOnOrPullOff);
    notationComponent.renderAndBind();
  }

  onPullOffClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.HammerOnOrPullOff);
    notationComponent.renderAndBind();
  }

  onSlideClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setEffect(GuitarEffectType.Slide);
    notationComponent.renderAndBind();
  }

  onBendClicked(
    notationComponent: NotationComponent,
    bendControlsComponent: BendControlsComponent
  ): void {
    bendControlsComponent.template.bendControlsDialog.showModal();
  }
}
