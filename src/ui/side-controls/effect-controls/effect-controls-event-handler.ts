
import { NotationView } from "@/notation/notation-view";

export interface EffectControlsEventHandler {
  onVibratoClicked(notationView: NotationView): void;
  onPalmMuteClicked(notationView: NotationView): void;
  onNHClicked(notationView: NotationView): void;
  onPHClicked(notationView: NotationView): void;
  onHammerOnClicked(notationView: NotationView): void;
  onPullOffClicked(notationView: NotationView): void;
  onSlideClicked(notationView: NotationView): void;
  onBendClicked(notationView: NotationView): void;
}
