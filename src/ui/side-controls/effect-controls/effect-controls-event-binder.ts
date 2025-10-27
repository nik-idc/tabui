
import { EffectControlsTemplate } from "./effect-controls-template";
import { EffectControlsEventHandler } from "./effect-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export function bindEffectControlsEvents(
  notationView: NotationView,
  template: EffectControlsTemplate,
  eventHandlers: EffectControlsEventHandler
): void {
  template.vibratoButton.addEventListener("click", () =>
    eventHandlers.onVibratoClicked(notationView)
  );
  template.palmMuteButton.addEventListener("click", () =>
    eventHandlers.onPalmMuteClicked(notationView)
  );
  template.nhButton.addEventListener("click", () =>
    eventHandlers.onNHClicked(notationView)
  );
  template.phButton.addEventListener("click", () =>
    eventHandlers.onPHClicked(notationView)
  );
  template.hammerOnButton.addEventListener("click", () =>
    eventHandlers.onHammerOnClicked(notationView)
  );
  template.pullOffButton.addEventListener("click", () =>
    eventHandlers.onPullOffClicked(notationView)
  );
  template.slideButton.addEventListener("click", () =>
    eventHandlers.onSlideClicked(notationView)
  );
  template.bendButton.addEventListener("click", () =>
    eventHandlers.onBendClicked(notationView)
  );
}
