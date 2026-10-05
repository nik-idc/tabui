import { NotationElement, TrackController } from "../controller";
import type { ResolvedAssetConfig } from "../../config/asset-url-resolver";

export interface ElementRenderer {
  readonly trackController: TrackController;

  /**
   * Returns the persistent container group for this renderer.
   * Root renderer owns mounting/unmounting of this group.
   */
  ensureContainerGroup(): SVGGElement;

  /**
   * Detaches the renderer container from whatever parent currently owns it.
   * Root renderer calls this during lifecycle reconciliation.
   */
  detachContainerGroup(): void;

  /**
   * Updates the element object backing this renderer's stable identity.
   * Renderers are reused by stable identity, while element objects can be
   * recreated during viewport rematerialization or element tree updates.
   */
  updateElementReference(element: NotationElement): void;

  render(): void;

  unrender(): void;
}

/** Constructor shared by renderers, retaining the supported element type. */
export type ElementRendererClass<E extends NotationElement> = new (
  trackController: TrackController,
  element: E,
  assetsPath: ResolvedAssetConfig
) => ElementRenderer;
