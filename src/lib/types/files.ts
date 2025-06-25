import * as arrow from "apache-arrow";

export type FileFormat = "csv" | "json" | "parquet" | "excel";

export interface ImportOptions {
  tableName: string;
  format: FileFormat;
  // CSV specific options
  delimiter?: string;
  header?: boolean;
  autoDetect?: boolean;
  sampleSize?: number;
  // JSON specific options
  jsonFormat?: "auto" | "newline_delimited" | "records";
  // Parquet specific options
  compression?: string;
  // Arrow specific options
  arrowSchema?: arrow.Schema;
}

export const fileFormats: { value: FileFormat; label: string; extensions: string[] }[] = [
  { value: "csv", label: "CSV", extensions: [".csv"] },
  { value: "json", label: "JSON", extensions: [".json"] },
  { value: "parquet", label: "Parquet", extensions: [".parquet", ".pq"] },
];
