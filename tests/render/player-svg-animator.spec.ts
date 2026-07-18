import { renderPlayerCursor } from "../../src/notation/render/svg/player-svg-animator";
import { TrackController } from "../../src/notation/controller/track-controller";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";

describe("renderPlayerCursor", () => {
  test("places tab beat cursor at the beat attack column", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const beat = track.staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected beat");
    }
    const beatElement = controller.trackElement.getBeatElement(beat);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const attrs = new Map<string, string>();
    const cursorElement = {
      setAttribute: (name: string, value: string) => {
        attrs.set(name, value);
      },
      getAttribute: (name: string) => attrs.get(name) ?? null,
    } as unknown as SVGRectElement;

    renderPlayerCursor(cursorElement, beatElement);

    const cursorWidth = Number(cursorElement.getAttribute("width"));
    const cursorCenterX =
      Number(cursorElement.getAttribute("x")) + cursorWidth / 2;
    expect(cursorCenterX).toBeCloseTo(
      beatElement.barElement.globalCoords.x +
        beatElement.barLocalCoords.x +
        beatElement.attackLocalX
    );
  });
});
