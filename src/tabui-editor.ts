import {
  EditorMouseDefCallbacks,
  EditorSVGRenderer,
  Score,
  Tab,
  TabController,
  TabControllerDim,
} from "./notation";
import { NotationView } from "./notation/notation-view";
import { ElementRenderer } from "./notation/render/element-renderer";
import { initUI } from "./ui/ui-view";

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

  private _notationView: NotationView;
  private _initialized: boolean;

  constructor(rootDiv: HTMLDivElement, score: Score) {
    this.score = score;
    this.rootDiv = rootDiv;

    this._notationView = new NotationView(
      buildTabController(this.score, 0),
      this.rootDiv
    );

    this._initialized = false;
  }

  public init(): void {
    if (this._initialized) {
      throw new Error("TabUIEditor already initialized");
    }

    initUI(this._notationView);
    this._notationView.loadTrack(buildTabController(this.score, 0));

    this._initialized = true;
  }
}
