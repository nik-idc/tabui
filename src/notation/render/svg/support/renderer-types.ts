import type { ResolvedAssetConfig } from "../../../../config/asset-url-resolver";
import { NotationElement, TrackController } from "../../../controller";
import { ElementRenderer } from "../../element-renderer";

export type ElementCtor<T extends NotationElement = NotationElement> = new (
  ...args: never[]
) => T;

export type RendererCtor<
  E extends NotationElement = NotationElement,
  R extends ElementRenderer = ElementRenderer,
> = new (
  trackController: TrackController,
  element: E,
  assetsPath: ResolvedAssetConfig
) => R;
