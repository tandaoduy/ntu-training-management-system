export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showPreviousNext?: boolean;
  className?: string;
  pageSize?: string;
  onPageSizeChange?: (pageSize: string) => void;
  pageSizeOptions?: readonly string[];
  pageSizeLabel?: string;
}
