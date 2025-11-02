import { NoteDuration } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";

export interface NoteControlsEventHandler {
  onDurationClicked(
    noteDuration: NoteDuration,
    notationComponent: NotationComponent
  ): void;
  onDotClicked(dots: number, notationComponent: NotationComponent): void;
  onTupletNormalClicked(normalCount: number, notationComponent: NotationComponent): void;
  onTupletClicked(notationComponent: NotationComponent): void;
}

export class NoteControlsDefaultEventHandler
  implements NoteControlsEventHandler
{
  onDurationClicked(
    noteDuration: NoteDuration,
    notationComponent: NotationComponent
  ): void {
    // notationComponent.tabController.changeSelectedBeatDuration(noteDuration);
    // notationComponent.tabController.changeSelectionDuration(noteDuration);
    notationComponent.tabController.changeDuration(noteDuration);
    notationComponent.renderAndBind();
  }

  onDotClicked(dots: number, notationComponent: NotationComponent): void {
    // notationComponent.tabController.setSelectedBeatDots(dots);
    notationComponent.tabController.setDots(dots);
    notationComponent.renderAndBind();
  }

  onTupletNormalClicked(normalCount: number, notationComponent: NotationComponent): void {
    if (normalCount < 2) {
      throw Error("Tuplet normal count has to be >= 2");
    }
    notationComponent.tabController.setSelectedBeatsTuplet(
      normalCount,
      normalCount - 1
    );
    notationComponent.renderAndBind();
  }

  onTupletClicked(notationComponent: NotationComponent): void {
    throw new Error("Method not implemented.");
  }
}
