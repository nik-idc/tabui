import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

describe("TrackElement tree", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("builds the expected hierarchy for a single default bar", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    expect(trackElement.trackLineElements).toHaveLength(1);

    const line = trackElement.trackLineElements[0];
    expect(line.staffLineElements).toHaveLength(1);

    const staffLine = line.staffLineElements[0];
    expect(staffLine.styleLinesAsArray).toHaveLength(1);

    const styleLine = staffLine.styleLinesAsArray[0];
    expect(styleLine.barElements).toHaveLength(1);
    expect(styleLine.barElements[0].beatElements).toHaveLength(1);
    expect(styleLine.barElements[0].beatElements[0]).toBeInstanceOf(
      TabBeatElement
    );
  });

  test("registry lookup returns the beat element by beat UUID", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();

    const beat = bar.beats[0];
    const beatElement = trackElement.getBeatElementByUUID(beat.uuid);
    expect(beatElement).toBeDefined();
    expect(beatElement?.beat.uuid).toBe(beat.uuid);
  });

  test("element diff reports beat additions and removals", () => {
    const { track, bar } = createScoreGraph();
    const trackElement = new TrackElement(track);

    trackElement.update();
    trackElement.clearElementDiff();

    const addedBeat = bar.appendBeats().beats[0];
    trackElement.update();

    const addDiff = trackElement.getElementDiff();
    expect(addDiff.added.get(TabBeatElement)?.has(addedBeat.uuid)).toBe(true);

    trackElement.clearElementDiff();
    bar.removeBeat(1);
    trackElement.update();

    const removeDiff = trackElement.getElementDiff();
    expect(removeDiff.removed.get(TabBeatElement)?.has(addedBeat.uuid)).toBe(
      true
    );
  });

  test("wraps whole bars onto next track line and keeps line navigation/selection consistent", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
    trackElement.update();

    const lines = trackElement.trackLineElements;
    expect(lines.length).toBeGreaterThan(1);

    const firstLine = lines[0];
    const secondLine = lines[1];
    expect(trackElement.getPrevTrackLineElement(firstLine)).toBeNull();
    expect(trackElement.getNextTrackLineElement(firstLine)).toBe(secondLine);
    expect(trackElement.getPrevTrackLineElement(secondLine)).toBe(firstLine);
    expect(secondLine.boundingBox.y).toBeCloseTo(firstLine.boundingBox.bottom);

    const secondLineStyle =
      secondLine.staffLineElements[0].styleLinesAsArray[0];
    expect(secondLineStyle.barElements[0].boundingBox.x).toBeCloseTo(0);

    const firstLineStyle = firstLine.staffLineElements[0].styleLinesAsArray[0];
    expect(
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeCloseTo(EditorLayoutDimensions.WIDTH);
    expect(
      secondLineStyle.barElements[secondLineStyle.barElements.length - 1]
        .boundingBox.right
    ).toBeLessThanOrEqual(EditorLayoutDimensions.WIDTH);

    for (const line of lines) {
      const styleLine = line.staffLineElements[0].styleLinesAsArray[0];
      expect(styleLine.barElements).toHaveLength(line.trackLineData.length);
      expect(styleLine.barElements[0].boundingBox.x).toBeCloseTo(0);

      for (let i = 0; i < line.trackLineData.length; i++) {
        const masterBarIndex = line.trackLineData[i].masterBarIndex;
        expect(styleLine.barElements[i].bar).toBe(
          track.staves[0].bars[masterBarIndex]
        );

        if (i > 0) {
          expect(styleLine.barElements[i].boundingBox.x).toBeCloseTo(
            styleLine.barElements[i - 1].boundingBox.right
          );
        }
      }
    }

    const firstLineBeat =
      track.staves[0].bars[firstLine.trackLineData[0].masterBarIndex].beats[0];
    const secondLineBeat =
      track.staves[0].bars[secondLine.trackLineData[0].masterBarIndex].beats[0];
    const selectionRects = trackElement.getSelectionRects([
      firstLineBeat,
      secondLineBeat,
    ]);
    const firstLineBeatElement = trackElement.getBeatElementByUUID(
      firstLineBeat.uuid
    );
    const secondLineBeatElement = trackElement.getBeatElementByUUID(
      secondLineBeat.uuid
    );

    expect(firstLineBeatElement).toBeDefined();
    expect(secondLineBeatElement).toBeDefined();
    expect(selectionRects).toHaveLength(2);
    expect(selectionRects[0].width).toBeGreaterThan(0);
    expect(selectionRects[1].width).toBeGreaterThan(0);
    expect(selectionRects[1].y).toBeGreaterThan(selectionRects[0].y);
    expect(selectionRects[0].x).toBeCloseTo(
      trackElement.getBeatElementGlobalCoords(firstLineBeatElement!).x
    );
    expect(selectionRects[1].x).toBeCloseTo(
      trackElement.getBeatElementGlobalCoords(secondLineBeatElement!).x
    );
  });
});
