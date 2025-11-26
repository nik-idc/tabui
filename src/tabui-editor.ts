import { TabUICallbacks } from "./callbacks/tabui-callbacks";
import { Score } from "./notation";
import { NotationComponent } from "./notation/notation-component";
import { UIComponent } from "./ui";
import "./styles.scss";

// TODO:
// 0. Dynamic button enabled/disabled status -- done
// 1. Tuplet dialog -- done
// 2. New track dialog -- done
// 3. Delete track/Yes or No dialog -- done
// 4. Score settings dialog -x- not needed
// 5. Track settings dialog -- done
// 6. Score name input field (like in Google Docs) -- done
// 7. Fix empty divs, i.e. fix component parenthood issues -- done
// 8. Major model update

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

    this._notationComponent = new NotationComponent(this.rootDiv, this.score);
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
