export function createDiv(): HTMLDivElement {
  return document.createElement("div");
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

export function createScript(): HTMLScriptElement {
  return document.createElement("script");
}
