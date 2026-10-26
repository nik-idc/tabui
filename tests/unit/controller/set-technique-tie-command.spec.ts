import {
  Beat,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  serializeScore,
  ScoreEditor,
} from "../../../src/notation/model";
import { SetFretCommand } from "../../../src/notation/controller/editor/command/set-fret-command";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command/set-technique-command";
import { SetRestCommand } from "../../../src/notation/controller/editor/command/set-rest-command";
import { CommandManager } from "../../../src/notation/controller/editor/command/command-manager";
import { createBarWithBeats } from "../model/helpers";

function noteAt(beat: Beat, index = 0): GuitarNote {
  const note = beat.notes?.[index];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note");
  }
  return note;
}

function tieCommand(
  beats: Beat[],
  stringNumber?: number,
  searchToEarliest = false
): SetTechniqueCommand {
  return new SetTechniqueCommand(
    beats.map((b) =>
      stringNumber === undefined
        ? ScoreEditor.getBeatPosition(b)
        : { ...ScoreEditor.getBeatPosition(b), stringNumber }
    ),
    GuitarTechniqueType.Tie,
    { tieToEarliest: searchToEarliest }
  );
}

function setup() {
  const graph = createBarWithBeats(
    Array.from({ length: 4 }, () => ({ baseDuration: NoteDuration.Quarter }))
  );
  const notes = graph.beats.map((b) => noteAt(b));
  notes.forEach((n, i) => {
    n.setFret(i === 0 ? 5 : 9);
  });
  return { ...graph, notes };
}

