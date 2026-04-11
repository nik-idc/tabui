import { NotationElement, TrackController } from "@/notation/controller";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import { ElementRenderer } from "@/notation/render/element-renderer";

export type ElementCtor<T extends NotationElement = NotationElement> = new (
  ...args: any[]
) => T;

export type RendererCtor<
  E extends NotationElement = NotationElement,
  R extends ElementRenderer = ElementRenderer,
> = new (trackController: TrackController, element: E, assetsPath: any) => R;
