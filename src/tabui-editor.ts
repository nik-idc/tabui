import { TabUICallbacks } from "./callbacks/tabui-callbacks";
import {
  EditorKeyboardCallbacks,
  EditorKeyboardDefCallbacks,
  EditorMouseCallbacks,
  EditorMouseDefCallbacks,
} from "./callbacks/editor";
import {
  EditorSVGRenderer,
  Score,
  Tab,
  TabController,
  TabControllerDim,
} from "./notation";
import { NotationComponent } from "./notation/notation-component";
import { ElementRenderer } from "./notation/render/element-renderer";
import { UIComponent } from "./ui";

function buildDefaultDim(tab: Tab): TabControllerDim {
  const dim = new TabControllerDim(
    1200, // width
    14, // noteTextSize
    42, // timeSigTextSize
    28, // tempoTextSize
    40, // durationsHeight
    tab.guitar.stringsCount
  );

  return dim;
}

function buildTabController(score: Score, trackIndex: number): TabController {
  if (trackIndex < 0 || trackIndex >= score.tracks.length) {
    throw Error("Track index out of bounds");
  }

  const tab = score.tracks[trackIndex];
  const defDim = buildDefaultDim(tab);
  return new TabController(score, tab, defDim);
}

// TODO: 
// 0. Dynamic button enabled/disabled status -- done
// 1. Tuplet dialog
// 2. New track dialog
// 3. Delete track/Yes or No dialog
// 4. Score settings dialog
// 5. Track settings dialog
// 6. Score name input field (like in Google Docs)

export class TabUIEditor {
  readonly score: Score;
  readonly rootDiv: HTMLDivElement;

  private _notationComponent: NotationComponent;
  private _uiComponent: UIComponent;
  private _callbacks: TabUICallbacks;
  private _initialized: boolean;

  constructor(rootDiv: HTMLDivElement, score: Score) {
    this.score = score;
    this.rootDiv = rootDiv;

    this._notationComponent = new NotationComponent(
      buildTabController(this.score, 0),
      this.rootDiv
    );
    this._uiComponent = new UIComponent(this.rootDiv, this._notationComponent);

    this._callbacks = new TabUICallbacks(
      this._uiComponent,
      this._notationComponent
    );

    this._initialized = false;
  }

  public init(): void {
    if (this._initialized) {
      throw new Error("TabUIEditor already initialized");
    }

    this._uiComponent.render();
    this._notationComponent.loadTrack(this.score.tracks[0]);
    this._callbacks = new TabUICallbacks(
      this._uiComponent,
      this._notationComponent
    );
    this._callbacks.bind();

    this._initialized = true;
  }
}
