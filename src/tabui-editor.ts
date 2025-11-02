import {
  EditorMouseDefCallbacks,
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

export class TabUIEditor {
  readonly score: Score;
  readonly rootDiv: HTMLDivElement;

  private _notationView: NotationComponent;
  private _uiComponent: UIComponent;
  private _initialized: boolean;

  constructor(rootDiv: HTMLDivElement, score: Score) {
    this.score = score;
    this.rootDiv = rootDiv;

    this._notationView = new NotationComponent(
      buildTabController(this.score, 0),
      this.rootDiv
    );
    this._uiComponent = new UIComponent(this.rootDiv, this._notationView);

    this._initialized = false;
  }

  public init(): void {
    if (this._initialized) {
      throw new Error("TabUIEditor already initialized");
    }

    this._uiComponent.render();
    this._notationView.loadTrack(buildTabController(this.score, 0));

    this._initialized = true;
  }
}
