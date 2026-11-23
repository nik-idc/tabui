import { ContainedDialog } from "../../../../../shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../../../notation/notation-component";
import {
  copyTuning,
  ElectricGuitarTone,
  Guitar,
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TONES,
  isStringInstrumentType,
  NoteType,
  shiftPitch,
  StringInstrumentTone,
  tuningsEqual,
  StringInstrumentType,
  Track,
  TrackInstrumentChangeMode,
} from "../../../../../notation";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { TrackSettingsControlsTemplateRenderer } from "./track-settings-controls-template-renderer";
import { getTuningText, getTuningValueText } from "../../../../shared";

export class TrackSettingsControlsComponent {
  readonly dialog: ContainedDialog;
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  private _track: Track;

  readonly template: TrackSettingsControlsTemplate;
  readonly templateRenderer: TrackSettingsControlsTemplateRenderer;

  private _instrumentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _instrumentType: InstrumentType;
  private _instrumentTone: StringInstrumentTone;
  private _stringCount: number;
  /** Track's tuning with octaves, lowest string first, as the dialog shows it. */
  private _originalTuning: NoteType[];
  /** Edited tuning, in the same order. */
  private _tuning: NoteType[];
  private _tuningChangeMode: TrackInstrumentChangeMode =
    TrackInstrumentChangeMode.KeepFrets;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    track: Track,
    private readonly _announce: (text: string) => void
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this._track = track;

    this.template = new TrackSettingsControlsTemplate();
    this.dialog = new ContainedDialog(
      this.template.dialogContainer,
      dialogEnforcer
    );
    this.templateRenderer = new TrackSettingsControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this._instrumentType = StringInstrumentType.ElectricGuitar;
    this._instrumentTone = ElectricGuitarTone.Clean;
    this._stringCount = 6;
    this._originalTuning = [];
    this._tuning = [];
    this.setTrack(track);
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

  public setTrack(track: Track): void {
    if (!(track.context.instrument instanceof Guitar)) {
      throw new Error("Non guitar instruments are currently unsupported");
    }

    this._track = track;
    this._instrumentFamily = track.context.instrument.family;
    this._instrumentType = track.context.instrument.type;
    this._instrumentTone = track.context.instrument
      .tone as StringInstrumentTone;
    this._stringCount = track.context.instrument.stringsCount;
    this._originalTuning = copyTuning(
      track.context.instrument.tuning
    ).reverse();
    this._tuning = copyTuning(this._originalTuning);
    this._tuningChangeMode = TrackInstrumentChangeMode.KeepFrets;
  }

  public render(): void {
    this.templateRenderer.render(
      this._instrumentFamily,
      this._instrumentType,
      this._instrumentTone,
      this._stringCount,
      this.tuning,
      !tuningsEqual(this._tuning, this._originalTuning),
      this._tuningChangeMode
    );
  }

  public setType(newType: InstrumentType): void {
    const tones = INSTRUMENT_TONES[newType];
    if (tones === undefined || tones.length === 0) {
      return;
    }

    this._instrumentType = newType;
    this._instrumentTone = tones[0];
    this.render();
  }

  public setTone(newTone: StringInstrumentTone): void {
    this._instrumentTone = newTone;
    this.render();
  }

  public makeInstrument(): Guitar {
    if (!isStringInstrumentType(this._instrumentType)) {
      throw new Error("Unsupported instrument selection");
    }

    const instrument = this._track.context.instrument;
    return new Guitar(
      this._instrumentType,
      this._instrumentTone,
      this._track.name,
      this._stringCount,
      copyTuning(this._tuning).reverse(),
      instrument instanceof Guitar ? instrument.fretsCount : undefined
    );
  }

  public get tuningChangeMode(): TrackInstrumentChangeMode {
    return this._tuningChangeMode;
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

  public setTuningChangeMode(mode: TrackInstrumentChangeMode): void {
    this._tuningChangeMode = mode;
    this.render();
  }

  public get track(): Track {
    return this._track;
  }

  public get instrumentFamily(): InstrumentFamily {
    return this._instrumentFamily;
  }

  public get instrumentType(): InstrumentType {
    return this._instrumentType;
  }

  public get stringCount(): number {
    return this._stringCount;
  }

  /** Tuning as note names, lowest string first, without octaves. */
  public get tuning(): string {
    return getTuningText(this._tuning);
  }
}
