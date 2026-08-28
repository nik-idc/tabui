import { NotationComponent } from "../../../../notation/notation-component";
import {
  BarRepeatStatus,
  MIN_MASTER_BAR_REPEAT_COUNT,
} from "../../../../notation/model";
import { ListenerManager } from "../../../../shared/misc";
import { RepeatCountControlsComponent } from "./repeat-count-controls-component";

export class RepeatCountControlsDefaultCallbacks {
  private readonly _listeners = new ListenerManager();

  constructor(
    private readonly _component: RepeatCountControlsComponent,
    private readonly _notationComponent: NotationComponent,
    private readonly _renderFunc: () => void,
    private readonly _freeKeyboard: () => void
  ) {}

  private step(delta: number): void {
    const template = this._component.template;
    const current = Number(template.value.value);
    const value = Math.max(
      MIN_MASTER_BAR_REPEAT_COUNT,
      (Number.isSafeInteger(current) ? current : MIN_MASTER_BAR_REPEAT_COUNT) +
        delta
    );
    template.value.value = `${value}`;
    template.decreaseButton.disabled = value <= MIN_MASTER_BAR_REPEAT_COUNT;
    template.errorText.textContent = " ";
    template.confirmButton.disabled = false;
  }

  private onInput(): void {
    const template = this._component.template;
    template.errorText.textContent = " ";
    template.confirmButton.disabled = template.value.value === "";
  }

  private onDialogClicked(event: MouseEvent): void {
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._component.template.dialogContent.contains(target)
    ) {
      this._component.template.dialog.close();
    }
  }

  private onConfirmClicked(): void {
    const value = Number(this._component.template.value.value);
    if (!Number.isSafeInteger(value) || value < MIN_MASTER_BAR_REPEAT_COUNT) {
      this._component.template.errorText.textContent = "Invalid repeat count";
      this._component.template.confirmButton.disabled = true;
      return;
    }
    this._notationComponent.trackController.setSelectedBarRepeatStatus(
      BarRepeatStatus.End,
      value
    );
    this._renderFunc();
    this._component.template.dialog.close();
  }

  private onKeydown(event: KeyboardEvent): void {
    if (
      event.key === "Enter" &&
      !this._component.template.confirmButton.disabled
    ) {
      event.preventDefault();
      this.onConfirmClicked();
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.step(event.deltaY < 0 ? 1 : -1);
  }

  public bind(): void {
    const template = this._component.template;
    this._listeners.bindAll([
      {
        element: template.dialog,
        event: "click",
        handler: (e: MouseEvent) => this.onDialogClicked(e),
      },
      {
        element: template.dialog,
        event: "close",
        handler: () => this._freeKeyboard(),
      },
      {
        element: template.dialog,
        event: "keydown",
        handler: (e: KeyboardEvent) => this.onKeydown(e),
      },
      {
        element: template.decreaseButton,
        event: "click",
        handler: () => this.step(-1),
      },
      {
        element: template.increaseButton,
        event: "click",
        handler: () => this.step(1),
      },
      {
        element: template.value,
        event: "input",
        handler: () => this.onInput(),
      },
      {
        element: template.valueControl,
        event: "wheel",
        handler: (e: WheelEvent) => this.onWheel(e),
      },
      {
        element: template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: template.cancelButton,
        event: "click",
        handler: () => template.dialog.close(),
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
  }
}
