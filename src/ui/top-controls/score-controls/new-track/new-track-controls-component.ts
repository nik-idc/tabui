import { NotationComponent } from "@/notation/notation-component";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { NewTrackControlsTemplateRenderer } from "./new-track-controls-template-renderer";
import {
  Guitar,
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  isStringInstrumentType,
  parseTuningStrSimple,
  shiftTuningString,
  shiftTuningWhole,
  StringInstrumentTone,
  StringInstrumentType,
  Track,
  ElectricGuitarTone,
  getDefaultTuningStrSimple,
} from "@/notation/model";

export class NewTrackControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NewTrackControlsTemplate;
  readonly templateRenderer: NewTrackControlsTemplateRenderer;

  private _instrumentFamily: InstrumentFamily = InstrumentFamily.Strings;
  private _instrumentType: InstrumentType = StringInstrumentType.ElectricGuitar;
  private _instrumentTone: StringInstrumentTone = ElectricGuitarTone.Clean;
  private _trackName: string = "New track";
  private _stringCount: number = 6;
  private _tuning: string = "E A D G B E";

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new NewTrackControlsTemplate();
    this.templateRenderer = new NewTrackControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render(
      this._instrumentFamily,
      this._instrumentType,
      this._instrumentTone,
      this._trackName,
      this._stringCount,
      this._tuning
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

  public setTrackName(trackName: string): void {
    this._trackName = trackName;
  }

  public setStringCount(stringCount: number): void {
    this._stringCount = stringCount;
    const defaultTuning = getDefaultTuningStrSimple(stringCount);
    if (defaultTuning !== null) {
      this._tuning = defaultTuning;
      this.render();
    }
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

  public makeTrack(): Track {
    if (!isStringInstrumentType(this._instrumentType)) {
      throw new Error("Unsupported instrument selection");
    }

    const instrument = new Guitar(
      this._instrumentType,
      this._instrumentTone,
      this._trackName,
      this._stringCount,
      parseTuningStrSimple(this._tuning)
    );

    const output = this.notationComponent.score.addTrack(
      instrument,
      this._trackName
    );
    return output.tracks[0];
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

  public get tuning(): string {
    return this._tuning;
  }
}
