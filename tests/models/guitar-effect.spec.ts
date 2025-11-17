import { TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";
import { GuitarTechnique } from "../../src/models/guitar-technique/guitar-technique";
import { GuitarTechniqueOptions } from "../../src/models/guitar-technique/guitar-technique-bendOptions";
import { GuitarTechniqueType } from "../../src/models/guitar-technique/guitar-technique-type";

describe("Guitar Technique Model Tests", () => {
  test("Valid vibrato", () => {
    const type = GuitarTechniqueType.Vibrato;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    const actualGuitarTechnique = new GuitarTechnique(type);

    try {
      guitarTechnique = new GuitarTechnique(type);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Invalid vibrato: bendOptions provided", () => {
    const type = GuitarTechniqueType.Vibrato;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(
        type,
        new GuitarTechniqueOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      techniqueError = error;
      console.log(`ERROR: ${error}`);
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Valid bend", () => {
    const type = GuitarTechniqueType.Bend;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    const bendOptions = new GuitarTechniqueOptions(1.2);
    const actualGuitarTechnique = new GuitarTechnique(type, bendOptions);

    try {
      guitarTechnique = new GuitarTechnique(type, bendOptions);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Invalid bend: no bendOptions", () => {
    const type = GuitarTechniqueType.Bend;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(type);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Invalid bend: wrong bendOptions", () => {
    const type = GuitarTechniqueType.Bend;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(
        type,
        new GuitarTechniqueOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Valid bend-and-release", () => {
    const type = GuitarTechniqueType.BendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    const bendOptions = new GuitarTechniqueOptions(1.2, 1.2);
    const actualGuitarTechnique = new GuitarTechnique(type, bendOptions);

    try {
      guitarTechnique = new GuitarTechnique(type, bendOptions);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Invalid bend-and-release: no bendOptions", () => {
    const type = GuitarTechniqueType.BendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(type);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Invalid bend-and-release: wrong bendOptions", () => {
    const type = GuitarTechniqueType.BendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(
        type,
        new GuitarTechniqueOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Valid prebend-and-release", () => {
    const type = GuitarTechniqueType.PrebendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    const bendOptions = new GuitarTechniqueOptions(undefined, 1.2, 1.2);
    const actualGuitarTechnique = new GuitarTechnique(type, bendOptions);

    try {
      guitarTechnique = new GuitarTechnique(type, bendOptions);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Invalid prebend-and-release: no bendOptions", () => {
    const type = GuitarTechniqueType.PrebendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(type);
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Invalid prebend-and-release: wrong bendOptions", () => {
    const type = GuitarTechniqueType.PrebendAndRelease;

    let guitarTechnique: GuitarTechnique | undefined;
    let techniqueError: Error | undefined = undefined;

    try {
      guitarTechnique = new GuitarTechnique(
        type,
        new GuitarTechniqueOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      techniqueError = error;
    } finally {
      expect(techniqueError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Guitar technique from object, valid, #1", () => {
    const type = GuitarTechniqueType.Vibrato;

    const obj = {
      type: type,
    };

    const actualGuitarTechnique = new GuitarTechnique(type);

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Guitar technique from object, valid, #2", () => {
    const type = GuitarTechniqueType.Bend;
    const bendPitch = 1.25;

    const obj = {
      type: type,
      bendOptions: { bendPitch: bendPitch },
    };

    const actualGuitarTechnique = new GuitarTechnique(
      type,
      new GuitarTechniqueOptions(bendPitch)
    );

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Guitar technique from object, valid, #3", () => {
    const type = GuitarTechniqueType.PrebendAndRelease;
    const prebendPitch = 1.25;
    const bendReleasePitch = 0.5;

    const obj = {
      type: type,
      bendOptions: {
        prebendPitch: prebendPitch,
        bendReleasePitch: bendReleasePitch,
      },
    };

    const actualGuitarTechnique = new GuitarTechnique(
      type,
      new GuitarTechniqueOptions(undefined, bendReleasePitch, prebendPitch)
    );

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarTechnique).toStrictEqual(actualGuitarTechnique);
    }
  });

  test("Guitar technique from object, invalid, #1", () => {
    const type = GuitarTechniqueType.Vibrato;

    const obj = {
      type: type,
      bendOptions: { bendPitch: 1.2 },
    };

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Guitar technique from object, invalid, #2", () => {
    const type = GuitarTechniqueType.Bend;
    const bendPitch = 1.25;

    const obj = {
      type: type,
      bendOptions: { prebendPitch: bendPitch },
    };

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });

  test("Guitar technique from object, invalid, #3", () => {
    const type = GuitarTechniqueType.PrebendAndRelease;
    const prebendPitch = 1.25;
    const bendReleasePitch = 0.5;

    const obj = {
      type: type,
      bendOptions: {
        prebendPitch: prebendPitch,
      },
    };

    let guitarTechnique: GuitarTechnique | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarTechnique = GuitarTechnique.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarTechnique).toStrictEqual(undefined);
    }
  });
});
