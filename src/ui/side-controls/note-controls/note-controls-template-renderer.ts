import { createDiv, createImage } from "@/shared";
import { NoteControlsTemplate } from "./note-controls-template";
import { NotationComponent } from "@/notation/notation-component";

export class NoteControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NoteControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: NoteControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-note-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(...this.template.durationButtons);
    this.template.container.append(
      this.template.dot1Button,
      this.template.dot2Button,
      this.template.tuplet2Button,
      this.template.tuplet3Button,
      this.template.tupletButton
    );

    this.parentDiv.appendChild(this.template.container);
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
    const selection =
      this.notationComponent.tabController.getSelectionAsArray();
    const appliedCSSClass = "tu-applied-img";

    for (let i = 0; i < notes.length; i++) {
      const button = this.template.durationButtons[i];

      // Image attributes
      const src = `${this.assetsPath}/img/notes/${notes[i].num}.svg`;
      const dataDuration = `${notes[i].num}`;
      const alt = `${notes[i].alt} note`;
      button.setAttribute("src", src);
      button.setAttribute("data-duration", dataDuration);
      button.setAttribute("alt", alt);

      // Mark applied status
      const beatsOfCurDuration = selection.find(
        (b) => b.duration === 1 / notes[i].num
      );
      if (beatsOfCurDuration !== undefined) {
        button.classList.add(appliedCSSClass);
      } else {
        button.classList.remove(appliedCSSClass);
      }
    }
  }

  private renderDotButtons(): void {
    const selection =
      this.notationComponent.tabController.getSelectionAsArray();
    const appliedCSSClass = "tu-applied-img";

    // Image attributes
    const dot1Src = `${this.assetsPath}/img/ui/dot1.svg`;
    this.template.dot1Button.setAttribute("src", dot1Src);
    this.template.dot1Button.setAttribute("data-dot", "1");
    this.template.dot1Button.setAttribute("alt", "Dot");

    const dot2Src = `${this.assetsPath}/img/ui/dot2.svg`;
    this.template.dot2Button.setAttribute("src", dot2Src);
    this.template.dot2Button.setAttribute("data-dot", "2");
    this.template.dot2Button.setAttribute("alt", "Double dot");

    // Mark singular dot applied status
    const beatsDot1 = selection.find((b) => b.dots === 1);
    if (beatsDot1 !== undefined) {
      this.template.dot1Button.classList.add(appliedCSSClass);
    } else {
      this.template.dot1Button.classList.remove(appliedCSSClass);
    }

    // Mark double dot applied status
    const beatsDot2 = selection.find((b) => b.dots === 2);
    if (beatsDot2 !== undefined) {
      this.template.dot2Button.classList.add(appliedCSSClass);
    } else {
      this.template.dot2Button.classList.remove(appliedCSSClass);
    }
  }

  private renderTupletButtons(): void {
    const selection =
      this.notationComponent.tabController.getSelectionAsArray();
    const appliedCSSClass = "tu-applied-img";

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

    let hasTuplet2: boolean = false;
    let hasTuplet3: boolean = false;
    let hasTuplet: boolean = false;
    for (const beat of selection) {
      if (beat.tupletSettings === undefined) {
        continue;
      }

      if (
        beat.tupletSettings.normalCount === 2 &&
        beat.tupletSettings.tupletCount === 1
      ) {
        hasTuplet2 = true;
      } else if (
        beat.tupletSettings.normalCount === 3 &&
        beat.tupletSettings.tupletCount === 2
      ) {
        hasTuplet3 = true;
      } else {
        hasTuplet = true;
      }
    }

    if (hasTuplet2) {
      this.template.tuplet2Button.classList.add(appliedCSSClass);
    } else {
      this.template.tuplet2Button.classList.remove(appliedCSSClass);
    }

    if (hasTuplet3) {
      this.template.tuplet3Button.classList.add(appliedCSSClass);
    } else {
      this.template.tuplet3Button.classList.remove(appliedCSSClass);
    }

    if (hasTuplet) {
      this.template.tupletButton.classList.add(appliedCSSClass);
    } else {
      this.template.tupletButton.classList.remove(appliedCSSClass);
    }
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
