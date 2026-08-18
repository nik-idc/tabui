import { renderOnce, setImageAsset } from "../../shared";
import { NotationComponent } from "../../../notation/notation-component";
import {
  GuitarTechniqueType,
  NoteValue,
  TECHNIQUE_TYPE_TO_LABEL,
} from "../../../notation/model";
import { TechniqueControlsTemplate } from "./technique-controls-template";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class TechniqueControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TechniqueControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TechniqueControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
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
      this.template.letRingButton,
      this.template.legatoButton,
      this.template.slideButton,
      this.template.bendButton,
      this.template.nhButton,
      this.template.phButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderTechniqueButtonState(
    type: GuitarTechniqueType,
    button: HTMLImageElement
  ): void {
    const tc = this.notationComponent.trackController;

    const selection = tc.selectionBeats;
    const selectionCursor = tc.selectionCursor;
    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";

    if (selectionCursor === undefined) {
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
      const note = selectionCursor.note;
      if (note === null) {
        button.classList.remove(appliedCSSClass);
        button.classList.add(disabledCSSClass);
        return;
      }

      if (TECHNIQUE_TYPE_TO_LABEL[type] && note.noteValue === NoteValue.None) {
        button.classList.remove(appliedCSSClass);
        button.classList.add(disabledCSSClass);
        return;
      }

      if (note.hasTechnique(type)) {
        button.classList.add(appliedCSSClass);
        button.classList.remove(disabledCSSClass);
        return;
      }

      if (note.techniqueApplicable(type)) {
        button.classList.remove(appliedCSSClass);
        button.classList.remove(disabledCSSClass);
        return;
      }

      button.classList.remove(appliedCSSClass);
      button.classList.add(disabledCSSClass);
    }
  }

  private renderTechniqueButtons(): void {
    setImageAsset(
      this.template.vibratoButton,
      this.assetsPath,
      "img/techniques/vibrato.svg",
      "Vibrato"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Vibrato,
      this.template.vibratoButton
    );

    setImageAsset(
      this.template.palmMuteButton,
      this.assetsPath,
      "img/techniques/pm.svg",
      "Palm Mute"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.PalmMute,
      this.template.palmMuteButton
    );

    setImageAsset(
      this.template.letRingButton,
      this.assetsPath,
      "img/techniques/lr.svg",
      "Let Ring"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.LetRing,
      this.template.letRingButton
    );

    setImageAsset(
      this.template.nhButton,
      this.assetsPath,
      "img/techniques/nh.svg",
      "Nat. Harmonic"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.NaturalHarmonic,
      this.template.nhButton
    );

    setImageAsset(
      this.template.phButton,
      this.assetsPath,
      "img/techniques/ph.svg",
      "Pinch Harmonic"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.PinchHarmonic,
      this.template.phButton
    );

    setImageAsset(
      this.template.legatoButton,
      this.assetsPath,
      "img/techniques/legato.svg",
      "Legato"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Legato,
      this.template.legatoButton
    );

    setImageAsset(
      this.template.slideButton,
      this.assetsPath,
      "img/techniques/slide-up.svg",
      "Slide"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Slide,
      this.template.slideButton
    );

    setImageAsset(
      this.template.bendButton,
      this.assetsPath,
      "img/techniques/bend.svg",
      "Bend"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Bend,
      this.template.bendButton
    );
  }

  public render(): void {
    this.renderTechniqueButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
