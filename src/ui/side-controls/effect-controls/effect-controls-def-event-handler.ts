import { NoteDuration } from "@/notation";

import { EffectControlsEventHandler } from "./effect-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export class EffectControlsDefaultEventHandler
  implements EffectControlsEventHandler
{
  onVibratoClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onPalmMuteClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onNHClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onPHClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onHammerOnClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onPullOffClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onSlideClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onBendClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
}
