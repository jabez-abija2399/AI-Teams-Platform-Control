export interface DBQueryResult {
  query: string;
  explanation: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface DBSchema {
  tables: {
    name: string;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      isPrimaryKey: boolean;
    }[];
  }[];
}
