import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import { createScoreGraph } from "./helpers";

describe("Staff model", () => {
  test("showClassicNotation setter updates the correct property", () => {
    const { staff } = createScoreGraph();

    staff.showClassicNotation = true;

    expect(staff.showClassicNotation).toBe(true);
    expect(staff.showTablature).toBe(true);
  });

  test("removeBar rejects invalid indices", () => {
    const { staff } = createScoreGraph();

    expect(() => staff.removeBar(-1)).toThrow(Error);
    expect(() => staff.removeBar(staff.bars.length)).toThrow(Error);
  });

  test("removeBar throws when removing the last remaining bar", () => {
    const { staff } = createScoreGraph();

    expect(() => staff.removeBar(0)).toThrow(
      "Staff must have at least one bar"
    );
  });

  test("getNextBeat and getPrevBeat traverse across bar boundaries", () => {
    const { score, bar, staff } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const firstVoiceBar = bar.getVoiceBar(1);
    const secondVoiceBar = staff.bars[1].getVoiceBar(1);
    if (firstVoiceBar === null || secondVoiceBar === null) {
      throw Error("Expected voice 1 bars");
    }
    firstVoiceBar.appendBeats();

    const firstBarLastBeat = firstVoiceBar.beats[1];
    const secondBarFirstBeat = secondVoiceBar.beats[0];

    expect(staff.getNextBeat(firstBarLastBeat)).toBe(secondBarFirstBeat);
    expect(staff.getPrevBeat(secondBarFirstBeat)).toBe(firstBarLastBeat);
  });

  test("getBeatsSeq returns flattened beat sequence in bar order", () => {
    const { score, staff, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const firstVoiceBar = bar.getVoiceBar(1);
    const secondVoiceBar = staff.bars[1].getVoiceBar(1);
    if (firstVoiceBar === null || secondVoiceBar === null) {
      throw Error("Expected voice 1 bars");
    }
    firstVoiceBar.appendBeats();

    const beatsSeq = staff.getBeatsSeq();

    expect(beatsSeq).toHaveLength(3);
    expect(beatsSeq[0]).toBe(firstVoiceBar.beats[0]);
    expect(beatsSeq[1]).toBe(firstVoiceBar.beats[1]);
    expect(beatsSeq[2]).toBe(secondVoiceBar.beats[0]);
  });
});
