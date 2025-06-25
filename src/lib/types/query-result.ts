import * as arrow from "apache-arrow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T extends arrow.TypeMap = any> = {
  query: string;
  table: arrow.Table<T>;
  duration: number;
};
