import { NotationComponent } from "../../notation/notation-component";
import { Score } from "../../notation/model";
import { renderOnce } from "../shared";
import { ScoreHeaderTemplate } from "./score-header-template";

/** True when the browser sizes text fields to their content in CSS. */
function supportsFieldSizing(): boolean {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("field-sizing", "content")
  );
}

/**
 * Grows a text area to fit its wrapped text. Browsers without CSS
 * `field-sizing` need this.
 * @param textArea Text area to size
 */
export function fitTextAreaHeight(textArea: HTMLTextAreaElement): void {
  if (supportsFieldSizing()) {
    return;
  }
  textArea.style.height = "auto";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

export class ScoreHeaderTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: ScoreHeaderTemplate;
  private _assembled = false;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: ScoreHeaderTemplate
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
  }

  private assemble(): void {
    const t = this.template;
    t.container.classList.add("tu-score-header");
    t.titleInput.classList.add("tu-score-name-input");
    t.artistInput.classList.add("tu-score-artist-input");
    t.detailsContainer.classList.add("tu-score-details");
    t.albumInput.classList.add("tu-score-album-input");
    t.detailsSeparator.classList.add("tu-score-details-separator");
    t.releaseDateInput.classList.add("tu-score-release-date-input");

    t.titleInput.ariaLabel = "Score name";
    t.artistInput.ariaLabel = "Artist";
    t.albumInput.ariaLabel = "Album";
    t.releaseDateInput.ariaLabel = "Release date";
    t.titleInput.placeholder = "Score name";
    t.artistInput.placeholder = "Unknown artist";
    t.albumInput.placeholder = "Unknown album";
    t.releaseDateInput.placeholder = "Year";
    for (const textArea of [t.titleInput, t.artistInput, t.albumInput]) {
      textArea.rows = 1;
      textArea.spellcheck = false;
    }
    t.releaseDateInput.inputMode = "numeric";
    t.releaseDateInput.maxLength = "YYYY-MM-DD".length;
    t.releaseDateInput.title = "Year, or a date as YYYY-MM-DD";
    t.detailsSeparator.textContent = "·";
    t.detailsSeparator.ariaHidden = "true";

    t.detailsContainer.append(
      t.albumInput,
      t.detailsSeparator,
      t.releaseDateInput
    );
    t.container.append(t.titleInput, t.artistInput, t.detailsContainer);
    this.parentDiv.prepend(t.container);
  }

  /**
   * Shows a model value, unless the user is typing in the field. A partly
   * typed date is not saved yet, so a render must not replace it.
   */
  private renderValue(
    field: HTMLTextAreaElement | HTMLInputElement,
    value: string | null
  ): void {
    if (field.ownerDocument.activeElement !== field) {
      field.value = value ?? "";
    }
  }

  public render(score: Score): void {
    this._assembled = renderOnce(this._assembled, () => this.assemble());
    const t = this.template;
    this.renderValue(t.titleInput, score.name);
    this.renderValue(t.artistInput, score.artist);
    this.renderValue(t.albumInput, score.album);
    this.renderValue(t.releaseDateInput, score.releaseDate);
    t.releaseDateInput.removeAttribute("aria-invalid");

    const controller = this.notationComponent.trackController;
    const readOnly = !controller.canEdit;
    for (const field of [
      t.titleInput,
      t.artistInput,
      t.albumInput,
      t.releaseDateInput,
    ]) {
      field.disabled = readOnly;
      field.tabIndex = readOnly ? -1 : 0;
    }
    for (const textArea of [t.titleInput, t.artistInput, t.albumInput]) {
      fitTextAreaHeight(textArea);
    }
  }
}
