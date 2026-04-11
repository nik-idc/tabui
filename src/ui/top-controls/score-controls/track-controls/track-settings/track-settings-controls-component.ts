import { NotationComponent } from "@/notation/notation-component";
import { Track, Guitar } from "@/notation";
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
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Track;

  readonly template: TrackSettingsControlsTemplate;
  readonly templateRenderer: TrackSettingsControlsTemplateRenderer;

  private _trackName: string;
  private _stringCount: number;
  private _tuning: string;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Track
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.track = track;

    this.template = new TrackSettingsControlsTemplate();
    this.templateRenderer = new TrackSettingsControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this._trackName = track.name;
    this._stringCount = (track.context.instrument as Guitar).stringsCount;
    this._tuning = (track.context.instrument as Guitar).tuning
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
