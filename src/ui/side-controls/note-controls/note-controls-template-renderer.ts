import { renderOnce, setImageAsset } from "../../shared";
import { NoteControlsTemplate } from "./note-controls-template";
import { NotationComponent } from "../../../notation/notation-component";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class NoteControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: NoteControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: NoteControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
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

    this.template.fretSection.classList.add("tu-control-section");
    this.template.fretSection.append("Fret:", this.template.fretButton);

    this.template.durationSection.classList.add("tu-control-section");
    this.template.durationGrid.classList.add(
      "tu-control-grid",
      "tu-duration-grid"
    );
    this.template.durationSection.append(
      "Duration:",
      this.template.durationGrid
    );
    this.template.durationGrid.append(
      this.template.durationButtons[0],
      this.template.durationButtons[1],
      this.template.durationButtons[2],
      this.template.durationButtons[3],
      this.template.durationButtons[4],
      this.template.durationButtons[5],
      this.template.durationButtons[6],
      this.template.dot1Button,
      this.template.dot2Button
    );

    this.template.beatSection.classList.add("tu-control-section");
    this.template.beatGrid.classList.add("tu-control-grid", "tu-beat-grid");
    this.template.beatSection.append("Beat:", this.template.beatGrid);
    this.template.beatGrid.append(
      this.template.restButton,
      this.template.insertBeatBeforeButton,
      this.template.insertBeatAfterButton,
      this.template.removeBeatButton,
      this.template.tuplet2Button,
      this.template.tuplet3Button,
      this.template.tupletButton
    );

    this.template.voiceSection.classList.add("tu-control-section");
    this.template.voiceGrid.classList.add("tu-control-grid", "tu-voice-grid");
    this.template.voiceSection.append("Voices:", this.template.voiceGrid);
    this.template.voiceGrid.append(...this.template.voiceButtons);

    this.template.container.append(
      this.template.fretSection,
      this.template.durationSection,
      this.template.beatSection,
      this.template.voiceSection
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
      { num: 64, alt: "Sixty-fourth" },
    ];
    const selectedBeats =
      this.notationComponent.trackController.selectionAsBeats;
    const appliedCSSClass = "tu-applied-img";

    for (let i = 0; i < notes.length; i++) {
      const button = this.template.durationButtons[i];

      const dataDuration = `${notes[i].num}`;
      const alt = `${notes[i].alt} note`;
      setImageAsset(
        button,
        this.assetsPath,
        `img/notes/${notes[i].num}.svg`,
        alt,
        {
          "data-duration": dataDuration,
        }
      );

      // Mark applied status
      const beatsOfCurDuration = selectedBeats.find(
        (b) => b.baseDuration === 1 / notes[i].num
      );
      if (beatsOfCurDuration !== undefined) {
        button.classList.add(appliedCSSClass);
      } else {
        button.classList.remove(appliedCSSClass);
      }
    }

    const hasRest = selectedBeats.find((beat) => beat.isRest()) !== undefined;
    setImageAsset(
      this.template.restButton,
      this.assetsPath,
      "img/notes/rest-4.svg",
      "Quarter rest"
    );
    this.template.restButton.title = "Set selected beat as rest";
    this.template.restButton.dataset["beatAction"] = "rest";
    this.template.restButton.classList.add("tu-rest-button");
    if (hasRest) {
      this.template.restButton.classList.add(appliedCSSClass);
    } else {
      this.template.restButton.classList.remove(appliedCSSClass);
    }
  }

  private renderVoiceButtons(): void {
    const activeVoiceNumber =
      this.notationComponent.trackController.activeVoiceNumber;
    const appliedCSSClass = "tu-applied-img";

    for (let i = 0; i < this.template.voiceButtons.length; i++) {
      const voiceNumber = i + 1;
      const button = this.template.voiceButtons[i];
      setImageAsset(
        button,
        this.assetsPath,
        `img/ui/voice-${voiceNumber}.svg`,
        `Voice ${voiceNumber}`
      );
      button.title = `Activate voice ${voiceNumber}`;
      button.dataset["voiceNumber"] = `${voiceNumber}`;
      button.classList.add("tu-voice-button");
      if (voiceNumber === activeVoiceNumber) {
        button.classList.add(appliedCSSClass);
      } else {
        button.classList.remove(appliedCSSClass);
      }
    }
  }

  private renderDotButtons(): void {
    const selectedBeats =
      this.notationComponent.trackController.selectionAsBeats;
    const appliedCSSClass = "tu-applied-img";

    // Image attributes
    setImageAsset(
      this.template.dot1Button,
      this.assetsPath,
      "img/ui/dot1.svg",
      "Dot",
      {
        "data-dot": "1",
      }
    );

    setImageAsset(
      this.template.dot2Button,
      this.assetsPath,
      "img/ui/dot2.svg",
      "Double dot",
      {
        "data-dot": "2",
      }
    );

    // Mark singular dot applied status
    const beatsDot1 = selectedBeats.find((b) => b.dots === 1);
    if (beatsDot1 !== undefined) {
      this.template.dot1Button.classList.add(appliedCSSClass);
    } else {
      this.template.dot1Button.classList.remove(appliedCSSClass);
    }

    // Mark double dot applied status
    const beatsDot2 = selectedBeats.find((b) => b.dots === 2);
    if (beatsDot2 !== undefined) {
      this.template.dot2Button.classList.add(appliedCSSClass);
    } else {
      this.template.dot2Button.classList.remove(appliedCSSClass);
    }
  }

  private renderTupletButtons(): void {
    const selectedBeats =
      this.notationComponent.trackController.selectionAsBeats;
    const appliedCSSClass = "tu-applied-img";

    setImageAsset(
      this.template.tuplet2Button,
      this.assetsPath,
      "img/ui/tuplet-2.svg",
      "Tuplet",
      {
        "data-tuplet": "2",
      }
    );

    setImageAsset(
      this.template.tuplet3Button,
      this.assetsPath,
      "img/ui/tuplet-3.svg",
      "Triplet",
      {
        "data-tuplet": "3",
      }
    );

    setImageAsset(
      this.template.tupletButton,
      this.assetsPath,
      "img/ui/tuplet.svg",
      "Custom tuplet",
      {
        "data-tuplet": "0",
      }
    );

    let hasTuplet2: boolean = false;
    let hasTuplet3: boolean = false;
    let hasTuplet: boolean = false;
    for (const beat of selectedBeats) {
      if (beat.tupletSettings === null) {
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

  private renderBeatEditButtons(): void {
    setImageAsset(
      this.template.insertBeatBeforeButton,
      this.assetsPath,
      "img/ui/add-before.svg",
      "Insert beat before",
      {
        "data-beat-action": "insert-before",
      }
    );
    this.template.insertBeatBeforeButton.title = "Insert beat before";

    setImageAsset(
      this.template.insertBeatAfterButton,
      this.assetsPath,
      "img/ui/add-after.svg",
      "Insert beat after",
      {
        "data-beat-action": "insert-after",
      }
    );
    this.template.insertBeatAfterButton.title = "Insert beat after";

    setImageAsset(
      this.template.removeBeatButton,
      this.assetsPath,
      "img/ui/remove.svg",
      "Remove beat",
      {
        "data-beat-action": "remove",
      }
    );
    this.template.removeBeatButton.title = "Remove beat";
  }

  private renderFretButton(): void {
    setImageAsset(
      this.template.fretButton,
      this.assetsPath,
      "img/ui/edit-fret.svg",
      "Edit fret"
    );
    this.template.fretButton.title = "Edit fret";
  }

  /**
   * Responsible for setting up the note controls:
   * Duration change, Dots & Tuplets
   */
  public render(): void {
    this.renderDurationButtons();
    this.renderVoiceButtons();
    this.renderDotButtons();
    this.renderBeatEditButtons();
    this.renderFretButton();
    this.renderTupletButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
