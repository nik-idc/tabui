import { NotationComponent } from "@/notation/notation-component";
import { TupletControlsComponent } from "@/ui/side-controls/note-controls/tuplet-controls";
import { Tab, Guitar } from "@/notation";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { TrackSettingsControlsTemplateRenderer } from "./track-settings-controls-template-renderer";

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

export class TrackSettingsControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Tab;

  readonly template: TrackSettingsControlsTemplate;
  readonly templateRenderer: TrackSettingsControlsTemplateRenderer;

  private _trackName: string;
  private _stringCount: number;
  private _tuning: string;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Tab
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.track = track;

    this.template = new TrackSettingsControlsTemplate();
    this.templateRenderer = new TrackSettingsControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this._trackName = track.name;
    this._stringCount = track.guitar.stringsCount;
    this._tuning = track.guitar.tuning
      .map((n) => n.noteValue)
      .reverse()
      .join(" ");
  }

  public render(): void {
    this.templateRenderer.render(
      this._trackName,
      this._stringCount,
      this._tuning
    );
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
