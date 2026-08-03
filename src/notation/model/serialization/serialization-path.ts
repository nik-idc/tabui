/**
 * A JSON-style location inside a serialized score, such as
 * `$.tracks[0].instrument`; it is not a filesystem path.
 */
export type SerializationPath = `$${string}`;

/** The path of the complete serialized score document. */
export const ROOT_SERIALIZATION_PATH: SerializationPath = "$";

/** Returns the JSON-style path of an object's named property. */
export function propertyPath(
  path: SerializationPath,
  property: string
): SerializationPath {
  return `${path}.${property}`;
}

/** Returns the JSON-style path of an array item. */
export function indexPath(
  path: SerializationPath,
  index: number
): SerializationPath {
  return `${path}[${index}]`;
}
