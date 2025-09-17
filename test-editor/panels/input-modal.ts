export class InputModal {
  private modal: HTMLElement;
  private titleElement: HTMLElement;
  private inputsContainer: HTMLElement;
  private confirmButton: HTMLElement;
  private cancelButton: HTMLElement;

  private confirmCallback: ((values: { [id: string]: string }) => void) | null = null;
  private keydownHandler: (event: KeyboardEvent) => void;

  constructor() {
    this.modal = document.getElementById("input-modal")!;
    this.titleElement = document.getElementById("input-modal-title")!;
    this.inputsContainer = document.getElementById("input-modal-inputs")!;
    this.confirmButton = document.getElementById("input-modal-confirm")!;
    this.cancelButton = document.getElementById("input-modal-cancel")!;

    this.confirmButton.addEventListener("click", () => this.confirm());
    this.cancelButton.addEventListener("click", () => this.hide());
    this.keydownHandler = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        this.confirm();
      }
      if (event.key === 'Escape') {
        this.hide();
      }
    };
  }

  show(
    title: string,
    inputs: { label: string; id: string; value: string }[],
    confirmCallback: (values: { [id: string]: string }) => void
  ) {
    this.titleElement.textContent = title;
    this.inputsContainer.innerHTML = "";
    inputs.forEach((input) => {
      const row = document.createElement("div");
      row.className = "input-row";
      const label = document.createElement("label");
      label.textContent = input.label;
      label.htmlFor = input.id;
      const inputElement = document.createElement("input");
      inputElement.id = input.id;
      inputElement.value = input.value;
      row.appendChild(label);
      row.appendChild(inputElement);
      this.inputsContainer.appendChild(row);
    });

    this.confirmCallback = confirmCallback;
    this.modal.style.display = "flex";
    this.modal.addEventListener('keydown', this.keydownHandler);
    const firstInput = this.inputsContainer.querySelector('input');
    if (firstInput) {
      firstInput.focus();
    }
  }

  hide() {
    this.modal.style.display = "none";
    this.confirmCallback = null;
    this.modal.removeEventListener('keydown', this.keydownHandler);
  }

  private confirm() {
    if (this.confirmCallback) {
      const values: { [id: string]: string } = {};
      const inputElements = this.inputsContainer.querySelectorAll("input");
      inputElements.forEach((input) => {
        values[input.id] = input.value;
      });
      this.confirmCallback(values);
    }
    this.hide();
  }
}