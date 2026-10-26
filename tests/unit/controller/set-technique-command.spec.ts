import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  ScoreEditor,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

function currentNote(note: GuitarNote): GuitarNote {
  const current = note.beat.notes?.[note.stringNum - 1];
  if (!(current instanceof GuitarNote)) {
    throw Error("Expected live guitar note");
  }
  return current;
}

describe("SetTechniqueCommand", () => {
  test("execute applies technique and undo restores previous techniques", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Vibrato
    );

    command.execute();
    expect(command.executed).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);

    command.undo();
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.LetRing)).toBe(
      true
    );
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.Vibrato)).toBe(
      false
    );

    command.redo();
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.LetRing)).toBe(
      true
    );
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.Vibrato)).toBe(
      true
    );
  });

  test("incompatible execute leaves executed false and undo is a no-op", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.PalmMute
    );

    command.execute();
    expect(command.executed).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);

    command.undo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
  });

  test("vibrato, bend, and let ring report that they affect technique labels", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    const vibratoCommand = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Vibrato
    );
    const bendCommand = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Bend,
      {
        bendOptions: new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        }),
      }
    );
    const letRingCommand = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.LetRing
    );

    expect(vibratoCommand.affectsTechniqueLabels).toBe(true);
    expect(bendCommand.affectsTechniqueLabels).toBe(true);
    expect(letRingCommand.affectsTechniqueLabels).toBe(true);
  });

  test("harmonic and slide commands report the affected note anchor", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    const harmonicCommand = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.NaturalHarmonic
    );
    const slideCommand = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Slide
    );

    expect(harmonicCommand.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: note.uuid },
    ]);
    expect(slideCommand.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: note.uuid },
    ]);
  });

  test("bend commands report the affected note anchor", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Bend,
      {
        bendOptions: new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        }),
      }
    );

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: note.uuid },
    ]);

    note.beat.makeRest();
    note.beat.makeBeatWithNotes();
    const currentNote = note.beat.notes?.[note.stringNum - 1];
    if (!(currentNote instanceof GuitarNote)) {
      throw Error("Expected recreated guitar note in test beat");
    }
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: currentNote.uuid },
    ]);
  });

  test("execute replaces existing bend options and undo restores them", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    const note = voiceBar?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 0.5,
          bendDuration: 1,
        })
      )
    );
    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Bend,
      {
        bendOptions: new BendTechniqueOptions({
          type: BendType.PrebendBend,
          prebendPitch: 0.5,
          bendPitch: 1,
          bendDuration: 1,
        }),
      }
    );

    command.execute();
    expect(command.executed).toBe(true);
    expect(note.techniques).toMatchObject([
      {
        type: GuitarTechniqueType.Bend,
        bendOptions: {
          type: BendType.PrebendBend,
          prebendPitch: 0.5,
          bendPitch: 1,
          bendDuration: 1,
        },
      },
    ]);

    command.undo();
    expect(currentNote(note).techniques).toMatchObject([
      {
        type: GuitarTechniqueType.Bend,
        bendOptions: {
          type: BendType.Bend,
          bendPitch: 0.5,
          bendDuration: 1,
        },
      },
    ]);

    command.redo();
    expect(currentNote(note).techniques).toMatchObject([
      {
        type: GuitarTechniqueType.Bend,
        bendOptions: {
          type: BendType.PrebendBend,
          prebendPitch: 0.5,
          bendPitch: 1,
          bendDuration: 1,
        },
      },
    ]);
  });

  test("existing bend is removed without options and supports undo and redo", () => {
    const { bar } = createScoreGraph();
    const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);
    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        })
      )
    );
    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Bend
    );

    command.execute();
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);

    command.undo();
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    expect(currentNote(note).techniques).toHaveLength(1);
    expect(currentNote(note).techniques[0].bendOptions).toMatchObject({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    });

    command.redo();
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.Bend)).toBe(
      false
    );
  });

  test("executing a prepared command edits the current note after its slots are recreated", () => {
    const { bar } = createScoreGraph();
    const beat = bar.getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected beat");
    }
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(beat), stringNumber: 1 }],
      GuitarTechniqueType.Vibrato
    );
    beat.makeRest();
    beat.makeBeatWithNotes();
    const note = beat.notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.setFret(5);
    note.setTechnique(GuitarTechniqueType.LetRing);

    command.execute();
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.Vibrato)).toBe(
      true
    );
    expect(currentNote(note).fret).toBe(5);
    expect(currentNote(note).hasTechnique(GuitarTechniqueType.LetRing)).toBe(
      true
    );
  });

  test("Vibrato on a selected rest makes no edit and creates no notes", () => {
    const { bar } = createScoreGraph();
    const beat = bar.getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected beat");
    }
    beat.makeRest();
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(beat), stringNumber: 1 }],
      GuitarTechniqueType.Vibrato
    );
    command.execute();
    expect(command.executed).toBe(false);
    expect(beat.notes).toBeNull();
    expect(command.affectedModels).toEqual([]);
  });
});
