import { DialogEnforcer } from "./dialog-enforcer";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Implements dialog behavior without using the browser's document top layer. */
export class ContainedDialog {
  private readonly _element: HTMLDivElement;
  private _previousFocus?: HTMLElement;
  returnValue = "";
  private _modal = false;

  /** Attaches behavior to a template-owned container and mounts it once. */
  constructor(
    element: HTMLDivElement,
    private readonly _enforcer: DialogEnforcer
  ) {
    this._element = element;
    this._element.classList.add("tu-dialog");
    this._element.setAttribute("role", "dialog");
    this._element.tabIndex = -1;
    this._element.addEventListener("keydown", (event) => this.onKeydown(event));
    this._enforcer.dialogHost.appendChild(element);
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      this._element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(
      (e) => e.getClientRects().length > 0 && e.closest("[inert]") === null
    );
  }

  private onTabDown(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this._element.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusInitialElement(): void {
    const focusable = this.getFocusableElements();
    const autofocus = focusable.find((e) => e.hasAttribute("autofocus"));
    (autofocus ?? focusable[0] ?? this._element).focus();
  }

  /** Validates ownership, then opens, mounts the announcer, and focuses. */
  private showInMode(modal: boolean): void {
    if (this._element.hasAttribute("open")) {
      if (this._modal !== modal) {
        throw new DOMException(
          "The dialog is already open in a different mode.",
          "InvalidStateError"
        );
      }

      return;
    }

    this._enforcer.claim(this, modal);
    const activeElement = document.activeElement;
    this._previousFocus =
      activeElement instanceof HTMLElement ? activeElement : undefined;
    this._modal = modal;
    this._element.dataset.tuDialogMode = modal ? "modal" : "nonmodal";
    this._element.setAttribute("open", "");
    if (modal) {
      this._element.setAttribute("aria-modal", "true");
    }
    this._enforcer.activate(this._element, modal);
    this.focusInitialElement();
  }

  /** Opens without making the editor's other controls inert. */
  public show(): void {
    this.showInMode(false);
  }

  /** Opens with editor-local inert siblings and keyboard focus containment. */
  public showModal(): void {
    this.showInMode(true);
  }

  /** Reports whether this dialog is visible. */
  public get open(): boolean {
    return this._element.hasAttribute("open");
  }

  private hide(dispatchClose: boolean): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }

    this._element.removeAttribute("open");
    this._element.removeAttribute("aria-modal");
    delete this._element.dataset.tuDialogMode;
    this._modal = false;
    const previousFocus = this._previousFocus;
    this._previousFocus = undefined;
    this._enforcer.release();
    previousFocus?.focus();
    if (dispatchClose) {
      this._element.dispatchEvent(new Event("close"));
    }
  }

  /** Closes, optionally records a result, and dispatches the close event. */
  public close(returnValue?: string): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.hide(true);
  }

  /** Requests cancellation; a prevented cancel retains active ownership. */
  public requestClose(returnValue?: string): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }

    const cancelEvent = new Event("cancel", { cancelable: true });
    if (this._element.dispatchEvent(cancelEvent)) {
      this.close(returnValue);
    }
  }

  private onKeydown(event: KeyboardEvent): void {
    if (!this._modal) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.requestClose();
      return;
    }
    if (event.key === "Tab") {
      this.onTabDown(event);
      return;
    }
  }

  /** Opens modelessly or hides without dispatching a close event. */
  public set open(open: boolean) {
    if (open) {
      this.show();
    } else {
      this.hide(false);
    }
  }
}
