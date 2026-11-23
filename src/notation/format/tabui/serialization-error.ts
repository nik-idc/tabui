/**
 * Reports invalid serialized score data at a JSON-style document path.
 *
 * The optional `cause` preserves an error thrown by a model operation while
 * the error message adds serialization context.
 */
export class ScoreSerializationError extends Error {
  /** JSON-style document location, using zero-based array indexes from the $ root. */
  public readonly path: string;

  /**
   * Creates an error with a message prefixed by its document path.
   * @param path JSON-style location, such as $.tracks[0].staves[0].bars[1].
   * @param message Failure description without the path prefix.
   * @param options Optional cause from the failing model operation.
   */
  constructor(path: string, message: string, options?: ErrorOptions) {
    super(`${path}: ${message}`, options);
    this.name = "ScoreSerializationError";
    this.path = path;
  }
}
