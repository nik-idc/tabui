import { createDiv, createImage } from "@/shared";
import { NotationComponent } from "@/notation/notation-component";
import { GuitarTechniqueType, NoteValue } from "@/notation";
import { TechniqueControlsTemplate } from "./technique-controls-template";
import { TECHNIQUE_TYPE_TO_LABEL } from "@/notation/controller";

export class TechniqueControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TechniqueControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TechniqueControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-technique-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.vibratoButton,
      this.template.palmMuteButton,
      this.template.nhButton,
      this.template.phButton,
      this.template.hammerOnButton,
      this.template.pullOffButton,
      this.template.slideButton,
      this.template.bendButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderTechniqueButtonState(
    type: GuitarTechniqueType,
    button: HTMLImageElement
  ): void {
    const selectionManager =
      this.notationComponent.trackController.trackControllerEditor
        .selectionManager;

    const selection = selectionManager.selectionAsBeats;
    const selectedNote = selectionManager.selectedNote;
    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";

    if (selectedNote === undefined) {
      if (TECHNIQUE_TYPE_TO_LABEL[type]) {
        button.classList.remove(appliedCSSClass);
        button.classList.add(disabledCSSClass);
        return;
      }

      if (selection.some((b) => b.hasTechnique(type))) {
        button.classList.add(appliedCSSClass);
        button.classList.remove(disabledCSSClass);
        return;
      }

      button.classList.remove(appliedCSSClass);
      button.classList.remove(disabledCSSClass);
    } else {
      if (
        TECHNIQUE_TYPE_TO_LABEL[type] &&
        selectedNote.note.noteValue === NoteValue.None
      ) {
        button.classList.remove(appliedCSSClass);
        button.classList.add(disabledCSSClass);
        return;
      }

      if (selectedNote.note.hasTechnique(type)) {
        button.classList.add(appliedCSSClass);
        button.classList.remove(disabledCSSClass);
        return;
      }

      if (selectedNote.note.techniqueApplicable(type)) {
        button.classList.remove(appliedCSSClass);
        button.classList.remove(disabledCSSClass);
        return;
      }

      button.classList.remove(appliedCSSClass);
      button.classList.add(disabledCSSClass);
    }
  }

  private renderTechniqueButtons(): void {
    const vibratoSrc = `${this.assetsPath}/img/techniques/vibrato.svg`;
    this.template.vibratoButton.setAttribute("src", vibratoSrc);
    this.template.vibratoButton.setAttribute("alt", "Vibrato");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Vibrato,
      this.template.vibratoButton
    );

    const pmSrc = `${this.assetsPath}/img/techniques/pm.svg`;
    this.template.palmMuteButton.setAttribute("src", pmSrc);
    this.template.palmMuteButton.setAttribute("alt", "Palm Mute");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.PalmMute,
      this.template.palmMuteButton
    );

    const nhSrc = `${this.assetsPath}/img/techniques/nh.svg`;
    this.template.nhButton.setAttribute("src", nhSrc);
    this.template.nhButton.setAttribute("alt", "Nat. Harmonic");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.NaturalHarmonic,
      this.template.nhButton
    );

    const phSrc = `${this.assetsPath}/img/techniques/ph.svg`;
    this.template.phButton.setAttribute("src", phSrc);
    this.template.phButton.setAttribute("alt", "Pinch Harmonic");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.PinchHarmonic,
      this.template.phButton
    );

    const hammerOnSrc = `${this.assetsPath}/img/techniques/hammer-on.svg`;
    this.template.hammerOnButton.setAttribute("src", hammerOnSrc);
    this.template.hammerOnButton.setAttribute("alt", "Hammer-on");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.HammerOnOrPullOff,
      this.template.hammerOnButton
    );

    const pullOffSrc = `${this.assetsPath}/img/techniques/pull-off.svg`;
    this.template.pullOffButton.setAttribute("src", pullOffSrc);
    this.template.pullOffButton.setAttribute("alt", "Pull-off");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.HammerOnOrPullOff,
      this.template.pullOffButton
    );

    const slideSrc = `${this.assetsPath}/img/techniques/slide-up.svg`;
    this.template.slideButton.setAttribute("src", slideSrc);
    this.template.slideButton.setAttribute("alt", "Slide");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Slide,
      this.template.slideButton
    );

    const bendSrc = `${this.assetsPath}/img/techniques/bend.svg`;
    this.template.bendButton.setAttribute("src", bendSrc);
    this.template.bendButton.setAttribute("alt", "Bend");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Bend,
      this.template.bendButton
    );
  }

  public render(): void {
    this.renderTechniqueButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
