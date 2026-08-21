import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { BendControlsComponent } from "../../../src/ui/side-controls/technique-controls/bend-controls/bend-controls-component";
import { BendControlsTemplateRenderer } from "../../../src/ui/side-controls/technique-controls/bend-controls/bend-controls-template-renderer";
import { createBarWithBeats } from "../model/helpers";
import { makeButton } from "./helpers";

function createNote(): GuitarNote {
  const { beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
  ]);
  const note = beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note");
  }
  note.fret = 5;
  return note;
}

function makeComponent(note: GuitarNote) {
  const bendTypesButtons = {
    [BendType.Bend]: makeButton(),
    [BendType.BendAndRelease]: makeButton(),
    [BendType.Hold]: makeButton(),
    [BendType.Prebend]: makeButton(),
    [BendType.PrebendAndRelease]: makeButton(),
    [BendType.PrebendBend]: makeButton(),
    [BendType.Release]: makeButton(),
  };
  const bendSelectorManager = { init: jest.fn() };
  const templateRenderer = { setSelectedBendType: jest.fn() };
  const component = {
    notationComponent: {
      trackController: { selectionCursor: { note } },
    },
    bendSelectorManager,
    templateRenderer,
    template: {
      bendTypesButtons,
      removeButton: makeButton(),
    },
  } as any;
  Object.setPrototypeOf(component, BendControlsComponent.prototype);
  return {
    component,
    bendSelectorManager,
    bendTypesButtons,
    templateRenderer,
  };
}

describe("BendControlsComponent", () => {
  test("template renderer highlights only the selected bend type", () => {
    const { component, bendTypesButtons } = makeComponent(createNote());

    BendControlsTemplateRenderer.prototype.setSelectedBendType.call(
      { template: component.template },
      BendType.Release
    );

    for (const [type, button] of Object.entries(bendTypesButtons)) {
      expect(button.classList.toggle).toHaveBeenCalledWith(
        "tu-applied-button",
        Number(type) === BendType.Release
      );
    }
  });

  test("initializes the selector from an existing bend", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 5;
    const options = new BendTechniqueOptions({
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.75,
    });
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.Bend, options)
    );
    const { component, bendSelectorManager, templateRenderer } =
      makeComponent(note);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendSelectorManager.init).toHaveBeenCalledWith(options, undefined);
    expect(component.template.removeButton.disabled).toBe(false);
    expect(templateRenderer.setSelectedBendType).toHaveBeenCalledWith(
      BendType.PrebendBend
    );
  });

  test("enables Hold and Release after a non-releasing bend", () => {
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
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 0.75,
        })
      )
    );
    current.addTechnique(
      new GuitarTechnique(current, GuitarTechniqueType.LetRing)
    );
    const { component, bendSelectorManager, bendTypesButtons } =
      makeComponent(current);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendSelectorManager.init).toHaveBeenCalledWith(undefined, 1);
    expect(bendTypesButtons[BendType.Hold].disabled).toBe(false);
    expect(bendTypesButtons[BendType.Release].disabled).toBe(false);
    expect(bendTypesButtons[BendType.Prebend].disabled).toBe(true);
    expect(bendTypesButtons[BendType.PrebendAndRelease].disabled).toBe(true);
    expect(bendTypesButtons[BendType.PrebendBend].disabled).toBe(true);
  });

  test("disables Bend and Bend/Release at the maximum continuation pitch", () => {
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
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 3,
          bendDuration: 0.75,
        })
      )
    );
    current.addTechnique(
      new GuitarTechnique(current, GuitarTechniqueType.LetRing)
    );
    const {
      component,
      bendSelectorManager,
      bendTypesButtons,
      templateRenderer,
    } = makeComponent(current);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendSelectorManager.init).toHaveBeenCalledWith(
      { type: BendType.Hold },
      3
    );
    expect(templateRenderer.setSelectedBendType).toHaveBeenCalledWith(
      BendType.Hold
    );
    expect(bendTypesButtons[BendType.Bend].disabled).toBe(true);
    expect(bendTypesButtons[BendType.BendAndRelease].disabled).toBe(true);
    expect(bendTypesButtons[BendType.Hold].disabled).toBe(false);
    expect(bendTypesButtons[BendType.Release].disabled).toBe(false);
  });

  test("disables every prebend type on Let Ring notes without continuation", () => {
    const note = createNote();
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const { component, bendTypesButtons } = makeComponent(note);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendTypesButtons[BendType.Prebend].disabled).toBe(true);
    expect(bendTypesButtons[BendType.PrebendAndRelease].disabled).toBe(true);
    expect(bendTypesButtons[BendType.PrebendBend].disabled).toBe(true);
  });

  test("keeps Hold and Release disabled without Let Ring", () => {
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
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 0.75,
        })
      )
    );
    const { component, bendTypesButtons } = makeComponent(current);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendTypesButtons[BendType.Hold].disabled).toBe(true);
    expect(bendTypesButtons[BendType.Release].disabled).toBe(true);
  });

  test("keeps Hold and Release disabled after a releasing bend", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const previous = beats[0].notes?.[0];
    const current = beats[1].notes?.[0];
    if (!(previous instanceof GuitarNote) || !(current instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.BendAndRelease,
          bendPitch: 1,
          releasePitch: 0,
          bendDuration: 0.75,
        })
      )
    );
    current.addTechnique(
      new GuitarTechnique(current, GuitarTechniqueType.LetRing)
    );
    const { component, bendTypesButtons } = makeComponent(current);

    BendControlsComponent.prototype.prepareForOpen.call(component);

    expect(bendTypesButtons[BendType.Hold].disabled).toBe(true);
    expect(bendTypesButtons[BendType.Release].disabled).toBe(true);
  });
});
