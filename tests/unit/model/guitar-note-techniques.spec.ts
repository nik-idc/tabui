import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "./helpers";

function createNote(): GuitarNote {
  const { bar } = createScoreGraph();
  const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note in test beat");
  }
  note.fret = 0;
  return note;
}

function createContinuationNote(): GuitarNote {
  const { beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
    { baseDuration: NoteDuration.Quarter },
  ]);
  const notes = beats.map((b) => {
    const note = b.notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 5;
    return note;
  });
  return notes[1];
}

describe("GuitarNote technique updates", () => {
  test("Let Ring support reads marked empty chains without changing local markers", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const notes = beats.map((b) => {
      const note = b.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      note.setTechnique(GuitarTechniqueType.LetRing);
      return note;
    });
    notes[0].fret = 5;

    expect(notes[2].hasLetRingSupport()).toBe(true);
    notes[1].removeTechnique(GuitarTechniqueType.LetRing);
    expect(notes[2].hasLetRingSupport()).toBe(false);
    expect(notes[2].hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    notes[1].setTechnique(GuitarTechniqueType.LetRing);
    notes[0].fret = -1;
    expect(notes[2].hasLetRingSupport()).toBe(false);
    notes[0].fret = 5;
    notes[0].setTechnique(GuitarTechniqueType.LetRing);
    expect(notes[2].hasLetRingSupport()).toBe(true);
    beats[1].makeRest();
    expect(notes[2].hasLetRingSupport()).toBe(false);
  });

  test("empty construction keeps Let Ring locally but rejects note-only techniques", () => {
    const note = createNote();
    const marker = new GuitarTechnique(note, GuitarTechniqueType.LetRing);
    const empty = new GuitarNote(
      note.beat,
      note.trackContext,
      note.stringNum,
      null,
      [marker]
    );

    expect(empty.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(empty.hasLetRingSupport()).toBe(false);
    expect(
      () =>
        new GuitarNote(note.beat, note.trackContext, note.stringNum, null, [
          new GuitarTechnique(note, GuitarTechniqueType.Tie),
        ])
    ).toThrow("Cannot apply techniques to an empty guitar note");
  });

  test("Palm Mute accepts a dead strike but never an empty slot", () => {
    const note = createNote();
    note.fret = -1;
    expect(note.isTechniqueApplicable(GuitarTechniqueType.PalmMute)).toBe(true);
    expect(note.setTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
    note.fret = null;
    expect(note.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
    expect(note.setTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
  });

  test("rejects techniques on empty notes and clears them when emptied", () => {
    const note = createNote();
    note.fret = null;

    expect(note.isTechniqueApplicable(GuitarTechniqueType.Vibrato)).toBe(false);
    expect(note.setTechnique(GuitarTechniqueType.Vibrato)).toBe(false);
    expect(
      note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato))
    ).toBe(false);

    note.fret = 3;
    expect(note.setTechnique(GuitarTechniqueType.Vibrato)).toBe(true);

    note.fret = null;
    expect(note.techniques).toEqual([]);
  });

  test.each([
    new BendTechniqueOptions({
      type: BendType.Prebend,
      prebendPitch: 1,
    }),
    new BendTechniqueOptions({
      type: BendType.PrebendAndRelease,
      prebendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    }),
    new BendTechniqueOptions({
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.5,
    }),
  ])("rejects prebend type $type on a tied note", (options) => {
    const note = createContinuationNote();
    note.setTechnique(GuitarTechniqueType.Tie);

    expect(note.setTechnique(GuitarTechniqueType.Bend, options)).toBe(false);
    expect(
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.Bend, options)
      )
    ).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
  });

  test.each([
    new BendTechniqueOptions({
      type: BendType.Prebend,
      prebendPitch: 1,
    }),
    new BendTechniqueOptions({
      type: BendType.PrebendAndRelease,
      prebendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    }),
    new BendTechniqueOptions({
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.5,
    }),
  ])("rejects Tie after prebend type $type", (options) => {
    const note = createContinuationNote();
    note.setTechnique(GuitarTechniqueType.Bend, options);

    expect(note.setTechnique(GuitarTechniqueType.Tie)).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.Tie)).toBe(false);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toEqual(options);
  });

  test("setTechnique toggles an ordinary technique", () => {
    const note = createNote();

    expect(note.setTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);

    expect(note.setTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test.each([
    [GuitarTechniqueType.NaturalHarmonic, GuitarTechniqueType.Vibrato],
    [GuitarTechniqueType.Vibrato, GuitarTechniqueType.NaturalHarmonic],
  ])(
    "rejects incompatible techniques regardless of insertion order",
    (a, b) => {
      const note = createNote();

      expect(note.setTechnique(a)).toBe(true);
      expect(note.isTechniqueApplicable(b)).toBe(false);
      expect(note.setTechnique(b)).toBe(false);
      expect(note.hasTechnique(a)).toBe(true);
      expect(note.hasTechnique(b)).toBe(false);
    }
  );

  test("setTechnique updates options on the existing bend", () => {
    const note = createNote();
    note.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 0.5,
        bendDuration: 1,
      })
    );
    const bend = note.techniques[0];

    expect(
      note.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.PrebendBend,
          prebendPitch: 0.5,
          bendPitch: 1,
          bendDuration: 0.75,
        })
      )
    ).toBe(true);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0]).toBe(bend);
    expect(note.techniques[0].bendOptions).toMatchObject({
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.75,
    });
  });

  test("setTechnique reports no change for identical bend options", () => {
    const note = createNote();
    const options = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 0.75,
    });
    note.setTechnique(GuitarTechniqueType.Bend, options);

    expect(note.setTechnique(GuitarTechniqueType.Bend, options)).toBe(false);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toEqual(options);
  });

  test("resolves continuation pitch from the previous same-string bend", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const previous = beats[0].notes?.[1];
    const current = beats[1].notes?.[1];
    if (!(previous instanceof GuitarNote) || !(current instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    previous.fret = 5;
    current.fret = 5;
    previous.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.75,
      })
    );
    const otherString = beats[0].notes?.[0];
    if (!(otherString instanceof GuitarNote)) {
      throw Error("Expected guitar note on the other string");
    }
    otherString.fret = 5;
    otherString.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 2,
        bendDuration: 0.75,
      })
    );
    expect(current.getBendContinuationPitch()).toBeUndefined();

    current.setTechnique(GuitarTechniqueType.Tie);

    expect(current.getBendContinuationPitch()).toBe(1);

    previous.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.75,
      })
    );
    expect(current.getBendContinuationPitch()).toBeUndefined();
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "rejects continuation bend type %s below the inherited pitch",
    (type) => {
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const previous = beats[0].notes?.[0];
      const current = beats[1].notes?.[0];
      if (
        !(previous instanceof GuitarNote) ||
        !(current instanceof GuitarNote)
      ) {
        throw Error("Expected guitar notes");
      }
      previous.fret = 5;
      current.fret = 5;
      previous.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1.5,
          bendDuration: 0.5,
        })
      );
      current.setTechnique(GuitarTechniqueType.Tie);
      const options = new BendTechniqueOptions(
        type === BendType.Bend
          ? { type, bendPitch: 1, bendDuration: 0.5 }
          : {
              type,
              bendPitch: 1,
              releasePitch: 0,
              bendDuration: 0.5,
            }
      );

      expect(current.setTechnique(GuitarTechniqueType.Bend, options)).toBe(
        false
      );
      expect(current.techniques.map((t) => t.type)).toEqual([
        GuitarTechniqueType.Tie,
      ]);
      expect(
        current.addTechnique(
          new GuitarTechnique(current, GuitarTechniqueType.Bend, options)
        )
      ).toBe(false);
      expect(current.techniques.map((t) => t.type)).toEqual([
        GuitarTechniqueType.Tie,
      ]);
    }
  );

  test("allows a continuation Bend/Release target above its start and release below it", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const previous = beats[0].notes?.[0];
    const current = beats[1].notes?.[0];
    if (!(previous instanceof GuitarNote) || !(current instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    previous.fret = 5;
    current.fret = 5;
    previous.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1.5,
        bendDuration: 0.5,
      })
    );
    current.setTechnique(GuitarTechniqueType.Tie);

    expect(
      current.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.BendAndRelease,
          bendPitch: 2,
          releasePitch: 0,
          bendDuration: 0.5,
        })
      )
    ).toBe(true);
    expect(
      current.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 0.5,
        })
      )
    ).toBe(false);
    expect(current.techniques.map((t) => t.type)).toEqual([
      GuitarTechniqueType.Tie,
      GuitarTechniqueType.Bend,
    ]);
    const bend = current.techniques.find(
      (t) => t.type === GuitarTechniqueType.Bend
    );
    expect(bend?.bendOptions).toMatchObject({
      type: BendType.BendAndRelease,
      bendPitch: 2,
      releasePitch: 0,
      bendDuration: 0.5,
    });
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "rejects continuation bend type %s at the maximum pitch",
    (type) => {
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const previous = beats[0].notes?.[0];
      const current = beats[1].notes?.[0];
      if (
        !(previous instanceof GuitarNote) ||
        !(current instanceof GuitarNote)
      ) {
        throw Error("Expected guitar notes");
      }
      previous.fret = 5;
      current.fret = 5;
      previous.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 3,
          bendDuration: 0.5,
        })
      );
      current.setTechnique(GuitarTechniqueType.Tie);
      const options = new BendTechniqueOptions(
        type === BendType.Bend
          ? { type, bendPitch: 3, bendDuration: 0.5 }
          : {
              type,
              bendPitch: 3,
              releasePitch: 0,
              bendDuration: 0.5,
            }
      );

      expect(current.setTechnique(GuitarTechniqueType.Bend, options)).toBe(
        false
      );
      expect(current.techniques.map((t) => t.type)).toEqual([
        GuitarTechniqueType.Tie,
      ]);
      expect(
        current.addTechnique(
          new GuitarTechnique(current, GuitarTechniqueType.Bend, options)
        )
      ).toBe(false);
      expect(current.techniques.map((t) => t.type)).toEqual([
        GuitarTechniqueType.Tie,
      ]);
    }
  );

  test.each([GuitarTechniqueType.Legato, GuitarTechniqueType.Slide])(
    "rejects technique %s when next note is the same fret",
    (type) => {
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const current = beats[0].notes?.[0];
      const next = beats[1].notes?.[0];
      if (!(current instanceof GuitarNote) || !(next instanceof GuitarNote)) {
        throw Error("Expected guitar notes");
      }
      current.fret = 5;
      next.fret = 5;

      expect(current.isTechniqueApplicable(type)).toBe(false);
      expect(current.setTechnique(type)).toBe(false);
      expect(current.hasTechnique(type)).toBe(false);
    }
  );

  test.each([GuitarTechniqueType.Legato, GuitarTechniqueType.Slide])(
    "allows technique %s when the next note has a different fret",
    (type) => {
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const current = beats[0].notes?.[0];
      const next = beats[1].notes?.[0];
      if (!(current instanceof GuitarNote) || !(next instanceof GuitarNote)) {
        throw Error("Expected guitar notes");
      }
      current.fret = 5;
      next.fret = 7;

      expect(current.isTechniqueApplicable(type)).toBe(true);
      expect(current.setTechnique(type)).toBe(true);
      expect(current.hasTechnique(type)).toBe(true);
    }
  );
});
