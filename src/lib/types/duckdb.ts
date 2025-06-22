export class DuckDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuckDBError";
  }
}
