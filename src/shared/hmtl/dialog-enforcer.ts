import type { ContainedDialog } from "./contained-dialog";

/** Enforces one open dialog and owns modal effects within one editor. */
export class DialogEnforcer {
  activeDialog?: ContainedDialog;
  private readonly _inertStates = new Map<HTMLElement, boolean>();

  /** Uses the shell's host and its single announcement region. */
  constructor(
    readonly dialogHost: HTMLDivElement,
    private readonly _mountAnnouncer: (container: HTMLElement) => void
  ) {}

  /** Claims ownership before any visible, focus, or announcer changes. */
  public claim(dialog: ContainedDialog, modal: boolean): void {
    if (this.activeDialog !== undefined) {
      throw new DOMException(
        "Another dialog is already open in this editor's dialog host.",
        "InvalidStateError"
      );
    }

    const disconnected =
      this.dialogHost.parentElement === null || !this.dialogHost.isConnected;
    if (modal && disconnected) {
      throw new DOMException(
        "The dialog host must be connected.",
        "InvalidStateError"
      );
    }

    this.activeDialog = dialog;
  }

  /** Mounts the announcer after opening and preserves original inert states. */
  public activate(container: HTMLDivElement, modal: boolean): void {
    this._mountAnnouncer(container);
    if (!modal) {
      return;
    }

    for (const child of this.dialogHost.parentElement!.children) {
      if (!(child instanceof HTMLElement) || child === this.dialogHost) {
        continue;
      }

      this._inertStates.set(child, child.inert);
      child.inert = true;
    }
  }

  /** Restores editor state and announcer placement before focus restoration. */
  public release(): void {
    for (const [element, inert] of this._inertStates) {
      element.inert = inert;
    }
    this._inertStates.clear();
    this.activeDialog = undefined;
    this._mountAnnouncer(this.dialogHost.parentElement!);
  }
}
