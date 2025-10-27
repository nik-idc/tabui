import { createDiv, createImage } from "@/shared";

/**
 * Class responsible for building the side controls:
 * - Note actions (duration change, tupltes)
 * - Effects
 * - Measure level changes (tempo, time signature, repeats)
 */
export class SideControlsTemplateBuilder {
  private _rootDiv: HTMLDivElement;

  constructor(rootDiv: HTMLDivElement) {
    this._rootDiv = rootDiv;
  }

  private buildSeparator(): void {
    const separator = new HTMLHRElement();
    separator.setAttribute("class", "separator");
    this._rootDiv.appendChild(separator);
  }

  private buildNoteActionsControls(): void {
    const noteActionsControls = createDiv();
    noteActionsControls.setAttribute("id", "play-controls-container");
    noteActionsControls.setAttribute("class", "control-group");

    const notes = [
      { num: 1, alt: "Whole" },
      { num: 2, alt: "Half" },
      { num: 4, alt: "Quarter" },
      { num: 8, alt: "Eighth" },
      { num: 16, alt: "Sixteenth" },
      { num: 32, alt: "Thirty-second" },
    ];
    for (const note of notes) {
      const noteButton = createImage();
      noteButton.setAttribute("src", `/img/notes/${note.num}.svg`);
      noteButton.setAttribute("data-duration", `${note.num}`);
      noteButton.setAttribute("alt", `${note.alt} note`);

      noteActionsControls.appendChild(noteButton);
    }

    const dot1Button = createImage();
    dot1Button.setAttribute("src", "/img/notes/dot1.svg");
    dot1Button.setAttribute("data-dot", "1");
    dot1Button.setAttribute("alt", "Dot");
    noteActionsControls.appendChild(dot1Button);

    const dot2Button = createImage();
    dot2Button.setAttribute("src", "/img/notes/dot2.svg");
    dot2Button.setAttribute("data-dot", "2");
    dot2Button.setAttribute("alt", "Double dot");
    noteActionsControls.appendChild(dot2Button);

    const tuplet3Button = createImage();
    tuplet3Button.setAttribute("src", "/img/notes/tuplet-3.svg");
    tuplet3Button.setAttribute("data-tuplet", "3");
    tuplet3Button.setAttribute("alt", "Triplet");
    noteActionsControls.appendChild(tuplet3Button);

    const tuplet2Button = createImage();
    tuplet2Button.setAttribute("src", "/img/notes/tuplet-2.svg");
    tuplet2Button.setAttribute("data-tuplet", "2");
    tuplet2Button.setAttribute("alt", "Tuplet");
    noteActionsControls.appendChild(tuplet2Button);

    const tupletButton = createImage();
    tupletButton.setAttribute("src", "/img/notes/tuplet.svg");
    tupletButton.setAttribute("data-tuplet", "0");
    tupletButton.setAttribute("alt", "Custom tuplet");
    noteActionsControls.appendChild(tupletButton);

    this._rootDiv.appendChild(noteActionsControls);
  }

  private buildEffectsControls(): void {
    const effectsControls = createDiv();
    effectsControls.setAttribute("id", "play-controls-container");
    effectsControls.setAttribute("class", "control-group");

    const effects = [
      { filename: "vibrato", dataEffect: "vibrato", alt: "Vibrato" },
      { filename: "pm", dataEffect: "palm-mute", alt: "Palm Mute" },
      { filename: "nh", dataEffect: "nat-harmonic", alt: "Nat. Harmonic" },
      { filename: "ph", dataEffect: "pinch-harmonic", alt: "Pinch Harmonic" },
      { filename: "hammer-on", dataEffect: "hammer-on", alt: "Hammer-on" },
      { filename: "pull-off", dataEffect: "pull-off", alt: "Pull-off" },
      { filename: "slide-up", dataEffect: "slide", alt: "Slide" },
      { filename: "bend", dataEffect: "bend", alt: "Bend" },
    ];

    for (const effect of effects) {
      const effectButton = createImage();
      effectButton.setAttribute("src", `/img/effects/${effect.filename}.svg`);
      effectButton.setAttribute("data-effect", `${effect.dataEffect}`);
      effectButton.setAttribute("alt", effect.alt);

      effectsControls.appendChild(effectButton);
    }

    this._rootDiv.appendChild(effectsControls);
  }

  private buildMeasureControls(): void {
    const measureActionsControls = createDiv();
    measureActionsControls.setAttribute("id", "play-controls-container");
    measureActionsControls.setAttribute("class", "control-group");

    const measureButton = createImage();
    measureButton.setAttribute("id", "measureButton");
    measureButton.setAttribute("src", "/img/ui/measure.svg");
    measureButton.setAttribute("alt", "Time Signature");
    measureActionsControls.appendChild(measureButton);

    const repeatStartButton = createImage();
    repeatStartButton.setAttribute("id", "repeatStartButton");
    repeatStartButton.setAttribute("src", "/img/ui/repeat-start.svg");
    repeatStartButton.setAttribute("alt", "Repeat start");
    measureActionsControls.appendChild(repeatStartButton);

    const repeatEndButton = createImage();
    repeatEndButton.setAttribute("id", "repeatEndButton");
    repeatEndButton.setAttribute("src", "/img/ui/repeat-end.svg");
    repeatEndButton.setAttribute("alt", "Repeat end");
    measureActionsControls.appendChild(repeatEndButton);

    this._rootDiv.appendChild(measureActionsControls);
  }

  public build(): void {
    // Clear everything
    this._rootDiv.replaceChildren();

    this.buildNoteActionsControls();
    this.buildSeparator();
    this.buildEffectsControls();
    this.buildSeparator();
    this.buildMeasureControls();
  }
}
