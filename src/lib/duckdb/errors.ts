export class DuckDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuckDBError";
  }
}

export class DuckDBConnectionError extends DuckDBError {
  constructor(
    message: string,
    public readonly operation?: string,
  ) {
    super(`Connection error${operation ? ` during ${operation}` : ""}: ${message}`);
    this.name = "DuckDBConnectionError";
  }
}

export class DuckDBQueryError extends DuckDBError {
  constructor(
    message: string,
    public readonly query?: string,
  ) {
    super(
      `Query error${query ? ` in query: ${query.substring(0, 100)}${query.length > 100 ? "..." : ""}` : ""}: ${message}`,
    );
    this.name = "DuckDBQueryError";
  }
}

export class DuckDBImportError extends DuckDBError {
  constructor(
    message: string,
    public readonly format?: string,
    public readonly fileName?: string,
  ) {
    super(
      `Import error${format ? ` for ${format} format` : ""}${fileName ? ` from ${fileName}` : ""}: ${message}`,
    );
    this.name = "DuckDBImportError";
  }
}

export class DuckDBExportError extends DuckDBError {
  constructor(
    message: string,
    public readonly format?: string,
    public readonly tableName?: string,
  ) {
    super(
      `Export error${format ? ` to ${format} format` : ""}${tableName ? ` from table ${tableName}` : ""}: ${message}`,
    );
    this.name = "DuckDBExportError";
  }
}
