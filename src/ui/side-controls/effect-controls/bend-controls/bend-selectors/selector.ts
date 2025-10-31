import { GuitarEffect } from "@/notation";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";

export interface BendData {
  position: number;
  pitch: number;
}

/**
 * Bend selector interface
 */
export interface Selector {
  readonly bendGraphSVG: SVGSVGElement;
  readonly bendPath: SVGPathElement;
  readonly bendManagerOptions: BendSelectorManagerOptions;

  init(): void;
  getBendEffect(): GuitarEffect;
  dispose(): void;
}
