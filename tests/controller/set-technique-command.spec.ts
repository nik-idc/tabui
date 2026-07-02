import { SetTechniqueCommand } from "../../src/notation/controller/editor/command";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../src/notation/model";
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

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("label-producing techniques are marked for vertical update", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const vibratoCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );
    const bendCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({ type: BendType.Bend })
    );
    const letRingCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.LetRing
    );

    expect(vibratoCommand.affectsTechniqueLabels).toBe(true);
    expect(bendCommand.affectsTechniqueLabels).toBe(true);
    expect(letRingCommand.affectsTechniqueLabels).toBe(true);
  });

  test("inline non-label techniques are marked for targeted update", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

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

  test("bend requests a model update because it produces a label", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({ type: BendType.Bend })
    );

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: note.uuid },
    ]);
  });
});
