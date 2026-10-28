import { resolveAssetUrl, type ResolvedAssetConfig } from "../../../../assets";
import {
  MAX_PITCH_SHIFT_SEMITONES,
  MIN_PITCH_SHIFT_SEMITONES,
} from "../../../../player/playback-constants";
import { PitchShiftControlTemplate } from "./pitch-shift-control-template";

export class PitchShiftControlTemplateRenderer {
  private _assembled = false;

  constructor(private readonly _template: PitchShiftControlTemplate) {}

  private assembleContainer(): void {
    const template = this._template;
    template.element.className = "tu-playback-pitch-shift";
    template.element.setAttribute("role", "group");
    template.element.setAttribute("aria-label", "Playback pitch shift");

    template.iconButton.className = "tu-icon-button";
    template.iconButton.setAttribute("aria-hidden", "true");
    template.iconButton.append(template.image);

    template.buttons.className = "tu-playback-pitch-shift-buttons";
    template.buttons.append(template.increaseButton, template.decreaseButton);
    template.element.append(
      template.iconButton,
      template.valueElement,
      template.buttons
    );
    this._assembled = true;
  }

  public render(value: number, assetsPath: ResolvedAssetConfig): void {
    if (!this._assembled) {
      this.assembleContainer();
    }

    const template = this._template;
    template.image.alt = "";
    template.image.src = resolveAssetUrl(assetsPath, "img/ui/pitch-shift.svg");

    template.valueElement.className = "tu-playback-pitch-shift-value";
    template.valueElement.setAttribute("role", "spinbutton");
    template.valueElement.setAttribute(
      "aria-valuemin",
      String(MIN_PITCH_SHIFT_SEMITONES)
    );
    template.valueElement.setAttribute(
      "aria-valuemax",
      String(MAX_PITCH_SHIFT_SEMITONES)
    );
    template.valueElement.setAttribute(
      "aria-label",
      "Pitch shift in semitones"
    );

    const formattedValue = value > 0 ? `+${value}` : String(value);
    template.valueElement.value = formattedValue;
    template.valueElement.textContent = formattedValue;
    template.valueElement.setAttribute("aria-valuenow", String(value));
    template.valueElement.setAttribute(
      "aria-valuetext",
      `${formattedValue} semitones`
    );

    template.increaseButton.type = "button";
    template.increaseButton.className = "tu-playback-pitch-shift-increase";
    template.increaseButton.setAttribute(
      "aria-label",
      "Increase playback pitch"
    );
    template.increaseButton.textContent = "+";
    template.increaseButton.disabled = value >= MAX_PITCH_SHIFT_SEMITONES;

    template.decreaseButton.type = "button";
    template.decreaseButton.className = "tu-playback-pitch-shift-decrease";
    template.decreaseButton.setAttribute(
      "aria-label",
      "Decrease playback pitch"
    );
    template.decreaseButton.textContent = "−";
    template.decreaseButton.disabled = value <= MIN_PITCH_SHIFT_SEMITONES;
  }
}
