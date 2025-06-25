import { QueryResult } from "./query-result";

export interface Cell {
  id: string;
  index: number;
  query: string;
  results: QueryResult | null;
  error: string | null;
  isLoading: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  icon: string;
  cells: Cell[];
  lastOpened: Date;
  createdAt: Date;
  updatedAt: Date;
}
