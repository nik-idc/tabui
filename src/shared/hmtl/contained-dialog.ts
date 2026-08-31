const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type DialogAPI = Pick<
  HTMLDialogElement,
  "close" | "open" | "requestClose" | "returnValue" | "show" | "showModal"
>;

interface DialogHostState {
  modalCount: number;
  inertStates: Map<HTMLElement, boolean>;
  previousFocus?: HTMLElement;
}

const DIALOG_HOST_STATES = new WeakMap<HTMLDivElement, DialogHostState>();

/** A div element with the same dialog-specific API as HTMLDialogElement. */
export type ContainedDialogElement = HTMLDivElement & DialogAPI;

/** Implements dialog behavior without using the browser's document top layer. */
export class ContainedDialogBehavior {
  private readonly _element: HTMLDivElement;
  private readonly _dialogHost: HTMLDivElement;
  private _previousFocus?: HTMLElement;
  private _returnValue = "";
  private _modal = false;

  private constructor(element: HTMLDivElement, dialogHost: HTMLDivElement) {
    this._element = element;
    this._dialogHost = dialogHost;
    this._element.classList.add("tu-dialog");
    this._element.setAttribute("role", "dialog");
    this._element.tabIndex = -1;
    this._element.addEventListener("keydown", (event) => this.onKeydown(event));
  }

  /** Creates a div-backed element with the native dialog API. */
  static create(dialogHost: HTMLDivElement): ContainedDialogElement {
    const behavior = new ContainedDialogBehavior(
      document.createElement("div"),
      dialogHost
    );
    const element = behavior._element;
    dialogHost.appendChild(element);

    Object.defineProperties(element, {
      close: { value: (value?: string) => behavior.close(value) },
      open: {
        get: () => element.hasAttribute("open"),
        set: (open: boolean) => behavior.setOpen(open),
      },
      requestClose: {
        value: (value?: string) => behavior.requestClose(value),
      },
      returnValue: {
        get: () => behavior._returnValue,
        set: (value: string) => {
          behavior._returnValue = `${value}`;
        },
      },
      show: { value: () => behavior.show(false) },
      showModal: { value: () => behavior.show(true) },
    });

    return element as ContainedDialogElement;
  }

  private setSiblingsInert(scope: HTMLElement): void {
    const currentState = DIALOG_HOST_STATES.get(this._dialogHost);
    if (currentState !== undefined) {
      currentState.modalCount += 1;
      return;
    }

    const inertStates = new Map<HTMLElement, boolean>();
    for (const child of scope.children) {
      if (!(child instanceof HTMLElement) || child === this._dialogHost) {
        continue;
      }
      inertStates.set(child, child.inert);
      child.inert = true;
    }
    DIALOG_HOST_STATES.set(this._dialogHost, {
      modalCount: 1,
      inertStates,
      previousFocus: this._previousFocus,
    });
  }

  private restoreSiblingsInert(): void {
    const state = DIALOG_HOST_STATES.get(this._dialogHost);
    if (state === undefined) {
      return;
    }
    state.modalCount -= 1;
    if (state.modalCount > 0) {
      return;
    }

    for (const [element, inert] of state.inertStates) {
      element.inert = inert;
    }
    DIALOG_HOST_STATES.delete(this._dialogHost);
    state.previousFocus?.focus();
  }

  private focusInitialElement(): void {
    const focusable = this.getFocusableElements();
    const autofocus = focusable.find((e) => e.hasAttribute("autofocus"));
    (autofocus ?? focusable[0] ?? this._element).focus();
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

  private show(modal: boolean): void {
    if (this._element.hasAttribute("open")) {
      if (this._modal !== modal) {
        throw new DOMException(
          "The dialog is already open in a different mode.",
          "InvalidStateError"
        );
      }

      return;
    }

    if (modal) {
      const scope = this._dialogHost.parentElement;
      if (scope === null || !this._dialogHost.isConnected) {
        throw new DOMException(
          "The dialog host must be connected.",
          "InvalidStateError"
        );
      }
      const activeElement = document.activeElement;
      this._previousFocus =
        activeElement instanceof HTMLElement ? activeElement : undefined;
      this._modal = true;
      this._element.dataset.tuDialogMode = "modal";
      this._element.setAttribute("open", "");
      this._element.setAttribute("aria-modal", "true");
      this.setSiblingsInert(scope);
    } else {
      const activeElement = document.activeElement;
      this._previousFocus =
        activeElement instanceof HTMLElement ? activeElement : undefined;
      this._modal = false;
      this._element.dataset.tuDialogMode = "nonmodal";
      this._element.setAttribute("open", "");
    }
    this.focusInitialElement();
  }

  private setOpen(open: boolean): void {
    if (open) {
      this.show(false);
    } else {
      this.hide(false);
    }
  }

  private hide(dispatchClose: boolean): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }

    this._element.removeAttribute("open");
    this._element.removeAttribute("aria-modal");
    delete this._element.dataset.tuDialogMode;
    if (this._modal) {
      this.restoreSiblingsInert();
    } else {
      this._previousFocus?.focus();
    }
    this._modal = false;
    this._previousFocus = undefined;
    if (dispatchClose) {
      this._element.dispatchEvent(new Event("close"));
    }
  }

  private close(returnValue?: string): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }
    if (returnValue !== undefined) {
      this._returnValue = `${returnValue}`;
    }
    this.hide(true);
  }

  private requestClose(returnValue?: string): void {
    if (!this._element.hasAttribute("open")) {
      return;
    }

    const cancelEvent = new Event("cancel", { cancelable: true });
    if (this._element.dispatchEvent(cancelEvent)) {
      this.close(returnValue);
    }
  }
}
