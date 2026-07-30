import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "./helpers";

function createNote(): GuitarNote {
  const { bar } = createScoreGraph();
  const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note in test beat");
  }
  return note;
}

describe("GuitarNote technique updates", () => {
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
  ])("rejects prebend type $type on a Let Ring note", (options) => {
    const note = createNote();
    note.setTechnique(GuitarTechniqueType.LetRing);

    expect(note.setTechnique(GuitarTechniqueType.Bend, options)).toBe(false);
    expect(
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.Bend, options)
      )
    ).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
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
  ])("rejects Let Ring after prebend type $type", (options) => {
    const note = createNote();
    note.setTechnique(GuitarTechniqueType.Bend, options);

    expect(note.setTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test("setTechnique toggles an ordinary technique", () => {
    const note = createNote();

    expect(note.setTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);

    expect(note.setTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

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
    expect(note.techniques).toEqual([bend]);
    expect(note.techniques[0].bendOptions?.type).toBe(BendType.PrebendBend);
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
  });

  test("resolves continuation pitch from the previous same-string bend", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const previous = beats[0].notes?.[0];
    const current = beats[1].notes?.[0];
    if (!(previous instanceof GuitarNote) || !(current instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    previous.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.75,
      })
    );
    current.setTechnique(GuitarTechniqueType.LetRing);

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
      previous.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1.5,
          bendDuration: 0.5,
        })
      );
      current.setTechnique(GuitarTechniqueType.LetRing);
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
      expect(
        current.addTechnique(
          new GuitarTechnique(current, GuitarTechniqueType.Bend, options)
        )
      ).toBe(false);
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
    previous.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1.5,
        bendDuration: 0.5,
      })
    );
    current.setTechnique(GuitarTechniqueType.LetRing);

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
    expect(
      current.techniques.find(
        (technique) => technique.type === GuitarTechniqueType.Bend
      )?.bendOptions?.type
    ).toBe(BendType.BendAndRelease);
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
      previous.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 3,
          bendDuration: 0.5,
        })
      );
      current.setTechnique(GuitarTechniqueType.LetRing);
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
      expect(
        current.addTechnique(
          new GuitarTechnique(current, GuitarTechniqueType.Bend, options)
        )
      ).toBe(false);
    }
  );
});
