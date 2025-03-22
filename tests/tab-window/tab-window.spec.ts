import { Beat } from "../../src/models/beat";
import { testData, createBasicTabWindow } from "./../../test-render/test-cases";

describe("Tab window tests", () => {
  test("Tab window select note element test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId = 0;
    const barElementId = 1;
    const beatElementId = 0;
    const noteElementId = 3;
    basicTabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      beatElementId,
      noteElementId
    );

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(0);
    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.tabLineElementId).toBe(tabLineElementId);
    expect(ids.barElementId).toBe(barElementId);
    expect(ids.beatElementId).toBe(beatElementId);
    expect(ids.stringNum).toBe(noteElementId + 1);
  });

  test("Tab window select beat in between test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 1;
    const barElementId2 = 1;
    const beatElementId2 = 2;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements[3].ids()).toStrictEqual([0, 1, 3]);
    expect(basicTabWindow.selectionElements[4].ids()).toStrictEqual([0, 2, 0]);
    expect(basicTabWindow.selectionElements[5].ids()).toStrictEqual([0, 2, 1]);
    expect(basicTabWindow.selectionElements[6].ids()).toStrictEqual([0, 2, 2]);
    expect(basicTabWindow.selectionElements[7].ids()).toStrictEqual([0, 2, 3]);
    expect(basicTabWindow.selectionElements[8].ids()).toStrictEqual([0, 3, 0]);
    expect(basicTabWindow.selectionElements[9].ids()).toStrictEqual([0, 3, 1]);
    expect(basicTabWindow.selectionElements[10].ids()).toStrictEqual([0, 3, 2]);
    expect(basicTabWindow.selectionElements[11].ids()).toStrictEqual([0, 3, 3]);
    expect(basicTabWindow.selectionElements[12].ids()).toStrictEqual([0, 4, 0]);
    expect(basicTabWindow.selectionElements[13].ids()).toStrictEqual([0, 4, 1]);
    expect(basicTabWindow.selectionElements[14].ids()).toStrictEqual([0, 4, 2]);
    expect(basicTabWindow.selectionElements[15].ids()).toStrictEqual([0, 4, 3]);
    expect(basicTabWindow.selectionElements[16].ids()).toStrictEqual([1, 0, 0]);
    expect(basicTabWindow.selectionElements[17].ids()).toStrictEqual([1, 0, 1]);
    expect(basicTabWindow.selectionElements[18].ids()).toStrictEqual([1, 0, 2]);
    expect(basicTabWindow.selectionElements[19].ids()).toStrictEqual([1, 0, 3]);
    expect(basicTabWindow.selectionElements[20].ids()).toStrictEqual([1, 1, 0]);
    expect(basicTabWindow.selectionElements[21].ids()).toStrictEqual([1, 1, 1]);
    expect(basicTabWindow.selectionElements[22].ids()).toStrictEqual([1, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(23);
  });

  test("Tab window select beat in between reverse lines test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 1;
    const barElementId1 = 1;
    const beatElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const beatElementId2 = 0;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements[3].ids()).toStrictEqual([0, 1, 3]);
    expect(basicTabWindow.selectionElements[4].ids()).toStrictEqual([0, 2, 0]);
    expect(basicTabWindow.selectionElements[5].ids()).toStrictEqual([0, 2, 1]);
    expect(basicTabWindow.selectionElements[6].ids()).toStrictEqual([0, 2, 2]);
    expect(basicTabWindow.selectionElements[7].ids()).toStrictEqual([0, 2, 3]);
    expect(basicTabWindow.selectionElements[8].ids()).toStrictEqual([0, 3, 0]);
    expect(basicTabWindow.selectionElements[9].ids()).toStrictEqual([0, 3, 1]);
    expect(basicTabWindow.selectionElements[10].ids()).toStrictEqual([0, 3, 2]);
    expect(basicTabWindow.selectionElements[11].ids()).toStrictEqual([0, 3, 3]);
    expect(basicTabWindow.selectionElements[12].ids()).toStrictEqual([0, 4, 0]);
    expect(basicTabWindow.selectionElements[13].ids()).toStrictEqual([0, 4, 1]);
    expect(basicTabWindow.selectionElements[14].ids()).toStrictEqual([0, 4, 2]);
    expect(basicTabWindow.selectionElements[15].ids()).toStrictEqual([0, 4, 3]);
    expect(basicTabWindow.selectionElements[16].ids()).toStrictEqual([1, 0, 0]);
    expect(basicTabWindow.selectionElements[17].ids()).toStrictEqual([1, 0, 1]);
    expect(basicTabWindow.selectionElements[18].ids()).toStrictEqual([1, 0, 2]);
    expect(basicTabWindow.selectionElements[19].ids()).toStrictEqual([1, 0, 3]);
    expect(basicTabWindow.selectionElements[20].ids()).toStrictEqual([1, 1, 0]);
    expect(basicTabWindow.selectionElements[21].ids()).toStrictEqual([1, 1, 1]);
    expect(basicTabWindow.selectionElements[22].ids()).toStrictEqual([1, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(23);
  });

  test("Tab window select beat in between same line test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const beatElementId2 = 2;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements[3].ids()).toStrictEqual([0, 1, 3]);
    expect(basicTabWindow.selectionElements[4].ids()).toStrictEqual([0, 2, 0]);
    expect(basicTabWindow.selectionElements[5].ids()).toStrictEqual([0, 2, 1]);
    expect(basicTabWindow.selectionElements[6].ids()).toStrictEqual([0, 2, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(7);
  });

  test("Tab window select beat in between same line reverse bars test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 2;
    const beatElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const beatElementId2 = 0;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements[3].ids()).toStrictEqual([0, 1, 3]);
    expect(basicTabWindow.selectionElements[4].ids()).toStrictEqual([0, 2, 0]);
    expect(basicTabWindow.selectionElements[5].ids()).toStrictEqual([0, 2, 1]);
    expect(basicTabWindow.selectionElements[6].ids()).toStrictEqual([0, 2, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(7);
  });

  test("Tab window select beat in between same bar test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const beatElementId2 = 2;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(3);
  });

  test("Tab window select beat in between same bar reverse beats test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const beatElementId2 = 0;
    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(3);
  });

  test("Tab window select end up with only base selection element", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectBeat(0, 1, 1);
    basicTabWindow.selectBeat(0, 4, 2);
    basicTabWindow.selectBeat(0, 1, 3);
    basicTabWindow.selectBeat(0, 1, 2);
    basicTabWindow.selectBeat(0, 1, 1);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements.length).toBe(1);
  });

  test("Tab window select beat test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId = 0;
    const barElementId = 1;
    const beatElementId = 0;
    basicTabWindow.selectBeat(tabLineElementId, barElementId, beatElementId);

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(1);
    expect(basicTabWindow.selectionElements[0].barElementId).toBe(1);
    expect(basicTabWindow.selectionElements[0].beatElementId).toBe(0);
    expect(basicTabWindow.selectedElement).toBe(undefined);
  });

  test("Tab window move left with selected to right", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const beatElementId2 = 3;

    const expectedBarElementId = 0;
    const expectedBeatElementId = 3;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);
    basicTabWindow.moveSelectedNoteLeft();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.beatElementId).toBe(expectedBeatElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move left with selected to left", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const beatElementId2 = 3;

    const expectedBarElementId = 0;
    const expectedBeatElementId = 3;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectBeat(tabLineElementId1, barElementId2, beatElementId2);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId1, beatElementId1);
    basicTabWindow.moveSelectedNoteLeft();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.beatElementId).toBe(expectedBeatElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move right with selected to right", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const beatElementId2 = 3;

    const expectedBarElementId = 3;
    const expectedBeatElementId = 0;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectBeat(tabLineElementId1, barElementId1, beatElementId1);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId2, beatElementId2);
    basicTabWindow.moveSelectedNoteRight();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.beatElementId).toBe(expectedBeatElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move right with selected to left", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const beatElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const beatElementId2 = 3;

    const expectedBarElementId = 3;
    const expectedBeatElementId = 0;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectBeat(tabLineElementId1, barElementId2, beatElementId2);
    basicTabWindow.selectBeat(tabLineElementId2, barElementId1, beatElementId1);
    basicTabWindow.moveSelectedNoteRight();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.beatElementId).toBe(expectedBeatElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window insert beats test", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectBeat(0, 1, 0);
    basicTabWindow.selectBeat(0, 1, 1);
    basicTabWindow.selectBeat(0, 1, 2);

    basicTabWindow.copy();

    basicTabWindow.selectNoteElement(0, 1, 2, 4);
    const prevBeatsLength = basicTabWindow.tab.getBeatsSeq().length;
    // const prevBeatsLength = basicTabWindow.beatElementsSeq.length;
    basicTabWindow.paste();

    // Test
    expect(basicTabWindow.tab.getBeatsSeq().length).toBe(prevBeatsLength + 3);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[0].beat,
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[3].beat
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[1].beat,
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[4].beat
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[2].beat,
        basicTabWindow.tabLineElements[0].barElements[1].beatElements[5].beat
      )
    ).toBe(true);
  });

  test("Tab window replace beats: selection > copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select beats to copy
    const copiedBeats = [
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[0].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[1].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[2].beat,
    ];
    basicTabWindow.selectBeat(0, 1, 0);
    basicTabWindow.selectBeat(0, 1, 2);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select beats to replace
    basicTabWindow.selectBeat(1, 1, 0);
    basicTabWindow.selectBeat(1, 2, 0);

    // Replace beats
    const prevBeats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    const prevBeatsLength = prevBeats.length;
    basicTabWindow.paste();

    // Pasted beats should be the ones we copied
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[0].beat,
        copiedBeats[0]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[1].beat,
        copiedBeats[1]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[2].beat,
        copiedBeats[2]
      )
    ).toBe(true);
    // Expect total beats count to be 2 less than before
    const beats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    const beatsLength = beats.length;
    expect(beatsLength).toBe(prevBeatsLength - 2);
  });

  test("Tab window replace beats: selection === copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select beats to copy
    const copiedBeats = [
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[0].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[1].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[2].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[3].beat,
    ];
    basicTabWindow.selectBeat(0, 1, 0);
    basicTabWindow.selectBeat(0, 1, 3);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select beats to replace
    basicTabWindow.selectBeat(1, 1, 0);
    basicTabWindow.selectBeat(1, 1, 3);

    // Replace beats
    const prevBeats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    basicTabWindow.paste();

    // Pasted beats should be the ones we copied
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[0].beat,
        copiedBeats[0]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[1].beat,
        copiedBeats[1]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[2].beat,
        copiedBeats[2]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[3].beat,
        copiedBeats[3]
      )
    ).toBe(true);
    // Expect total beats count to be 1 less than before
    const beats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    expect(beats.length).toBe(prevBeats.length);
  });

  test("Tab window replace beats: selection < copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select beats to copy
    const copiedBeats = [
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[0].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[1].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[2].beat,
      basicTabWindow.tabLineElements[0].barElements[1].beatElements[3].beat,
    ];
    basicTabWindow.selectBeat(0, 1, 0);
    basicTabWindow.selectBeat(0, 1, 3);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select beats to replace
    basicTabWindow.selectBeat(1, 1, 0);
    basicTabWindow.selectBeat(1, 1, 2);

    // Replace beats
    const prevBeats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    const prevBeatsLength = prevBeats.length;
    basicTabWindow.paste();

    // Pasted beats should be the ones we copied
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[0].beat,
        copiedBeats[0]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[1].beat,
        copiedBeats[1]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[2].beat,
        copiedBeats[2]
      )
    ).toBe(true);
    expect(
      Beat.compare(
        basicTabWindow.tabLineElements[1].barElements[1].beatElements[3].beat,
        copiedBeats[3]
      )
    ).toBe(true);
    // Since inserted 4 beats when selected 3 length should now be 5
    expect(
      basicTabWindow.tabLineElements[1].barElements[1].beatElements.length
    ).toBe(5);
    // Since inserted more bar duration should not fit
    expect(
      basicTabWindow.tabLineElements[1].barElements[1].durationsFit()
    ).toBe(false);
    // Expect total beats count to be 1 less than before
    const beats = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.beats;
    });
    const beatsLength = beats.length;
    expect(beatsLength).toBe(prevBeatsLength + 1);
  });

  test("Tab window delete beats test", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectBeat(0, 1, 0);
    basicTabWindow.selectBeat(0, 2, 1);

    basicTabWindow.deleteBeats();

    // Test
    // length is 1 because when all beats of a bar are deleted we add an empty
    // beat so that it's not actually empty
    expect(
      basicTabWindow.tabLineElements[0].barElements[1].beatElements.length
    ).toBe(1);
    expect(
      basicTabWindow.tabLineElements[0].barElements[2].beatElements.length
    ).toBe(2);
  });
});
