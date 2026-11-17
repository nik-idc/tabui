import { renderOnce, setImageAsset, setShortcutTooltip } from "../../shared";
import { NotationComponent } from "../../../notation/notation-component";
import {
  AccentType,
  BeatGuitarTechniqueType,
  GuitarTechniqueType,
} from "../../../notation/model";
import { TechniqueControlsTemplate } from "./technique-controls-template";
import type { ResolvedAssetConfig } from "../../../assets";

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
    const t = this.template;
    t.container.classList.add("tu-technique-controls");

    // DOM order is also the Tab key order.
    t.styleGroup.append(
      t.vibratoButton,
      t.palmMuteButton,
      t.letRingButton,
      t.strokeButton
    );
    t.articulationGroup.append(
      t.tieButton,
      t.tieBackButton,
      t.legatoButton,
      t.slideButton,
      t.bendButton,
      t.tapButton,
      t.nhButton,
      t.phButton
    );
    t.accentGroup.append(t.accentButton, t.heavyAccentButton);

    const groups = [t.styleGroup, t.articulationGroup, t.accentGroup];
    for (const group of groups) {
      group.classList.add("tu-technique-group");
    }
    t.container.append(...groups);
    this.parentDiv.appendChild(t.container);
  }

  /**
   * Shows a toggle button's state.
   * @param isApplied Pressed state; defaults to whether a selected note has the technique.
   */
  private renderTechniqueButtonState(
    type: GuitarTechniqueType,
    button: HTMLButtonElement,
    isApplied: boolean = this.notationComponent.trackController.hasSelectedTechnique(
      type
    )
  ): void {
    const tc = this.notationComponent.trackController;

    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";
    const isDisabled = !tc.canSetTechnique(type);

    button.disabled = isDisabled;
    button.classList.toggle(appliedCSSClass, isApplied);
    button.classList.toggle(disabledCSSClass, isDisabled);
    button.setAttribute("aria-pressed", `${isApplied}`);
  }

  /** Tie back is an action, not a toggle, so it has no pressed state. */
  private renderTieBackButton(): void {
    const button = this.template.tieBackButton;
    const label = "Tie as far back as possible";
    setImageAsset(
      button,
      this.assetsPath,
      "img/techniques/tie-back.svg",
      label
    );
    setShortcutTooltip(button, label, "Shift+J");
    const isDisabled = !this.notationComponent.trackController.canSetTechnique(
      GuitarTechniqueType.Tie,
      { tieToEarliest: true }
    );
    button.disabled = isDisabled;
    button.classList.toggle("tu-disabled-img", isDisabled);
  }

  /** Shows stroke state. The button opens the settings dialog, so it is pressed when any target beat has a stroke. */
  private renderStrokeButton(): void {
    const tc = this.notationComponent.trackController;
    const button = this.template.strokeButton;
    const isApplied = tc.hasSelectedBeatTechnique(
      BeatGuitarTechniqueType.Stroke
    );
    const isDisabled = !tc.canSetBeatTechnique(BeatGuitarTechniqueType.Stroke);

    setImageAsset(
      button,
      this.assetsPath,
      "img/techniques/stroke.svg",
      "Stroke"
    );
    setShortcutTooltip(button, "Stroke", "Shift+D");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-pressed", `${isApplied}`);
    button.classList.toggle("tu-applied-img", isApplied);
    button.disabled = isDisabled;
    button.classList.toggle("tu-disabled-img", isDisabled);
  }

  private renderTechniqueButtons(): void {
    const tc = this.notationComponent.trackController;
    setImageAsset(
      this.template.tieButton,
      this.assetsPath,
      "img/techniques/tie.svg",
      "Tie"
    );
    setShortcutTooltip(this.template.tieButton, "Tie", "j");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Tie,
      this.template.tieButton
    );
    this.renderTieBackButton();
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
      "Natural Harmonic"
    );
    setShortcutTooltip(this.template.nhButton, "Natural Harmonic", "h");
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

    setImageAsset(
      this.template.tapButton,
      this.assetsPath,
      "img/techniques/tap.svg",
      "Tap"
    );
    setShortcutTooltip(this.template.tapButton, "Tap", "k");
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Tap,
      this.template.tapButton
    );

    setImageAsset(
      this.template.accentButton,
      this.assetsPath,
      "img/techniques/accent.svg",
      "Accent"
    );
    setShortcutTooltip(this.template.accentButton, "Accent", "c");
    // Pressed like a stroke direction: when a click would remove this kind.
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Accent,
      this.template.accentButton,
      tc.isSelectedAccentOfKind(AccentType.Normal)
    );

    setImageAsset(
      this.template.heavyAccentButton,
      this.assetsPath,
      "img/techniques/heavy-accent.svg",
      "Heavy Accent"
    );
    setShortcutTooltip(
      this.template.heavyAccentButton,
      "Heavy Accent",
      "Shift+C"
    );
    this.renderTechniqueButtonState(
      GuitarTechniqueType.Accent,
      this.template.heavyAccentButton,
      tc.isSelectedAccentOfKind(AccentType.Heavy)
    );
  }

  public render(): void {
    this.renderTechniqueButtons();
    this.renderStrokeButton();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
