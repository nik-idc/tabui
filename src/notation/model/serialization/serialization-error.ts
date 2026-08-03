export class ScoreSerializationError extends Error {
  public readonly path: string;

  constructor(path: string, message: string, options?: ErrorOptions) {
    super(`${path}: ${message}`, options);
    this.name = "ScoreSerializationError";
    this.path = path;
  }
}
