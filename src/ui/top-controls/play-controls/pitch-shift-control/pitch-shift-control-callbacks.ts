import { ListenerManager } from "../../../../shared/misc";
import { PitchShiftControlTemplate } from "./pitch-shift-control-template";

export type PitchShiftChangeHandler = (delta: number) => boolean;

export class PitchShiftControlDefaultCallbacks {
  private readonly _listeners = new ListenerManager();
  private _changeHandler: PitchShiftChangeHandler | null = null;

  constructor(private readonly _template: PitchShiftControlTemplate) {}

  public bind(changeHandler: PitchShiftChangeHandler): void {
    this._changeHandler = changeHandler;
    this._listeners.bindAll([
      {
        element: this._template.increaseButton,
        event: "click",
        handler: () => this._changeHandler?.(1),
      },
      {
        element: this._template.decreaseButton,
        event: "click",
        handler: () => this._changeHandler?.(-1),
      },
      {
        element: this._template.valueElement,
        event: "wheel",
        handler: (event) => {
          if (event.deltaY === 0) {
            return;
          }
          if (this._changeHandler?.(event.deltaY < 0 ? 1 : -1)) {
            event.preventDefault();
          }
        },
      },
      {
        element: this._template.valueElement,
        event: "dblclick",
        handler: () => {
          const currentValue = Number(
            this._template.valueElement.getAttribute("aria-valuenow")
          );
          if (Number.isFinite(currentValue) && currentValue !== 0) {
            this._changeHandler?.(-currentValue);
          }
        },
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
    this._changeHandler = null;
  }
}
