import { ContainedDialog } from "../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../notation/notation-component";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { NewTrackControlsTemplateRenderer } from "./new-track-controls-template-renderer";
import { getTuningText, getTuningValueText } from "../../../shared";
import {
  copyTuning,
  getDefaultStringInstrument,
  Guitar,
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TONES,
  isStringInstrumentType,
  NoteType,
  shiftPitch,
  StringInstrumentTone,
  StringInstrumentType,
  ElectricGuitarTone,
  MAX_TRACK_STAVES,
  tuningsEqual,
} from "../../../../notation/model";

/** A preset's tuning in dialog order: lowest string first, as shown. */
function presetTuning(tone: StringInstrumentTone): NoteType[] {
  return copyTuning(getDefaultStringInstrument(tone).tuning).reverse();
}

export class NewTrackControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NewTrackControlsTemplate;
  readonly templateRenderer: NewTrackControlsTemplateRenderer;

  private _instrumentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _instrumentType: InstrumentType = StringInstrumentType.ElectricGuitar;
  private _instrumentTone: StringInstrumentTone = ElectricGuitarTone.Clean;
  private _trackName: string = "New track";
  private _stringCount: number = 6;
  /** Tuning with octaves, lowest string first, as the dialog shows it. */
  private _tuning: NoteType[] = presetTuning(ElectricGuitarTone.Clean);
  private _staffCount: number = 1;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    private readonly _announce: (text: string) => void
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new NewTrackControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new NewTrackControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
    this.template.stringCountContainer.addEventListener("focusin", () =>
      this._announce(`String count ${this._stringCount}`)
    );
    this.template.staffCountContainer.addEventListener("focusin", () =>
      this._announce(`Staff count ${this._staffCount}`)
    );
    this.template.wholeTuningContainer.addEventListener("focusin", () =>
      this._announce(getTuningValueText(this.tuning))
    );
    this.template.tuningContainer.addEventListener("focusin", (event) => {
      const index = this.template.tuningStringContainers.findIndex((element) =>
        element.contains(event.target as Node)
      );
      if (index >= 0) {
        this._announce(getTuningValueText(this.tuning, index));
      }
    });
  }

  public render(): void {
    this.templateRenderer.render(
      this._instrumentFamily,
      this._instrumentType,
      this._instrumentTone,
      this._trackName,
      this._stringCount,
      this.tuning,
      this._staffCount
    );
  }

  public setType(newType: InstrumentType): void {
    const tones = INSTRUMENT_TONES[newType];
    if (tones === undefined || tones.length === 0) {
      return;
    }

    this._instrumentType = newType;
    this.setTone(tones[0]);
  }

  /**
   * Selects a tone. When its preset tuning differs from the current tone's,
   * the dialog takes the new preset's string count and tuning. Otherwise it
   * keeps the user's tuning, for example from steel to nylon.
   */
  public setTone(newTone: StringInstrumentTone): void {
    const oldPreset = getDefaultStringInstrument(this._instrumentTone);
    const newPreset = getDefaultStringInstrument(newTone);
    this._instrumentTone = newTone;
    if (!tuningsEqual(oldPreset.tuning, newPreset.tuning)) {
      this._stringCount = newPreset.stringsCount;
      this._tuning = presetTuning(newTone);
    }
    this.render();
  }

  public setTrackName(trackName: string): void {
    this._trackName = trackName;
  }

  /**
   * Changes the string count. The tone's preset count restores the preset
   * tuning. Other counts add strings a fourth below the lowest string, as on
   * 7- and 8-string guitars, or remove the highest strings.
   */
  public setStringCount(stringCount: number): void {
    if (
      stringCount ===
      getDefaultStringInstrument(this._instrumentTone).stringsCount
    ) {
      this._tuning = presetTuning(this._instrumentTone);
    } else {
      while (this._tuning.length < stringCount) {
        this._tuning.unshift(shiftPitch(this._tuning[0], -5));
      }
      this._tuning = this._tuning.slice(0, stringCount);
    }
    this._stringCount = stringCount;
    this.render();
  }

  public shiftStringCount(delta: number): void {
    const nextStringCount = Math.min(
      12,
      Math.max(1, this._stringCount + delta)
    );
    if (nextStringCount === this._stringCount) {
      return;
    }

    this.setStringCount(nextStringCount);
    this._announce(
      `String count ${this._stringCount}. ${getTuningValueText(this.tuning)}`
    );
  }

  /** Changes the staff count by delta, within 1 through MAX_TRACK_STAVES. */
  public shiftStaffCount(delta: number): void {
    const next = Math.min(
      MAX_TRACK_STAVES,
      Math.max(1, this._staffCount + delta)
    );
    if (next === this._staffCount) {
      return;
    }

    this._staffCount = next;
    this.render();
    this._announce(`Staff count ${this._staffCount}`);
  }

  /** Shifts one string, by its position in the dialog, lowest string first. */
  public shiftTuningString(stringIndex: number, semitones: number): void {
    const previous = this._tuning[stringIndex];
    const next = shiftPitch(previous, semitones);
    this._tuning[stringIndex] = next;
    this.render();
    if (next !== previous) {
      this._announce(getTuningValueText(this.tuning, stringIndex));
    }
  }

  /** Shifts every string; does nothing if any string would leave the octave range. */
  public shiftWholeTuning(semitones: number): void {
    const next = this._tuning.map((note) => shiftPitch(note, semitones));
    if (next.some((note, i) => note === this._tuning[i])) {
      return;
    }
    this._tuning = next;
    this.render();
    this._announce(getTuningValueText(this.tuning));
  }

  public makeInstrument(): Guitar {
    if (!isStringInstrumentType(this._instrumentType)) {
      throw new Error("Unsupported instrument selection");
    }

    return new Guitar(
      this._instrumentType,
      this._instrumentTone,
      this._trackName,
      this._stringCount,
      copyTuning(this._tuning).reverse(),
      getDefaultStringInstrument(this._instrumentTone).fretsCount
    );
  }

  public get instrumentFamily(): InstrumentFamily {
    return this._instrumentFamily;
  }

  public get instrumentType(): InstrumentType {
    return this._instrumentType;
  }

  public get instrumentTone(): StringInstrumentTone {
    return this._instrumentTone;
  }

  public get trackName(): string {
    return this._trackName;
  }

  public get stringCount(): number {
    return this._stringCount;
  }

  public get staffCount(): number {
    return this._staffCount;
  }

  /** Tuning as note names, lowest string first, without octaves. */
  public get tuning(): string {
    return getTuningText(this._tuning);
  }
}
