/**
 * Here, `path` means a JSON-style location inside the serialized score
 * document, such as `$` or `$.tracks[0].instrument`
 */
export type SerializationPath = `$${string}`;

export const ROOT_SERIALIZATION_PATH: SerializationPath = "$";

export function propertyPath(
  path: SerializationPath,
  property: string
): SerializationPath {
  return `${path}.${property}`;
}

export function indexPath(
  path: SerializationPath,
  index: number
): SerializationPath {
  return `${path}[${index}]`;
}
