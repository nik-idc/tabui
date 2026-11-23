import { NotationComponent } from "../../notation/notation-component";
import { ListenerManager } from "../../shared/misc";
import { ScoreHeaderComponent } from "./score-header-component";
import { fitTextAreaHeight } from "./score-header-template-renderer";

/** Replaces line breaks, for example from a paste, with spaces. */
function singleLine(textArea: HTMLTextAreaElement): string {
  const value = textArea.value.replace(/\r?\n/g, " ");
  if (value !== textArea.value) {
    const caret = textArea.selectionStart;
    textArea.value = value;
    textArea.setSelectionRange(caret, caret);
  }
  return value;
}

/** Keeps Enter from adding a line break; the fields wrap but stay one line. */
function blockEnter(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}

export class ScoreHeaderCallbacks {
  private _headerComponent: ScoreHeaderComponent;
  private _notationComponent: NotationComponent;
  private _listeners = new ListenerManager();

  constructor(
    headerComponent: ScoreHeaderComponent,
    notationComponent: NotationComponent
  ) {
    this._headerComponent = headerComponent;
    this._notationComponent = notationComponent;
  }

  onTitleChanged(): void {
    const input = this._headerComponent.template.titleInput;
    this._notationComponent.trackController.setScoreName(
      this._notationComponent.score,
      singleLine(input)
    );
    fitTextAreaHeight(input);
  }

  onArtistChanged(): void {
    const input = this._headerComponent.template.artistInput;
    this._notationComponent.trackController.setScoreArtist(
      this._notationComponent.score,
      singleLine(input)
    );
    fitTextAreaHeight(input);
  }

  onAlbumChanged(): void {
    const input = this._headerComponent.template.albumInput;
    this._notationComponent.trackController.setScoreAlbum(
      this._notationComponent.score,
      singleLine(input)
    );
    fitTextAreaHeight(input);
  }

  /** Saves the date once it is valid, and marks it invalid until then. */
  onReleaseDateChanged(): void {
    const input = this._headerComponent.template.releaseDateInput;
    const saved = this._notationComponent.trackController.setScoreReleaseDate(
      this._notationComponent.score,
      input.value.trim()
    );
    if (saved) {
      input.removeAttribute("aria-invalid");
    } else {
      input.setAttribute("aria-invalid", "true");
    }
  }

  /** Shows the saved date again when the user leaves an invalid one. */
  onReleaseDateBlurred(): void {
    this._headerComponent.render();
  }

  bind(): void {
    const t = this._headerComponent.template;
    this._listeners.bindAll([
      {
        element: t.titleInput,
        event: "input",
        handler: () => this.onTitleChanged(),
      },
      {
        element: t.artistInput,
        event: "input",
        handler: () => this.onArtistChanged(),
      },
      {
        element: t.albumInput,
        event: "input",
        handler: () => this.onAlbumChanged(),
      },
      {
        element: t.releaseDateInput,
        event: "input",
        handler: () => this.onReleaseDateChanged(),
      },
      {
        element: t.releaseDateInput,
        event: "blur",
        handler: () => this.onReleaseDateBlurred(),
      },
      { element: t.titleInput, event: "keydown", handler: blockEnter },
      { element: t.artistInput, event: "keydown", handler: blockEnter },
      { element: t.albumInput, event: "keydown", handler: blockEnter },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
