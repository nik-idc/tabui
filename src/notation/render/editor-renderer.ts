import { TrackController } from "../controller";
import { ElementRenderer } from "./element-renderer";

export interface EditorRenderer {
  render(trackController: TrackController): ElementRenderer[];

  unrender(): void;
}
