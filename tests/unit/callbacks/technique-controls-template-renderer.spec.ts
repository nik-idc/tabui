import {
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { TechniqueControlsTemplateRenderer } from "../../../src/ui/side-controls/technique-controls/technique-controls-template-renderer";
import { createBarWithBeats } from "../model/helpers";

function renderButtonState(
  note: GuitarNote | undefined,
  type: GuitarTechniqueType
) {
  const classes = new Set<string>();
  const button = {
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
    },
  } as unknown as HTMLImageElement;
  const renderer = {
    notationComponent: {
      trackController: {
        selectionBeats: [],
        selectionCursor: note === undefined ? undefined : { note },
      },
    },
  };

  const renderState = (
    TechniqueControlsTemplateRenderer.prototype as unknown as {
      renderTechniqueButtonState(
        techniqueType: GuitarTechniqueType,
        techniqueButton: HTMLImageElement
      ): void;
    }
  ).renderTechniqueButtonState;
  renderState.call(renderer, type, button);
  return classes;
}

describe("TechniqueControlsTemplateRenderer", () => {
  test.each([
    GuitarTechniqueType.Vibrato,
    GuitarTechniqueType.PalmMute,
    GuitarTechniqueType.LetRing,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.PinchHarmonic,
    GuitarTechniqueType.Legato,
    GuitarTechniqueType.Slide,
  ])("enables technique %s during drag selection", (type) => {
    const classes = new Set<string>();
    const button = {
      classList: {
        add: (name: string) => classes.add(name),
        remove: (name: string) => classes.delete(name),
      },
    } as unknown as HTMLImageElement;
    const renderer = {
      notationComponent: {
        trackController: {
          selectionBeats: [],
          selectionCursor: undefined,
        },
      },
    };

    const renderState = (
      TechniqueControlsTemplateRenderer.prototype as unknown as {
        renderTechniqueButtonState(
          techniqueType: GuitarTechniqueType,
          techniqueButton: HTMLImageElement
        ): void;
      }
    ).renderTechniqueButtonState;
    renderState.call(renderer, type, button);

    expect(classes.has("tu-disabled-img")).toBe(false);
  });

  test("disables bend during drag selection", () => {
    const classes = renderButtonState(undefined, GuitarTechniqueType.Bend);

    expect(classes.has("tu-disabled-img")).toBe(true);
  });

  test.each([GuitarTechniqueType.Legato, GuitarTechniqueType.Slide])(
    "disables technique %s without a valid transition target",
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

      expect(renderButtonState(current, type).has("tu-disabled-img")).toBe(
        true
      );
    }
  );
});
