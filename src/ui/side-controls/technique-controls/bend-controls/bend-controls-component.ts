import { NotationComponent } from "../../../../notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendControlsTemplateRenderer } from "./bend-controls-template-renderer";
import { BendSelectorManager } from "./bend-selectors";
import {
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  BEND_TYPE_INCOMPATIBILITY,
  MAX_BEND_PITCH,
} from "../../../../notation/model";
import { BEND_TYPE_BUTTON_ORDER } from "./bend-controls-template";

export class BendControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: BendControlsTemplate;
  readonly templateRenderer: BendControlsTemplateRenderer;
  readonly bendSelectorManager: BendSelectorManager;
  private _initialized = false;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new BendControlsTemplate(dialogHost);
    this.templateRenderer = new BendControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
    this.bendSelectorManager = new BendSelectorManager(
      this.template.bendSelectorGraphSVG
    );
  }

  public render(): void {
    this.templateRenderer.render();
    if (!this._initialized) {
      this.bendSelectorManager.init();
      this._initialized = true;
    }
  }

  public prepareForOpen(): void {
    const note = this.notationComponent.trackController.selectionCursor?.note;
    const bend =
      note instanceof GuitarNote
        ? note.techniques.find((t) => t.type === GuitarTechniqueType.Bend)
        : undefined;
    const options =
      bend instanceof GuitarTechnique && bend.bendOptions !== null
        ? bend.bendOptions
        : undefined;
    const continuationPitch =
      note instanceof GuitarNote ? note.getBendContinuationPitch() : undefined;
    const continuationAtMaximum =
      continuationPitch !== undefined && continuationPitch >= MAX_BEND_PITCH;
    const defaultType = continuationAtMaximum ? BendType.Hold : BendType.Bend;
    const initialOptions =
      options ?? (continuationAtMaximum ? { type: defaultType } : undefined);

    this.bendSelectorManager.init(initialOptions, continuationPitch);
    this.templateRenderer.setSelectedBendType(options?.type ?? defaultType);
    this.template.removeButton.disabled = options === undefined;
    const continuationAvailable = continuationPitch !== undefined;
    this.template.bendTypesButtons[BendType.Hold].disabled =
      !continuationAvailable;
    this.template.bendTypesButtons[BendType.Release].disabled =
      !continuationAvailable;
    this.template.bendTypesButtons[BendType.Bend].disabled =
      continuationAtMaximum;
    this.template.bendTypesButtons[BendType.BendAndRelease].disabled =
      continuationAtMaximum;
    const isContinuationNote =
      note instanceof GuitarNote &&
      note.hasTechnique(GuitarTechniqueType.LetRing);
    for (const type of BEND_TYPE_BUTTON_ORDER) {
      const incompatibleTypes = BEND_TYPE_INCOMPATIBILITY[type];
      if (incompatibleTypes.includes(GuitarTechniqueType.LetRing)) {
        this.template.bendTypesButtons[type].disabled = isContinuationNote;
      }
    }
  }
}
