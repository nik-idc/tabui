import { TabUICallbacks } from "./callbacks/tabui-callbacks";
import { Score } from "./notation";
import { NotationComponent } from "./notation/notation-component";
import { UIComponent } from "./ui";
import { applyEditorTheme } from "./config/apply-editor-theme";
import {
  ResolvedTabUIConfig,
  TabUIConfig,
  resolveTabUIConfig,
} from "./config/tabui-config";
import "./styles.scss";

export class TabUIEditor {
  readonly score: Score;
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;

  private _notationComponent: NotationComponent;
  private _uiComponent: UIComponent;
  private _callbacks: TabUICallbacks;
  private _initialized: boolean;

  constructor(rootDiv: HTMLDivElement, score: Score, config: TabUIConfig = {}) {
    this.score = score;
    this.rootDiv = rootDiv;
    this.config = resolveTabUIConfig(config);

    this._notationComponent = new NotationComponent(
      this.rootDiv,
      this.score,
      this.config
    );
    this._uiComponent = new UIComponent(
      this.rootDiv,
      this._notationComponent,
      this.config
    );

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

    this.rootDiv.classList.add("tu-editor");
    applyEditorTheme(this.rootDiv, this.config);

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

export type { TabUIConfig };
