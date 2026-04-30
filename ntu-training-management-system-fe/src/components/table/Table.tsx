import type { TableColumn, TablePaginationProps, TableProps } from './types';

const checkboxClassName =
  'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';

const getRowId = <T,>(row: T, rowKey: TableProps<T>['rowKey']) => {
  if (typeof rowKey === 'function') {
    return rowKey(row);
  }

  return String(row[rowKey]);
};

const getCellValue = <T,>(row: T, column: TableColumn<T>) => {
  if (column.render) {
    return column.render(row);
  }

  return String(row[column.key as keyof T] ?? '');
};

export const Table = <T,>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedRows = [],
  onSelectedRowsChange,
  emptyText = 'Không có dữ liệu',
}: TableProps<T>) => {
  const rowIds = data.map((row) => getRowId(row, rowKey));
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedRows.includes(id));

  const handleToggleAll = () => {
    onSelectedRowsChange?.(allSelected ? [] : rowIds);
  };

  const handleToggleRow = (id: string) => {
    const nextSelectedRows = selectedRows.includes(id)
      ? selectedRows.filter((selectedId) => selectedId !== id)
      : [...selectedRows, id];

    onSelectedRowsChange?.(nextSelectedRows);
  };

  return (
    <div className="relative overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="border-b border-gray-200 bg-gray-50 text-sm text-gray-700">
          <tr>
            {selectable && (
              <th scope="col" className="w-4 p-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  className={checkboxClassName}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={String(column.key)} scope="col" className={`px-6 py-3 font-medium ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-10 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = getRowId(row, rowKey);

              return (
                <tr key={id} className="border-b border-gray-200 bg-white last:border-b-0 hover:bg-gray-50">
                  {selectable && (
                    <td className="w-4 p-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(id)}
                        onChange={() => handleToggleRow(id)}
                        className={checkboxClassName}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((column, columnIndex) => {
                    const content = getCellValue(row, column);

                    if (columnIndex === 0) {
                      return (
                        <th
                          key={String(column.key)}
                          scope="row"
                          className={`whitespace-nowrap px-6 py-4 font-medium text-gray-900 ${column.className ?? ''}`}
                        >
                          {content}
                        </th>
                      );
                    }

                    return (
                      <td key={String(column.key)} className={`px-6 py-4 ${column.className ?? ''}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const TablePagination = ({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="flex flex-col gap-3 rounded-b-lg border border-t-0 border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between" aria-label="Table navigation">
      <span className="text-sm font-normal text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{start}-{end}</span> trong{' '}
        <span className="font-semibold text-gray-900">{total}</span>
      </span>

      <ul className="flex -space-x-px text-sm">
        <li>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-9 items-center justify-center rounded-l-lg border border-gray-300 bg-white px-3 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
        </li>
        {pages.map((pageNumber) => (
          <li key={pageNumber}>
            <button
              type="button"
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-9 w-9 items-center justify-center border border-gray-300 font-medium ${
                pageNumber === page
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {pageNumber}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-9 items-center justify-center rounded-r-lg border border-gray-300 bg-white px-3 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </li>
      </ul>
    </nav>
  );
};
