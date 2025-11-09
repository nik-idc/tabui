import { SideControlsComponent } from "@/ui";
import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import {
  EffectControlsCallbacks,
  EffectControlsDefaultCallbacks,
} from "./effect-controls-callbacks";
import {
  MeasureControlsCallbacks,
  MeasureControlsDefaultCallbacks,
} from "./measure-controls-callbacks";
import {
  NoteControlsCallbacks,
  NoteControlsDefaultCallbacks,
} from "./note-controls-callbacks";

export class SideControlsCallbacks {
  private _noteCallbacks: NoteControlsCallbacks;
  private _effectCallbacks: EffectControlsCallbacks;
  private _measureCallbacks: MeasureControlsCallbacks;

  private _sideComponent: SideControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  constructor(
    sideComponent: SideControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._sideComponent = sideComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._noteCallbacks = new NoteControlsDefaultCallbacks(
      this._sideComponent.noteControlsComponent,
      this._notationComponent,
      this._renderFunc.bind(this)
    );
    this._effectCallbacks = new EffectControlsDefaultCallbacks(
      this._sideComponent.effectControlsComponent,
      this._notationComponent,
      this._renderFunc.bind(this)
    );
    this._measureCallbacks = new MeasureControlsDefaultCallbacks(
      this._sideComponent.measureControlsComponent,
      this._notationComponent,
      this._renderFunc.bind(this)
    );
  }

  public bind(): void {
    this._noteCallbacks.bind();
    this._effectCallbacks.bind();
    this._measureCallbacks.bind();
  }

  public unbind(): void {
    this._noteCallbacks.unbind();
    this._effectCallbacks.unbind();
    this._measureCallbacks.unbind();
  }
}
