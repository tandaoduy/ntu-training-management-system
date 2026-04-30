import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: keyof T | string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  selectable?: boolean;
  selectedRows?: string[];
  onSelectedRowsChange?: (selectedRows: string[]) => void;
  emptyText?: string;
}

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
