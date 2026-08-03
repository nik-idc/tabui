/**
 * Reports invalid serialized score data at a JSON-style document path.
 *
 * The optional `cause` preserves an error thrown by a model operation while
 * the error message adds serialization context.
 */
export class ScoreSerializationError extends Error {
  public readonly path: string;

  /** Creates an error whose message is prefixed with its document path. */
  constructor(path: string, message: string, options?: ErrorOptions) {
    super(`${path}: ${message}`, options);
    this.name = "ScoreSerializationError";
    this.path = path;
  }
}
