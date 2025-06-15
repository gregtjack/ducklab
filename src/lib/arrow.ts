import * as arrow from "apache-arrow";

// Serialize Arrow table
export function serialize(table: arrow.Table): string {
  const buffer = arrow.tableToIPC(table);
  return Buffer.from(buffer).toString("base64");
}

// Deserialize Arrow table
export function deserialize(data: string): arrow.Table {
  const buffer = Buffer.from(data, "base64");
  return arrow.tableFromIPC(buffer);
}
