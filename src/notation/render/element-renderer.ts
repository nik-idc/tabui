import { TrackController } from "../controller";

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

  render(...params: any): void;

  unrender(): void;
}

export type ElementRendererClass = new (...args: any[]) => ElementRenderer;
