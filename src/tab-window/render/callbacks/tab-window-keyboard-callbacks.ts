import { GuitarEffectOptions } from "../../../models/index";
import { GuitarEffectType } from "../../../models/index";

export abstract class TabWindowKeyboardCallbacks {
  public abstract ctrlCEvent(event: KeyboardEvent): void;
  public abstract ctrlVEvent(event: KeyboardEvent): void;
  public abstract ctrlZEvent(event: KeyboardEvent): void;
  public abstract ctrlYEvent(event: KeyboardEvent): void;
  public abstract deleteEvent(event: KeyboardEvent): void;
  public abstract applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void;
  public abstract shiftVEvent(event: KeyboardEvent): void;
  public abstract shiftPEvent(event: KeyboardEvent): void;
  public abstract shiftBEvent(event: KeyboardEvent): void;
  public abstract spaceEvent(event: KeyboardEvent): void;
  public abstract onNumberDown(key: string): void;
  public abstract onArrowDown(key: string): void;
  public abstract onBackspacePress(): void;
  public abstract onCtrlDel(): void;
  public abstract onKeyDown(event: KeyboardEvent): void;
}
