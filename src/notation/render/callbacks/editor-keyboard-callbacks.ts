import { TabController } from "@/notation/element";
import { GuitarEffectType, GuitarEffectOptions } from "@/notation/model";
import { EditorRenderer } from "../editor-renderer";
import { ElementRenderer } from "../element-renderer";

export interface EditorKeyboardCallbacks {
  readonly renderer: EditorRenderer;
  readonly controller: TabController;
  readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  ctrlCEvent(event: KeyboardEvent): void;
  ctrlVEvent(event: KeyboardEvent): void;
  ctrlZEvent(event: KeyboardEvent): void;
  ctrlYEvent(event: KeyboardEvent): void;
  deleteEvent(event: KeyboardEvent): void;
  applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void;
  shiftVEvent(event: KeyboardEvent): void;
  shiftPEvent(event: KeyboardEvent): void;
  shiftBEvent(event: KeyboardEvent): void;
  spaceEvent(event: KeyboardEvent): void;
  onNumberDown(key: string): void;
  onArrowDown(key: string): void;
  onBackspacePress(): void;
  onCtrlDel(): void;
  onKeyDown(event: KeyboardEvent): void;
}
