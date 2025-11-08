import { NoteDuration, TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsComponent, NoteControlsTemplate } from "@/ui";
import {
  TupletControlsCallbacks,
  TupletControlsDefaultCallbacks,
} from "./tuplet-controls-callbacks";

export interface NoteControlsCallbacks {
  onDurationClicked(noteDuration: NoteDuration): void;
  onDotClicked(dots: number): void;
  onTupletNormalClicked(normalCount: number): void;
  onTupletClicked(): void;
  bind(): void;
}

export class NoteControlsDefaultCallbacks implements NoteControlsCallbacks {
  private _noteComponent: NoteControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _tupletCallbacks: TupletControlsCallbacks;

  constructor(
    noteComponent: NoteControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._noteComponent = noteComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._tupletCallbacks = new TupletControlsDefaultCallbacks(
      this._noteComponent.tupletComponent,
      this._notationComponent,
      this._renderFunc
    );
  }

  onDurationClicked(noteDuration: NoteDuration): void {
    this._notationComponent.tabController.changeDuration(noteDuration);
    this._renderFunc();
  }

  onDotClicked(dots: number): void {
    // notationComponent.notationComponent.setSelectedBeatDots(dots);
    this._notationComponent.tabController.setDots(dots);
    this._renderFunc();
  }

  onTupletNormalClicked(normalCount: number): void {
    if (normalCount < 2) {
      throw Error("Tuplet normal count has to be >= 2");
    }
    this._notationComponent.tabController.setSelectedBeatsTuplet(
      normalCount,
      normalCount - 1
    );
    this._renderFunc();
  }

  onTupletClicked(): void {
    this._noteComponent.showTupletControls();
  }

  bind(): void {
    for (const durationButton of this._noteComponent.template
      .noteDurationButtons) {
      const duration = 1 / Number(durationButton.dataset["duration"]);
      durationButton.addEventListener("click", () =>
        this.onDurationClicked(duration)
      );
    }

    this._noteComponent.template.dot1Button.addEventListener("click", () =>
      this.onDotClicked(1)
    );
    this._noteComponent.template.dot2Button.addEventListener("click", () =>
      this.onDotClicked(2)
    );

    this._noteComponent.template.tuplet2Button.addEventListener("click", () =>
      this.onTupletNormalClicked(2)
    );
    this._noteComponent.template.tuplet3Button.addEventListener("click", () =>
      this.onTupletNormalClicked(3)
    );
    this._noteComponent.template.tupletButton.addEventListener("click", () =>
      this.onTupletClicked()
    );

    this._tupletCallbacks.bind();
  }
}
