import { NotationComponent } from "@/notation/notation-component";
import { NewTrackControlsTemplate } from "./new-track-controls-template";
import { NewTrackControlsTemplateRenderer } from "./new-track-controls-template-renderer";
import {
  AcousticGuitarPreset,
  BassGuitarPreset,
  Guitar,
  OtherStringPreset,
  parseTuning,
  StringMusicInstrumentPreset,
  StringMusicInstrumentType,
  Track,
  ElectricGuitarPreset,
} from "@/notation/model";

export const INSTRUMENT_KINDS: Record<string, Record<string, string[]>> = {
  Strings: {
    Acoustic: ["Steel", "Nylon"],
    Electric: ["Clean", "Overdrive", "Distortion"],
    Bass: ["Acoustic", "Clean", "Distortion"],
    Other: ["Ukulele", "Banjo"],
  },
  Orchestra: {},
  Drums: {},
};

const UI_TYPE_TO_STRING_INSTRUMENT_TYPE: Record<
  string,
  StringMusicInstrumentType
> = {
  Acoustic: StringMusicInstrumentType.AcousticGuitar,
  Electric: StringMusicInstrumentType.ElectricGuitar,
  Bass: StringMusicInstrumentType.BassGuitar,
  Other: StringMusicInstrumentType.Other,
};

const UI_PRESET_TO_STRING_INSTRUMENT_PRESET: Record<
  StringMusicInstrumentType,
  Record<string, StringMusicInstrumentPreset>
> = {
  [StringMusicInstrumentType.AcousticGuitar]: {
    Steel: AcousticGuitarPreset.Steel,
    Nylon: AcousticGuitarPreset.Nylon,
  },
  [StringMusicInstrumentType.ElectricGuitar]: {
    Clean: ElectricGuitarPreset.Clean,
    Overdrive: ElectricGuitarPreset.Overdrive,
    Distortion: ElectricGuitarPreset.Distortion,
  },
  [StringMusicInstrumentType.BassGuitar]: {
    Acoustic: BassGuitarPreset.Acoustic,
    Clean: BassGuitarPreset.Clean,
    Distortion: BassGuitarPreset.Distortion,
  },
  [StringMusicInstrumentType.Other]: {
    Ukulele: OtherStringPreset.Ukulele,
    Banjo: OtherStringPreset.Banjo,
  },
};

export class NewTrackControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NewTrackControlsTemplate;
  readonly templateRenderer: NewTrackControlsTemplateRenderer;

  private _instrumentKind: string = Object.keys(INSTRUMENT_KINDS)[0];
  private _instrumentType: string = Object.keys(
    INSTRUMENT_KINDS[this._instrumentKind]
  )[0];
  private _instrumentPreset: string =
    INSTRUMENT_KINDS[this._instrumentKind][this._instrumentType][0];
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
      this._instrumentKind,
      this._instrumentType,
      this._instrumentPreset,
      this._trackName,
      this._stringCount,
      this._tuning
    );
  }

  public setKind(newKind: string): void {
    this._instrumentKind = newKind;
    this.render();
  }

  public getAllKinds(): string[] {
    return Object.keys(INSTRUMENT_KINDS);
  }

  public setType(newType: string): void {
    this._instrumentType = newType;
    this.render();
  }

  public getAllTypes(): string[] {
    return Object.keys(INSTRUMENT_KINDS[this._instrumentKind]);
  }

  public setPreset(newPreset: string): void {
    this._instrumentPreset = newPreset;
    this.render();
  }

  public getAllPresets(): string[] {
    return INSTRUMENT_KINDS[this._instrumentKind][this._instrumentType];
  }

  public setTrackName(trackName: string): void {
    this._trackName = trackName;
  }

  public setStringCount(stringCount: number): void {
    this._stringCount = stringCount;
  }

  public setTuning(tuning: string): void {
    this._tuning = tuning;
  }

  public makeTrack(): Track {
    const instrumentType =
      UI_TYPE_TO_STRING_INSTRUMENT_TYPE[this._instrumentType];
    const preset =
      UI_PRESET_TO_STRING_INSTRUMENT_PRESET[instrumentType]?.[
        this._instrumentPreset
      ];
    if (instrumentType === undefined || preset === undefined) {
      throw new Error("Unsupported instrument selection");
    }

    const instrument = new Guitar(
      instrumentType,
      preset,
      this._trackName,
      this._stringCount,
      parseTuning(this._tuning)
    );

    const output = this.notationComponent.score.addTrack(
      instrument,
      this._trackName
    );
    return output.tracks[0];
  }

  public get instrumentKind(): string {
    return this._instrumentKind;
  }

  public get instrumentType(): string {
    return this._instrumentType;
  }

  public get instrumentPreset(): string {
    return this._instrumentPreset;
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
