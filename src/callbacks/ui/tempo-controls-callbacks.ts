import { NoteDuration, TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsComponent } from "@/ui";
import {
  TempoControlsComponent,
  TempoControlsTemplate,
} from "@/ui/side-controls/measure-controls/tempo-controls";
import { ListenerManager } from "@/shared/misc";

export interface TempoControlsCallbacks {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onTempoChanged(event: InputEvent): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TempoControlsDefaultCallbacks implements TempoControlsCallbacks {
  private _tempoComponent: TempoControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _listeners = new ListenerManager();

  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  private _minTempo = 1;
  private _maxTempo = 999;
  private _tempo = 120;

  constructor(
    tempoComponent: TempoControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._tempoComponent = tempoComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  private tempoValid(tempoValue: string): boolean {
    const tempoNum = Number(tempoValue);
    if (
      Number.isNaN(tempoNum) ||
      tempoNum < this._minTempo ||
      tempoNum > this._maxTempo
    ) {
      return false;
    }

    return true;
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._tempoComponent.template.tempoDialogContent.contains(
        event.target as Node
      )
    ) {
      this._tempoComponent.template.tempoDialog.close();
    }
  }

  onTempoChanged(event: InputEvent): void {
    if (!this.tempoValid(this._tempoComponent.template.tempoInput.value)) {
      this._tempoComponent.template.tempoErrorText.textContent =
        this.beatsCountErrorText;
      this._tempoComponent.template.confirmButton.disabled = true;
    } else {
      this._tempoComponent.template.tempoErrorText.textContent = " ";
      this._tempoComponent.template.confirmButton.disabled = false;
      this._tempo = Number(this._tempoComponent.template.tempoInput.value);
    }
  }

  onConfirmClicked(): void {
    this._notationComponent.tabController.changeSelectedBarTempo(this._tempo);
    this._renderFunc();

    this._tempoComponent.template.tempoDialog.close();
  }

  onCancelClicked(): void {
    this._tempoComponent.template.tempoDialog.close();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tempoComponent.template.tempoDialogContent,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._tempoComponent.template.tempoInput,
        event: "input",
        handler: (event: Event) => this.onTempoChanged(event as InputEvent),
      },
      {
        element: this._tempoComponent.template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._tempoComponent.template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
