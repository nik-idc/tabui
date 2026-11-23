import { DEFAULT_MASTER_BAR } from "../../../src/notation/model";
import { required } from "../required";
import { createScoreGraph } from "./helpers";

describe("Staff model", () => {
  test("showClassicNotation setter updates the correct property", () => {
    const { staff } = createScoreGraph();

    staff.showClassicNotation = true;

    expect(staff.showClassicNotation).toBe(true);
    expect(staff.showTablature).toBe(true);
  });

  test("removeBar rejects invalid indices", () => {
    const { score, staff } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const [first, second] = staff.bars;

    expect(() => staff.removeBar(-1)).toThrow(Error);
    expect(staff.bars).toEqual([first, second]);
    expect(() => staff.removeBar(staff.bars.length)).toThrow(Error);
    expect(staff.bars).toEqual([first, second]);
  });

  test("removeBar throws when removing the last remaining bar", () => {
    const { staff } = createScoreGraph();
    const bar = staff.bars[0];

    expect(() => staff.removeBar(0)).toThrow(Error);
    expect(staff.bars).toEqual([bar]);
  });

  test("beat and note traversal stops at empty adjacent voices", () => {
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

    firstBarLastBeat.makeBeatWithNotes();
    secondBarFirstBeat.makeBeatWithNotes();
    const firstNote = required(firstBarLastBeat.notes?.[0]);
    const secondNote = required(secondBarFirstBeat.notes?.[0]);
    // A different voice keeps each bar usable when voice 1 is cleared.
    staff.bars[1].insertVoiceBar(2);
    secondVoiceBar.replaceBeats([]);
    expect(staff.getNextBeat(firstBarLastBeat)).toBeNull();
    expect(staff.getNextNote(firstNote)).toBeNull();

    secondVoiceBar.replaceBeats([secondBarFirstBeat]);
    bar.insertVoiceBar(2);
    firstVoiceBar.replaceBeats([]);
    expect(staff.getPrevBeat(secondBarFirstBeat)).toBeNull();
    expect(staff.getPrevNote(secondNote)).toBeNull();
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
