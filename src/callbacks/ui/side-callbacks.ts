import { SideControlsComponent } from "@/ui";
import { NotationComponent } from "@/notation/notation-component";
import {
  TechniqueControlsCallbacks,
  TechniqueControlsDefaultCallbacks,
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
  private _techniqueCallbacks: TechniqueControlsCallbacks;
  private _measureCallbacks: MeasureControlsCallbacks;

  private _sideComponent: SideControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  constructor(
    sideComponent: SideControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._sideComponent = sideComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._noteCallbacks = new NoteControlsDefaultCallbacks(
      this._sideComponent.noteControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._techniqueCallbacks = new TechniqueControlsDefaultCallbacks(
      this._sideComponent.techniqueControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._measureCallbacks = new MeasureControlsDefaultCallbacks(
      this._sideComponent.measureControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  public bind(): void {
    this._noteCallbacks.bind();
    this._techniqueCallbacks.bind();
    this._measureCallbacks.bind();
  }

  public unbind(): void {
    this._noteCallbacks.unbind();
    this._techniqueCallbacks.unbind();
    this._measureCallbacks.unbind();
  }
}
