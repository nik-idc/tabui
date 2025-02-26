import { Chord } from "../../src/models/chord";
import { testData, createBasicTabWindow } from "./../../test-render/test-cases";

describe("Tab window tests", () => {
  test("Tab window select note element test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    const noteElementId = 3;
    basicTabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(0);
    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.tabLineElementId).toBe(tabLineElementId);
    expect(ids.barElementId).toBe(barElementId);
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.stringNum).toBe(noteElementId + 1);
  });

  test("Tab window select chord in between test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 1;
    const barElementId2 = 1;
    const chordElementId2 = 2;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

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

  test("Tab window select chord in between reverse lines test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 1;
    const barElementId1 = 1;
    const chordElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const chordElementId2 = 0;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

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

  test("Tab window select chord in between same line test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const chordElementId2 = 2;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

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

  test("Tab window select chord in between same line reverse bars test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 2;
    const chordElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const chordElementId2 = 0;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

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

  test("Tab window select chord in between same bar test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const chordElementId2 = 2;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(3);
  });

  test("Tab window select chord in between same bar reverse chords test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 2;
    const tabLineElementId2 = 0;
    const barElementId2 = 1;
    const chordElementId2 = 0;
    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 0]);
    expect(basicTabWindow.selectionElements[1].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements[2].ids()).toStrictEqual([0, 1, 2]);
    expect(basicTabWindow.selectionElements.length).toBe(3);
  });

  test("Tab window select end up with only base selection element", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectChord(0, 1, 1);
    basicTabWindow.selectChord(0, 4, 2);
    basicTabWindow.selectChord(0, 1, 3);
    basicTabWindow.selectChord(0, 1, 2);
    basicTabWindow.selectChord(0, 1, 1);

    // Test
    expect(basicTabWindow.selectionElements[0].ids()).toStrictEqual([0, 1, 1]);
    expect(basicTabWindow.selectionElements.length).toBe(1);
  });

  test("Tab window select chord test", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    basicTabWindow.selectChord(tabLineElementId, barElementId, chordElementId);

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(1);
    expect(basicTabWindow.selectionElements[0].barElementId).toBe(1);
    expect(basicTabWindow.selectionElements[0].chordElementId).toBe(0);
    expect(basicTabWindow.selectedElement).toBe(undefined);
  });

  test("Tab window move left with selected to right", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const chordElementId2 = 3;

    const expectedBarElementId = 0;
    const expectedChordElementId = 3;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );
    basicTabWindow.moveSelectedNoteLeft();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.chordElementId).toBe(expectedChordElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move left with selected to left", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const chordElementId2 = 3;

    const expectedBarElementId = 0;
    const expectedChordElementId = 3;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId2,
      chordElementId2
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.moveSelectedNoteLeft();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.chordElementId).toBe(expectedChordElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move right with selected to right", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const chordElementId2 = 3;

    const expectedBarElementId = 3;
    const expectedChordElementId = 0;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId2,
      chordElementId2
    );
    basicTabWindow.moveSelectedNoteRight();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.chordElementId).toBe(expectedChordElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window move right with selected to left", () => {
    const basicTabWindow = createBasicTabWindow();

    const tabLineElementId1 = 0;
    const barElementId1 = 1;
    const chordElementId1 = 0;
    const tabLineElementId2 = 0;
    const barElementId2 = 2;
    const chordElementId2 = 3;

    const expectedBarElementId = 3;
    const expectedChordElementId = 0;
    const expectedNoteElementId = 0; // 0 by default

    basicTabWindow.selectChord(
      tabLineElementId1,
      barElementId2,
      chordElementId2
    );
    basicTabWindow.selectChord(
      tabLineElementId2,
      barElementId1,
      chordElementId1
    );
    basicTabWindow.moveSelectedNoteRight();

    const ids = basicTabWindow.getSelectedNoteElementIds();
    expect(ids.barElementId).toBe(expectedBarElementId);
    expect(ids.chordElementId).toBe(expectedChordElementId);
    expect(ids.stringNum).toBe(expectedNoteElementId + 1);
  });

  test("Tab window insert chords test", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 1, 1);
    basicTabWindow.selectChord(0, 1, 2);

    basicTabWindow.copy();

    basicTabWindow.selectNoteElement(0, 1, 2, 4);
    const prevChordsLength = basicTabWindow.tab.getChordsSeq().length;
    // const prevChordsLength = basicTabWindow.chordElementsSeq.length;
    basicTabWindow.paste();

    // Test
    expect(basicTabWindow.tab.getChordsSeq().length).toBe(prevChordsLength + 3);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[0].chord,
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[3].chord
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[1].chord,
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[4].chord
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[2].chord,
        basicTabWindow.tabLineElements[0].barElements[1].chordElements[5].chord
      )
    ).toBe(true);
  });

  test("Tab window replace chords: selection > copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select chords to copy
    const copiedChords = [
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[0].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[1].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[2].chord,
    ];
    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 1, 2);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select chords to replace
    basicTabWindow.selectChord(1, 1, 0);
    basicTabWindow.selectChord(1, 2, 0);

    // Replace chords
    const prevChords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    const prevChordsLength = prevChords.length;
    basicTabWindow.paste();

    // Pasted chords should be the ones we copied
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[0].chord,
        copiedChords[0]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[1].chord,
        copiedChords[1]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[2].chord,
        copiedChords[2]
      )
    ).toBe(true);
    // Expect total chords count to be 2 less than before
    const chords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    const chordsLength = chords.length;
    expect(chordsLength).toBe(prevChordsLength - 2);
  });

  test("Tab window replace chords: selection === copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select chords to copy
    const copiedChords = [
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[0].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[1].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[2].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[3].chord,
    ];
    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 1, 3);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select chords to replace
    basicTabWindow.selectChord(1, 1, 0);
    basicTabWindow.selectChord(1, 1, 3);

    // Replace chords
    const prevChords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    basicTabWindow.paste();

    // Pasted chords should be the ones we copied
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[0].chord,
        copiedChords[0]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[1].chord,
        copiedChords[1]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[2].chord,
        copiedChords[2]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[3].chord,
        copiedChords[3]
      )
    ).toBe(true);
    // Expect total chords count to be 1 less than before
    const chords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    expect(chords.length).toBe(prevChords.length);
  });

  test("Tab window replace chords: selection < copied", () => {
    const basicTabWindow = createBasicTabWindow();

    // Select chords to copy
    const copiedChords = [
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[0].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[1].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[2].chord,
      basicTabWindow.tabLineElements[0].barElements[1].chordElements[3].chord,
    ];
    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 1, 3);
    // Copy
    basicTabWindow.copy();
    // Select to reset current selection
    basicTabWindow.selectNoteElement(0, 1, 1, 1);
    // Select chords to replace
    basicTabWindow.selectChord(1, 1, 0);
    basicTabWindow.selectChord(1, 1, 2);

    // Replace chords
    const prevChords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    const prevChordsLength = prevChords.length;
    basicTabWindow.paste();

    // Pasted chords should be the ones we copied
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[0].chord,
        copiedChords[0]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[1].chord,
        copiedChords[1]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[2].chord,
        copiedChords[2]
      )
    ).toBe(true);
    expect(
      Chord.compare(
        basicTabWindow.tabLineElements[1].barElements[1].chordElements[3].chord,
        copiedChords[3]
      )
    ).toBe(true);
    // Since inserted 4 chords when selected 3 length should now be 5
    expect(
      basicTabWindow.tabLineElements[1].barElements[1].chordElements.length
    ).toBe(5);
    // Since inserted more bar duration should not fit
    expect(
      basicTabWindow.tabLineElements[1].barElements[1].durationsFit()
    ).toBe(false);
    // Expect total chords count to be 1 less than before
    const chords = basicTabWindow.tab.bars.flatMap((bar) => {
      return bar.chords;
    });
    const chordsLength = chords.length;
    expect(chordsLength).toBe(prevChordsLength + 1);
  });

  test("Tab window delete chords test", () => {
    const basicTabWindow = createBasicTabWindow();

    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 2, 1);

    basicTabWindow.deleteChords();

    // Test
    // length is 1 because when all chords of a bar are deleted we add an empty
    // chord so that it's not actually empty
    expect(
      basicTabWindow.tabLineElements[0].barElements[1].chordElements.length
    ).toBe(1);
    expect(
      basicTabWindow.tabLineElements[0].barElements[2].chordElements.length
    ).toBe(2);
  });
});
