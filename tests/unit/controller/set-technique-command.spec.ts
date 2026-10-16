import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

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
    note.fret = 5;

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );

    command.execute();
    expect(command.executed).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);

    command.undo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(false);

    command.redo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);
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
    note.fret = 5;

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      [note],
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
    note.fret = 5;

    const vibratoCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );
    const bendCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    );
    const letRingCommand = new SetTechniqueCommand(
      [note],
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
    note.fret = 5;

    const harmonicCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.NaturalHarmonic
    );
    const slideCommand = new SetTechniqueCommand(
      [note],
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
    note.fret = 5;

    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
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
    note.fret = 5;

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
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1,
        bendDuration: 1,
      })
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
    expect(note.techniques).toMatchObject([
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
  });

  test("existing bend is removed without options and supports undo and redo", () => {
    const { bar } = createScoreGraph();
    const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
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
    const command = new SetTechniqueCommand([note], GuitarTechniqueType.Bend);

    command.execute();
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);

    command.undo();
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toMatchObject({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    });

    command.redo();
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
  });
});
