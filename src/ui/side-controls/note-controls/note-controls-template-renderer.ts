import { createDiv, createImage } from "@/shared";
import { NoteControlsTemplate } from "./note-controls-template";
import { NotationComponent } from "@/notation/notation-component";

export class NoteControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NoteControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: NoteControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-note-controls";
    this.template.noteControlsContainer.classList.add(cssClass);

    this.template.noteControlsContainer.append(
      ...this.template.noteDurationButtons
    );
    this.template.noteControlsContainer.append(
      this.template.dot1Button,
      this.template.dot2Button
    );
    this.template.noteControlsContainer.append(
      this.template.tuplet2Button,
      this.template.tuplet3Button,
      this.template.tupletButton
    );

    this.rootDiv.appendChild(this.template.noteControlsContainer);
  }

  private renderDurationButtons(): void {
    const notes = [
      { num: 1, alt: "Whole" },
      { num: 2, alt: "Half" },
      { num: 4, alt: "Quarter" },
      { num: 8, alt: "Eighth" },
      { num: 16, alt: "Sixteenth" },
      { num: 32, alt: "Thirty-second" },
    ];
    for (let i = 0; i < notes.length; i++) {
      const src = `${this.assetsPath}/img/notes/${notes[i].num}.svg`;
      const dataDuration = `${notes[i].num}`;
      const alt = `${notes[i].alt} note`;

      this.template.noteDurationButtons[i].setAttribute("src", src);
      this.template.noteDurationButtons[i].setAttribute(
        "data-duration",
        dataDuration
      );
      this.template.noteDurationButtons[i].setAttribute("alt", alt);
    }
  }

  private renderDotButtons(): void {
    const dot1Src = `${this.assetsPath}/img/ui/dot1.svg`;
    this.template.dot1Button.setAttribute("src", dot1Src);
    this.template.dot1Button.setAttribute("data-dot", "1");
    this.template.dot1Button.setAttribute("alt", "Dot");

    const dot2Src = `${this.assetsPath}/img/ui/dot2.svg`;
    this.template.dot2Button.setAttribute("src", dot2Src);
    this.template.dot2Button.setAttribute("data-dot", "2");
    this.template.dot2Button.setAttribute("alt", "Double dot");
  }

  private renderTupletButtons(): void {
    const tuplet2Src = `${this.assetsPath}/img/ui/tuplet-2.svg`;
    this.template.tuplet2Button.setAttribute("src", tuplet2Src);
    this.template.tuplet2Button.setAttribute("data-tuplet", "2");
    this.template.tuplet2Button.setAttribute("alt", "Tuplet");

    const tuplet3Src = `${this.assetsPath}/img/ui/tuplet-3.svg`;
    this.template.tuplet3Button.setAttribute("src", tuplet3Src);
    this.template.tuplet3Button.setAttribute("data-tuplet", "3");
    this.template.tuplet3Button.setAttribute("alt", "Triplet");

    const tupletSrc = `${this.assetsPath}/img/ui/tuplet.svg`;
    this.template.tupletButton.setAttribute("src", tupletSrc);
    this.template.tupletButton.setAttribute("data-tuplet", "0");
    this.template.tupletButton.setAttribute("alt", "Custom tuplet");
  }

  /**
   * Responsible for setting up the note controls:
   * Duration change, Dots & Tuplets
   */
  public render(): void {
    this.renderDurationButtons();
    this.renderDotButtons();
    this.renderTupletButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
