import { EffectControlsTemplate } from "./effect-controls";
import { MeasureControlsTemplate } from "./measure-controls";
import { NoteControlsTemplate } from "./note-controls";

/**
 * Interface defining the template of side controls:
 * - Note controls
 * - Effect controls
 * - Measure controls
 */
export interface SideControlsTemplate {
  readonly sideControlsContainer: HTMLDivElement;

  readonly noteControlsTemplate: NoteControlsTemplate;
  readonly effectControlsTemplate: EffectControlsTemplate;
  readonly measureControlsTemplate: MeasureControlsTemplate;
}
