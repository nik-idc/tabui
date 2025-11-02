import { createDiv, createImage } from "@/shared";
import { EffectControlsTemplate } from "./effect-controls-template";
import { NotationComponent } from "@/notation/notation-component";

export class EffectControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: EffectControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: EffectControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-effect-controls";
    this.template.effectControlsContainer.classList.add(cssClass);

    this.template.effectControlsContainer.append(
      this.template.vibratoButton,
      this.template.palmMuteButton,
      this.template.nhButton,
      this.template.phButton,
      this.template.hammerOnButton,
      this.template.pullOffButton,
      this.template.slideButton,
      this.template.bendButton
    );
    this.rootDiv.appendChild(this.template.effectControlsContainer);
  }

  private renderEffectButtons(): void {
    const vibratoSrc = `${this.assetsPath}/img/effects/vibrato.svg`;
    this.template.vibratoButton.setAttribute("src", vibratoSrc);
    this.template.vibratoButton.setAttribute("alt", "Vibrato");

    const pmSrc = `${this.assetsPath}/img/effects/pm.svg`;
    this.template.palmMuteButton.setAttribute("src", pmSrc);
    this.template.palmMuteButton.setAttribute("alt", "Palm Mute");

    const nhSrc = `${this.assetsPath}/img/effects/nh.svg`;
    this.template.nhButton.setAttribute("src", nhSrc);
    this.template.nhButton.setAttribute("alt", "Nat. Harmonic");

    const phSrc = `${this.assetsPath}/img/effects/ph.svg`;
    this.template.phButton.setAttribute("src", phSrc);
    this.template.phButton.setAttribute("alt", "Pinch Harmonic");

    const hammerOnSrc = `${this.assetsPath}/img/effects/hammer-on.svg`;
    this.template.hammerOnButton.setAttribute("src", hammerOnSrc);
    this.template.hammerOnButton.setAttribute("alt", "Hammer-on");

    const pullOffSrc = `${this.assetsPath}/img/effects/pull-off.svg`;
    this.template.pullOffButton.setAttribute("src", pullOffSrc);
    this.template.pullOffButton.setAttribute("alt", "Pull-off");

    const slideSrc = `${this.assetsPath}/img/effects/slide-up.svg`;
    this.template.slideButton.setAttribute("src", slideSrc);
    this.template.slideButton.setAttribute("alt", "Slide");

    const bendSrc = `${this.assetsPath}/img/effects/bend.svg`;
    this.template.bendButton.setAttribute("src", bendSrc);
    this.template.bendButton.setAttribute("alt", "Bend");
  }

  public render(): void {
    this.renderEffectButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
