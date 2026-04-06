import { NotationComponent } from "@/notation/notation-component";
import { createOption } from "@/shared";
import { PlayControlsTemplate } from "./play-controls-template";

const assetsPath = import.meta.env.BASE_URL;
const buttonSize = `30px`;

export class PlayControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: PlayControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: PlayControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-play-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.firstButton,
      this.template.prevButton,
      this.template.playButton,
      this.template.nextButton,
      this.template.lastButton,
      this.template.loopButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderPlayButtons(): void {
    const firstSrc = `${assetsPath}/img/ui/first.svg`;
    this.template.firstButton.setAttribute("src", firstSrc);
    this.template.firstButton.setAttribute("alt", "First bar");
    this.template.firstButton.setAttribute("width", buttonSize);
    this.template.firstButton.setAttribute("height", buttonSize);

    const prevSrc = `${assetsPath}/img/ui/prev.svg`;
    this.template.prevButton.setAttribute("src", prevSrc);
    this.template.prevButton.setAttribute("alt", "Prev bar");
    this.template.prevButton.setAttribute("width", buttonSize);
    this.template.prevButton.setAttribute("height", buttonSize);

    const playSrc = `${assetsPath}/img/ui/play.svg`;
    const pauseSrc = `${assetsPath}/img/ui/pause.svg`;
    const isPlaying = this.notationComponent.trackController.isPlaying;
    this.template.playButton.setAttribute("src", isPlaying ? pauseSrc : playSrc);
    this.template.playButton.setAttribute("alt", isPlaying ? "Pause" : "Play");
    this.template.playButton.setAttribute("width", buttonSize);
    this.template.playButton.setAttribute("height", buttonSize);

    const nextSrc = `${assetsPath}/img/ui/next.svg`;
    this.template.nextButton.setAttribute("src", nextSrc);
    this.template.nextButton.setAttribute("alt", "Next bar");
    this.template.nextButton.setAttribute("width", buttonSize);
    this.template.nextButton.setAttribute("height", buttonSize);

    const lastSrc = `${assetsPath}/img/ui/last.svg`;
    this.template.lastButton.setAttribute("src", lastSrc);
    this.template.lastButton.setAttribute("alt", "Last bar");
    this.template.lastButton.setAttribute("width", buttonSize);
    this.template.lastButton.setAttribute("height", buttonSize);

    const loopSrc = `${assetsPath}/img/ui/loop.svg`;
    this.template.loopButton.setAttribute("src", loopSrc);
    this.template.loopButton.setAttribute("alt", "Loop");
    this.template.loopButton.setAttribute("width", buttonSize);
    this.template.loopButton.setAttribute("height", buttonSize);
  }
  /**
   * Responsible for setting up the note controls:
   * Duration change, Dots & Tuplets
   */
  public render(): void {
    this.renderPlayButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