describe("Tie editing", () => {
  test("ties only the previous beat by default and restores the edit through history", () => {
    const { beats, score } = setup();
    for (const [index, fret] of [5, 5, 9, 9].entries()) {
      noteAt(beats[index]).setFret(fret);
    }
    const before = serializeScore(score);
    const command = tieCommand([beats[2]], 1);
    command.execute();
    expect(beats.map((b) => noteAt(b).isTieContinuation)).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(noteAt(beats[2]).fret).toBe(5);
    const after = serializeScore(score);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    command.redo();
    expect(serializeScore(score)).toEqual(after);
  });

  test.each([
    { scope: "whole beat", stringNumber: undefined, expected: [5, 7, null] },
    { scope: "single string", stringNumber: 2, expected: [null, 7, 12] },
  ])(
    "ties a $scope when source and target strings differ",
    ({ stringNumber, expected }) => {
      const { beats, score } = setup();
      noteAt(beats[0], 1).setFret(7);
      noteAt(beats[1]).setFret(null);
      noteAt(beats[1], 1).setFret(9);
      noteAt(beats[1], 2).setFret(12);
      const before = serializeScore(score);
      const command = tieCommand([beats[1]], stringNumber);
      command.execute();
      expect(
        beats[1].notes?.slice(0, 3).map((n) => (n as GuitarNote).fret)
      ).toEqual(expected);
      expect(noteAt(beats[1], 1).isTieContinuation).toBe(true);
      expect(noteAt(beats[1]).isTieContinuation).toBe(
        stringNumber === undefined
      );
      expect(noteAt(beats[1], 2).isTieContinuation).toBe(false);
      const after = serializeScore(score);
      command.undo();
      expect(serializeScore(score)).toEqual(before);
      command.redo();
      expect(serializeScore(score)).toEqual(after);
    }
  );

  test("undoing Vibrato restores a Tie without tying earlier notes", () => {
    const { beats, score } = setup();
    beats.forEach((b) => {
      noteAt(b).setFret(5);
    });
    noteAt(beats[2]).setTechnique(GuitarTechniqueType.Tie);
    const before = serializeScore(score);
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(beats[2]), stringNumber: 1 }],
      GuitarTechniqueType.Vibrato
    );
    command.execute();
    expect(command.executed).toBe(true);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    expect(noteAt(beats[1]).isTieContinuation).toBe(false);
  });

  test("fills earlier empty slots in one undo step and reuses the saved fret on redo", () => {
    const { beats, score } = setup();
    [14, null, null, 17].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    const before = serializeScore(score);
    const manager = new CommandManager();
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(beats[3]), stringNumber: 1 }],
      GuitarTechniqueType.Tie,
      { tieToEarliest: true }
    );
    manager.execute(command);
    expect(beats.slice(1).every((b) => noteAt(b).isTieContinuation)).toBe(true);
    const after = serializeScore(score);
    expect(manager.undo()).toBe(command);
    expect(manager.canUndo).toBe(false);
    expect(serializeScore(score)).toEqual(before);
    noteAt(beats[0]).setFret(20);
    expect(manager.redo()).toBe(command);
    expect(manager.canRedo).toBe(false);
    expect(serializeScore(score)).toEqual(after);
  });

  test("setTechniqueForNotes ties earlier empty slots and leaves other strings unchanged", () => {
    const { beats } = setup();
    [14, null, null, 17].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    noteAt(beats[3], 1).setFret(8);
    expect(
      ScoreEditor.setTechniqueForNotes(
        [noteAt(beats[3])],
        GuitarTechniqueType.Tie,
        { tieToEarliest: true }
      )
    ).toBe(true);
    expect(beats.slice(1).every((b) => noteAt(b).isTieContinuation)).toBe(true);
    expect(noteAt(beats[3], 1).fret).toBe(8);
    expect(
      ScoreEditor.setTechniqueForNotes(
        [noteAt(beats[3])],
        GuitarTechniqueType.Tie
      )
    ).toBe(true);
    expect(noteAt(beats[3]).fret).toBe(14);
    expect(noteAt(beats[3]).isTieContinuation).toBe(false);
  });

  test.each<{
    input: (number | null | "rest")[];
    frets: (number | null | "rest")[];
    ties: boolean[];
  }>([
    {
      input: [14, null, null, null],
      frets: [14, 14, 14, 14],
      ties: [false, true, true, true],
    },
    {
      input: [14, 14, 14, 14],
      frets: [14, 14, 14, 14],
      ties: [false, true, true, true],
    },
    {
      input: [14, null, 14, null],
      frets: [14, 14, 14, 14],
      ties: [false, true, true, true],
    },
    {
      input: [12, 14, null, null],
      frets: [12, 14, 14, 14],
      ties: [false, false, true, true],
    },
    {
      input: [14, 12, 14, 14],
      frets: [14, 12, 14, 14],
      ties: [false, false, false, true],
    },
    {
      input: [14, "rest", null, null],
      frets: [14, "rest", null, null],
      ties: [false, false, false, false],
    },
    {
      input: [14, -1, null, null],
      frets: [14, -1, null, null],
      ties: [false, false, false, false],
    },
    {
      input: [null, null, null, null],
      frets: [null, null, null, null],
      ties: [false, false, false, false],
    },
    {
      input: [null, 14, null, 17],
      frets: [null, 14, 14, 14],
      ties: [false, false, true, true],
    },
    {
      input: [14, null, null, "rest"],
      frets: [14, 14, 14, 14],
      ties: [false, true, true, true],
    },
  ])("ties earlier notes for $input", ({ input, frets, ties }) => {
    const { beats, score } = setup();
    input.forEach((f, i) => {
      if (f === "rest") {
        beats[i].makeRest();
      } else {
        noteAt(beats[i]).setFret(f);
      }
    });
    const before = serializeScore(score);
    const command = tieCommand([beats[3]], 1, true);
    command.execute();
    expect(beats.map((b) => (b.isRest() ? "rest" : noteAt(b).fret))).toEqual(
      frets
    );
    expect(
      beats.map((b) => (b.isRest() ? false : noteAt(b).isTieContinuation))
    ).toEqual(ties);
    expect(command.executed).toBe(ties.some(Boolean));
    if (!command.executed) {
      expect(serializeScore(score)).toEqual(before);
    }
  });

  test("preparing a Tie leaves earlier notes and the next tie unchanged", () => {
    const { beats, score } = setup();
    [14, null, 17, 17].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    noteAt(beats[3]).setTechnique(GuitarTechniqueType.Tie);
    const before = serializeScore(score);
    const plan = ScoreEditor.buildTiePlanForBeats([beats[2]], 1, true);
    expect(serializeScore(score)).toEqual(before);
    ScoreEditor.applyTiePlan(plan);
    expect(noteAt(beats[2]).fret).toBe(14);
    expect(noteAt(beats[3]).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
  });

  test.each([
    { order: [1, 2, 3], expected: [5, 5, 5, 5] },
    { order: [3, 2, 1], expected: [5, 5, 9, 9] },
    { order: [2, 1, 3], expected: [5, 5, 9, 9] },
  ])(
    "ties selected beats in order $order and restores them on undo",
    ({ order, expected }) => {
      const { beats, score } = setup();
      const selected = order.map((i) => beats[i]);
      const before = serializeScore(score);
      const command = tieCommand(selected, 1);
      command.execute();
      expect(beats.map((b) => noteAt(b).fret)).toEqual(expected);
      const after = serializeScore(score);
      command.undo();
      expect(serializeScore(score)).toEqual(before);
      noteAt(beats[0]).setFret(20);
      command.redo();
      expect(serializeScore(score)).toEqual(after);
    }
  );

  test("leaves the first beat unchanged because it has no earlier source", () => {
    const { beats, score } = setup();
    const before = serializeScore(score);
    const command = tieCommand([beats[0]], 1);
    command.execute();
    expect(command.executed).toBe(false);
    expect(command.affectedModels).toEqual([]);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
  });

  test("ties across adjacent bars and reports all changed beats", () => {
    const { beats, score, staff } = setup();
    beats.forEach((b, i) => {
      noteAt(b).setFret(i === 1 ? 14 : null);
    });
    noteAt(beats[2], 1).setFret(8);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const voice = staff.bars[1].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected voice");
    }
    const target = voice.beats[0];
    const before = serializeScore(score);
    const command = tieCommand([target], 1, true);
    command.execute();
    expect(noteAt(beats[0]).fret).toBe(null);
    for (const beat of [beats[2], beats[3], target]) {
      expect(noteAt(beat).isTieContinuation).toBe(true);
      expect(
        command.affectedModels.some((m) => m.modelUUID === beat.uuid)
      ).toBe(true);
    }
    expect(noteAt(beats[2], 1).fret).toBe(8);
    expect(noteAt(beats[2], 1).isTieContinuation).toBe(false);
    const after = serializeScore(score);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    // Redo restores fixed content even if a fresh search would find another fret.
    noteAt(beats[1]).setFret(19);
    command.redo();
    expect(serializeScore(score)).toEqual(after);
  });

  test("undo restores the next Tie after the selected fret is replaced", () => {
    const { beats, score } = setup();
    [14, null, 17, 17].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    noteAt(beats[3]).setTechnique(GuitarTechniqueType.Tie);
    const before = serializeScore(score);
    const command = tieCommand([beats[2]], 1, true);
    command.execute();
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
    expect(noteAt(beats[3]).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    command.redo();
    expect(noteAt(beats[3]).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
    const following = new SetFretCommand(beats[1], 1, 8);
    following.execute();
    following.undo();
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    command.redo();
    expect(noteAt(beats[2]).isTieContinuation).toBe(true);
  });

  test("a chord range uses each string's source and undoes earlier changes", () => {
    const { beats, score } = setup();
    [14, null, null, 17].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    noteAt(beats[0], 1).setFret(7);
    noteAt(beats[1], 1).setFret(8);
    noteAt(beats[2], 2).setFret(12);
    const before = serializeScore(score);
    const command = tieCommand(beats.slice(2), undefined, true);
    command.execute();
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
    expect(noteAt(beats[0], 1).isTieContinuation).toBe(false);
    expect(noteAt(beats[1], 1).isTieContinuation).toBe(false);
    for (const beat of beats.slice(2)) {
      expect(noteAt(beat).fret).toBe(14);
      expect(noteAt(beat, 1).fret).toBe(8);
      expect(noteAt(beat, 1).isTieContinuation).toBe(true);
      expect(noteAt(beat, 2).fret).toBe(null);
    }
    const after = serializeScore(score);
    command.undo();
    expect(serializeScore(score)).toEqual(before);
    command.redo();
    expect(serializeScore(score)).toEqual(after);
  });

  test("Tie can fill empty slots but cannot be added directly without a matching previous note", () => {
    const { beats } = setup();
    [14, null, null, 14].forEach((f, i) => {
      noteAt(beats[i]).setFret(f);
    });
    const target = noteAt(beats[3]);
    expect(target.isTechniqueApplicable(GuitarTechniqueType.Tie)).toBe(true);
    expect(target.setTechnique(GuitarTechniqueType.Tie)).toBe(false);
    expect(target.isTieContinuation).toBe(false);
    tieCommand([beats[3]], 1, true).execute();
    expect(noteAt(beats[3]).isTieContinuation).toBe(true);
  });

  test("copying a note and setting the same fret leave existing ties unchanged", () => {
    const { beats } = setup();
    tieCommand(beats.slice(1, 3), 1).execute();
    const continuation = noteAt(beats[1]);
    continuation.deepCopy();
    continuation.setFret(5);
    expect(continuation.isTieContinuation).toBe(true);
    expect(noteAt(beats[2]).isTieContinuation).toBe(true);
  });
  test("turning the previous beat into a rest removes the next tie and supports undo", () => {
    const { beats, score } = setup();
    tieCommand([beats[1]], 1).execute();
    const command = new SetRestCommand([beats[0]], true);
    command.execute();
    expect(noteAt(beats[1]).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
    expect(() => serializeScore(score)).not.toThrow();
    command.undo();
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
    command.redo();
    expect(noteAt(beats[1]).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
  });
  test("undo restores frets and techniques replaced by a Tie", () => {
    const { notes, beats } = setup();
    notes[1].setTechnique(GuitarTechniqueType.Vibrato);
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(beats[1]), stringNumber: 1 }],
      GuitarTechniqueType.Tie
    );
    command.execute();
    expect(noteAt(beats[1]).fret).toBe(5);
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
    expect(noteAt(beats[1]).hasTechnique(GuitarTechniqueType.Vibrato)).toBe(
      false
    );
    command.undo();
    expect(noteAt(beats[1]).fret).toBe(9);
    expect(noteAt(beats[1]).hasTechnique(GuitarTechniqueType.Vibrato)).toBe(
      true
    );
    command.redo();
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
  });
  test("Tie search stops at an empty previous-bar voice and ignores other voices", () => {
    const { beats, score, staff } = setup();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const nextVoice = staff.bars[1].getVoiceBar(1);
    const lastVoice = staff.bars[2].getVoiceBar(1);
    if (nextVoice === null || lastVoice === null) {
      throw Error("Expected voices");
    }
    const nextBeat = nextVoice.beats[0];
    tieCommand([nextBeat], 1).execute();
    expect(noteAt(nextBeat).isTieContinuation).toBe(true);
    expect(noteAt(nextBeat).fret).toBe(noteAt(beats[3]).fret);
    nextVoice.beats.splice(0);
    const last = lastVoice.beats[0];
    last.makeBeatWithNotes();
    tieCommand([last], 1).execute();
    expect(noteAt(last).hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
    const secondVoice = staff.bars[0].insertVoiceBar(2);
    const secondBeat = secondVoice.beats[0];
    secondBeat.makeBeatWithNotes();
    tieCommand([secondBeat], 1).execute();
    expect(noteAt(secondBeat).hasTechnique(GuitarTechniqueType.Tie)).toBe(
      false
    );
  });
  test("removing a Tie keeps its fret and supports undo", () => {
    const { beats } = setup();
    const command = tieCommand([beats[1]], 1);
    command.execute();
    expect(noteAt(beats[1]).fret).toBe(5);
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
    const remove = tieCommand([beats[1]], 1);
    remove.execute();
    expect(noteAt(beats[1]).fret).toBe(5);
    expect(noteAt(beats[1]).isTieContinuation).toBe(false);
    remove.undo();
    expect(noteAt(beats[1]).isTieContinuation).toBe(true);
  });

  test("copies a whole chord through a range, including selected rests", () => {
    const { beats } = setup();
    noteAt(beats[0], 2).setFret(7);
    noteAt(beats[2], 1).setFret(12);
    beats[1].makeRest();
    const command = tieCommand(beats.slice(1, 3));
    command.execute();
    for (const beat of beats.slice(1, 3)) {
      expect(
        beat.notes
          ?.filter((n) => (n as GuitarNote).fret !== null)
          .map((n) => (n as GuitarNote).fret)
      ).toEqual([5, 7]);
      expect(noteAt(beat, 2).isTieContinuation).toBe(true);
    }
    command.undo();
    expect(beats[1].isRest()).toBe(true);
    expect(noteAt(beats[2]).fret).toBe(9);
    command.redo();
    expect(noteAt(beats[2], 2).isTieContinuation).toBe(true);
  });

  test("changing a fret preserves its connected Ties, with undo and redo", () => {
    const { beats } = setup();
    tieCommand(beats.slice(1, 3), 1).execute();
    const command = new SetFretCommand(beats[1], 1, 6);
    command.execute();
    expect(beats.slice(1, 3).every((b) => noteAt(b).isTieContinuation)).toBe(
      true
    );
    command.undo();
    expect(beats.slice(1, 3).every((b) => noteAt(b).isTieContinuation)).toBe(
      true
    );
    command.redo();
    expect(beats.slice(1, 3).every((b) => noteAt(b).isTieContinuation)).toBe(
      true
    );
  });
});
