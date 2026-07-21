export type Nullable<T> = T | null;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  fieldErrors?: Record<string, string[]>;
}

export type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };
