import { renderOnce, setImageAsset, setShortcutTooltip } from "../../shared";
import { NotationComponent } from "../../../notation/notation-component";
import { GuitarTechniqueType } from "../../../notation/model";
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
    button: HTMLButtonElement
  ): void {
    const tc = this.notationComponent.trackController;

    const selection = tc.selectionBeats;
    const selectionCursor = tc.selectionCursor;
    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";
    let isApplied = false;
    let isDisabled = false;

    if (selectionCursor === undefined) {
      isDisabled = type === GuitarTechniqueType.Bend;
      isApplied =
        !isDisabled && selection.some((beat) => beat.hasTechnique(type));
    } else {
      const note = selectionCursor.note;
      isDisabled = note === null;
      if (note !== null) {
        isApplied = note.hasTechnique(type);
        isDisabled = !isApplied && !note.isTechniqueApplicable(type);
      }
    }

    button.disabled = isDisabled;
    button.classList.toggle(appliedCSSClass, isApplied);
    button.classList.toggle(disabledCSSClass, isDisabled);
    button.setAttribute("aria-pressed", `${isApplied}`);
  }

  private renderTechniqueButtons(): void {
    setImageAsset(
      this.template.vibratoButton,
      this.assetsPath,
      "img/techniques/vibrato.svg",
      "Vibrato"
    );
    setShortcutTooltip(this.template.vibratoButton, "Vibrato", "v");
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
    setShortcutTooltip(this.template.palmMuteButton, "Palm Mute", "p");
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
    setShortcutTooltip(this.template.letRingButton, "Let Ring", "Shift+L");
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
    setShortcutTooltip(this.template.nhButton, "Nat. Harmonic", "h");
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
    setShortcutTooltip(this.template.phButton, "Pinch Harmonic", "Shift+H");
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
    setShortcutTooltip(this.template.legatoButton, "Legato", "l");
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
    setShortcutTooltip(this.template.slideButton, "Slide", "s");
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
    setShortcutTooltip(this.template.bendButton, "Bend", "b");
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
