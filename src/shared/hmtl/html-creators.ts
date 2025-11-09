let count = 0;

export function createDiv(): HTMLDivElement {
  const div = document.createElement("div");
  div.dataset["count"] = `${count}`;
  count++;
  return div;
}

export function createImage(): HTMLImageElement {
  return document.createElement("img");
}

export function createLabel(): HTMLLabelElement {
  return document.createElement("label");
}

export function createSelect(): HTMLSelectElement {
  return document.createElement("select");
}

export function createHR(): HTMLHRElement {
  return document.createElement("hr");
}

export function createUL(): HTMLUListElement {
  return document.createElement("ul");
}

export function createLI(): HTMLLIElement {
  return document.createElement("li");
}

export function createButton(): HTMLButtonElement {
  return document.createElement("button");
}

export function createH3(): HTMLHeadingElement {
  return document.createElement("h3");
}

export function createSVG(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}

export function createDialog(): HTMLDialogElement {
  return document.createElement("dialog");
}

export function createOption(): HTMLOptionElement {
  return document.createElement("option");
}

export function createInput(): HTMLInputElement {
  return document.createElement("input");
}

export function createParagraph(): HTMLParagraphElement {
  return document.createElement("p");
}

export function createScript(): HTMLScriptElement {
  return document.createElement("script");
}
