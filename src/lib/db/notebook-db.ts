import Dexie, { Table } from "dexie";

export interface NotebookRecord {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CellRecord {
  id: string;
  index: number;
  notebookId: string;
  query: string;
  results: string | null; // Serialized Arrow Table
  error: string | null;
  isLoading: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSourceRecord {
  id: string;
  notebookId: string;
  name: string;
  type: "local" | "remote";
  path: string;
  fileData?: string; // Base64 encoded file data
  createdAt: Date;
  updatedAt: Date;
}

export class NotebookDatabase extends Dexie {
  notebooks!: Table<NotebookRecord>;
  cells!: Table<CellRecord>;
  dataSources!: Table<DataSourceRecord>;

  constructor() {
    super("NotebookDB");
    this.version(1).stores({
      notebooks: "id, name, createdAt, updatedAt",
      cells: "id, notebookId, createdAt, updatedAt",
      dataSources: "id, notebookId, createdAt, updatedAt",
    });
  }
}

export const db = new NotebookDatabase();
