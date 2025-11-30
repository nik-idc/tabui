import { TrackController } from "../controller";

export interface ElementRenderer {
  readonly trackController: TrackController;

  render(...params: any): ElementRenderer[] | void;

  unrender(): void;
}
