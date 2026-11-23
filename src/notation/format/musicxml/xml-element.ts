/** A minimal XML element tree for writing MusicXML. */
export type XmlElement = {
  name: string;
  attributes: Record<string, string | number>;
  children: XmlElement[];
  text?: string;
};

/** Creates an element with attributes and child elements. */
export function element(
  name: string,
  attributes: Record<string, string | number | undefined> = {},
  children: (XmlElement | undefined)[] = []
): XmlElement {
  const defined: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      defined[key] = value;
    }
  }
  return {
    name,
    attributes: defined,
    children: children.filter(
      (child): child is XmlElement => child !== undefined
    ),
  };
}

/** Creates an element that holds only text. */
export function textElement(
  name: string,
  text: string | number,
  attributes: Record<string, string | number | undefined> = {}
): XmlElement {
  return { ...element(name, attributes), text: String(text) };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Writes an element tree as indented XML text. */
export function writeXml(root: XmlElement, indent = ""): string {
  const attributes = Object.entries(root.attributes)
    .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
    .join("");
  const open = `${indent}<${root.name}${attributes}`;
  if (root.text !== undefined) {
    return `${open}>${escapeXml(root.text)}</${root.name}>`;
  }
  if (root.children.length === 0) {
    return `${open}/>`;
  }
  const children = root.children
    .map((child) => writeXml(child, `${indent}  `))
    .join("\n");
  return `${open}>\n${children}\n${indent}</${root.name}>`;
}
