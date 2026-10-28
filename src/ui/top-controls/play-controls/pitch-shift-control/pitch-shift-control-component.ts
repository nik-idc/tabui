import type { ResolvedAssetConfig } from "../../../../assets";
import {
  PitchShiftControlDefaultCallbacks,
  type PitchShiftChangeHandler,
} from "./pitch-shift-control-callbacks";
import { PitchShiftControlTemplate } from "./pitch-shift-control-template";
import { PitchShiftControlTemplateRenderer } from "./pitch-shift-control-template-renderer";

export type { PitchShiftChangeHandler } from "./pitch-shift-control-callbacks";

/** Compact, non-editable pitch-shift control used by the playback toolbar. */
export class PitchShiftControlComponent {
  readonly template = new PitchShiftControlTemplate();
  readonly element = this.template.element;
  readonly valueElement = this.template.valueElement;
  readonly increaseButton = this.template.increaseButton;
  readonly decreaseButton = this.template.decreaseButton;

  private readonly _templateRenderer = new PitchShiftControlTemplateRenderer(
    this.template
  );
  private readonly _callbacks = new PitchShiftControlDefaultCallbacks(
    this.template
  );

  public render(value: number, assetsPath: ResolvedAssetConfig): void {
    this._templateRenderer.render(value, assetsPath);
  }

  public bind(changeHandler: PitchShiftChangeHandler): void {
    this._callbacks.bind(changeHandler);
  }

  public unbind(): void {
    this._callbacks.unbind();
  }
}
