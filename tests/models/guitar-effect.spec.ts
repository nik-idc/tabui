import { TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";
import {
  GuitarEffect,
  GuitarEffectOptions,
  GuitarEffectType,
} from "../../src/models/guitar-effect";

describe("Guitar Effect Model Tests", () => {
  test("Valid vibrato", () => {
    const effectType = GuitarEffectType.Vibrato;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    const actualGuitarEffect = new GuitarEffect(effectType);

    try {
      guitarEffect = new GuitarEffect(effectType);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Invalid vibrato: options provided", () => {
    const effectType = GuitarEffectType.Vibrato;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(
        effectType,
        new GuitarEffectOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      effectError = error;
      console.log(`ERROR: ${error}`);
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Valid bend", () => {
    const effectType = GuitarEffectType.Bend;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    const options = new GuitarEffectOptions(1.2);
    const actualGuitarEffect = new GuitarEffect(effectType, options);

    try {
      guitarEffect = new GuitarEffect(effectType, options);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Invalid bend: no options", () => {
    const effectType = GuitarEffectType.Bend;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(effectType);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Invalid bend: wrong options", () => {
    const effectType = GuitarEffectType.Bend;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(
        effectType,
        new GuitarEffectOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Valid bend-and-release", () => {
    const effectType = GuitarEffectType.BendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    const options = new GuitarEffectOptions(1.2, 1.2);
    const actualGuitarEffect = new GuitarEffect(effectType, options);

    try {
      guitarEffect = new GuitarEffect(effectType, options);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Invalid bend-and-release: no options", () => {
    const effectType = GuitarEffectType.BendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(effectType);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Invalid bend-and-release: wrong options", () => {
    const effectType = GuitarEffectType.BendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(
        effectType,
        new GuitarEffectOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Valid prebend-and-release", () => {
    const effectType = GuitarEffectType.PrebendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    const options = new GuitarEffectOptions(undefined, 1.2, 1.2);
    const actualGuitarEffect = new GuitarEffect(effectType, options);

    try {
      guitarEffect = new GuitarEffect(effectType, options);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Invalid prebend-and-release: no options", () => {
    const effectType = GuitarEffectType.PrebendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(effectType);
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Invalid prebend-and-release: wrong options", () => {
    const effectType = GuitarEffectType.PrebendAndRelease;

    let guitarEffect: GuitarEffect | undefined;
    let effectError: Error | undefined = undefined;

    try {
      guitarEffect = new GuitarEffect(
        effectType,
        new GuitarEffectOptions(undefined, 1.2, undefined)
      );
    } catch (error) {
      effectError = error;
    } finally {
      expect(effectError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Guitar effect from object, valid, #1", () => {
    const effectType = GuitarEffectType.Vibrato;

    const obj = {
      effectType: effectType,
    };

    const actualGuitarEffect = new GuitarEffect(effectType);

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Guitar effect from object, valid, #2", () => {
    const effectType = GuitarEffectType.Bend;
    const bendPitch = 1.25;

    const obj = {
      effectType: effectType,
      options: { bendPitch: bendPitch },
    };

    const actualGuitarEffect = new GuitarEffect(
      effectType,
      new GuitarEffectOptions(bendPitch)
    );

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Guitar effect from object, valid, #3", () => {
    const effectType = GuitarEffectType.PrebendAndRelease;
    const prebendPitch = 1.25;
    const bendReleasePitch = 0.5;

    const obj = {
      effectType: effectType,
      options: {
        prebendPitch: prebendPitch,
        bendReleasePitch: bendReleasePitch,
      },
    };

    const actualGuitarEffect = new GuitarEffect(
      effectType,
      new GuitarEffectOptions(undefined, bendReleasePitch, prebendPitch)
    );

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
      expect(guitarEffect).toStrictEqual(actualGuitarEffect);
    }
  });

  test("Guitar effect from object, invalid, #1", () => {
    const effectType = GuitarEffectType.Vibrato;

    const obj = {
      effectType: effectType,
      options: { bendPitch: 1.2 },
    };

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Guitar effect from object, invalid, #2", () => {
    const effectType = GuitarEffectType.Bend;
    const bendPitch = 1.25;

    const obj = {
      effectType: effectType,
      options: { prebendPitch: bendPitch },
    };

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });

  test("Guitar effect from object, invalid, #3", () => {
    const effectType = GuitarEffectType.PrebendAndRelease;
    const prebendPitch = 1.25;
    const bendReleasePitch = 0.5;

    const obj = {
      effectType: effectType,
      options: {
        prebendPitch: prebendPitch,
      },
    };

    let guitarEffect: GuitarEffect | undefined;
    let parseError: Error | undefined = undefined;
    try {
      guitarEffect = GuitarEffect.fromObject(obj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
      expect(guitarEffect).toStrictEqual(undefined);
    }
  });
});
