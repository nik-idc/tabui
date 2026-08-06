import { NotationComponent } from "../../../../../notation/notation-component";
import {
  ElectricGuitarTone,
  Guitar,
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  isStringInstrumentType,
  parseTuningStrSimple,
  shiftTuningWhole,
  shiftTuningString,
  StringInstrumentTone,
  StringInstrumentType,
  Track,
  TrackInstrumentChangeMode,
} from "../../../../../notation";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { TrackSettingsControlsTemplateRenderer } from "./track-settings-controls-template-renderer";

export class TrackSettingsControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  private _track: Track;

  readonly template: TrackSettingsControlsTemplate;
  readonly templateRenderer: TrackSettingsControlsTemplateRenderer;

  private _instrumentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _instrumentType: InstrumentType;
  private _instrumentTone: StringInstrumentTone;
  private _stringCount: number;
  private _originalTuning: string;
  private _tuning: string;
  private _tuningChangeMode: TrackInstrumentChangeMode =
    TrackInstrumentChangeMode.KeepFrets;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Track
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this._track = track;

    this.template = new TrackSettingsControlsTemplate();
    this.templateRenderer = new TrackSettingsControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this._instrumentType = StringInstrumentType.ElectricGuitar;
    this._instrumentTone = ElectricGuitarTone.Clean;
    this._stringCount = 6;
    this._originalTuning = "E A D G B E";
    this._tuning = "E A D G B E";
    this.setTrack(track);
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
    this._originalTuning = track.context.instrument.getTuningStrSimple();
    this._tuning = this._originalTuning;
    this._tuningChangeMode = TrackInstrumentChangeMode.KeepFrets;
  }

  public render(): void {
    this.templateRenderer.render(
      this._instrumentFamily,
      this._instrumentType,
      this._instrumentTone,
      this._stringCount,
      this._tuning,
      this._originalTuning,
      this._tuningChangeMode
    );
  }

  public setFamily(newFamily: InstrumentFamily): void {
    const types = INSTRUMENT_TYPES[newFamily];
    if (types.length === 0) {
      return;
    }

    this._instrumentFamily = newFamily;
    this._instrumentType = types[0];
    const tones = INSTRUMENT_TONES[this._instrumentType];
    if (tones === undefined || tones.length === 0) {
      return;
    }
    this._instrumentTone = tones[0];
    this.render();
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

    const tuning = parseTuningStrSimple(this._tuning);
    return new Guitar(
      this._instrumentType,
      this._instrumentTone,
      this._track.name,
      this._stringCount,
      tuning
    );
  }

  public get tuningChangeMode(): TrackInstrumentChangeMode {
    return this._tuningChangeMode;
  }

  public setTuning(tuning: string): void {
    this._tuning = tuning;
  }

  public shiftTuningString(stringIndex: number, semitones: number): void {
    this._tuning = shiftTuningString(this._tuning, stringIndex, semitones);
    this.render();
  }

  public shiftWholeTuning(semitones: number): void {
    this._tuning = shiftTuningWhole(this._tuning, semitones);
    this.render();
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

  public get tuning(): string {
    return this._tuning;
  }
}
