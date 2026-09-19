import {
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { TechniqueControlsTemplateRenderer } from "../../../src/ui/side-controls/technique-controls/technique-controls-template-renderer";
import { createBarWithBeats } from "../model/helpers";

function createButton(): HTMLButtonElement {
  const classes = new Set<string>();
  return {
    classList: {
      toggle: (name: string, force: boolean) => {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      contains: (name: string) => classes.has(name),
    },
    setAttribute: jest.fn(),
  } as unknown as HTMLButtonElement;
}

function renderButtonState(
  note: GuitarNote | undefined,
  type: GuitarTechniqueType
) {
  const button = createButton();
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
        techniqueButton: HTMLButtonElement
      ): void;
    }
  ).renderTechniqueButtonState;
  renderState.call(renderer, type, button);
  return button.classList;
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
    const button = createButton();
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
          techniqueButton: HTMLButtonElement
        ): void;
      }
    ).renderTechniqueButtonState;
    renderState.call(renderer, type, button);

    expect(button.classList.contains("tu-disabled-img")).toBe(false);
  });

  test("disables bend during drag selection", () => {
    const classes = renderButtonState(undefined, GuitarTechniqueType.Bend);

    expect(classes.contains("tu-disabled-img")).toBe(true);
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

      expect(renderButtonState(current, type).contains("tu-disabled-img")).toBe(
        true
      );
    }
  );
});
