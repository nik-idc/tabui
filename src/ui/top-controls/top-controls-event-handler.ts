import { NotationView } from "@/notation/notation-view";
import { TopControlsTemplate } from "./top-controls-template";

export interface TopControlsEventHandler {
  onShowButtonClicked(
    template: TopControlsTemplate,
    notationView: NotationView
  ): void;
}
