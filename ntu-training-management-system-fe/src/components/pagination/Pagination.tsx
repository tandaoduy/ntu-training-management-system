import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import type { PaginationProps } from './types'
import { PAGE_SIZE_OPTIONS, getPageSizeLabel } from './utils'

// Keep these re-exports so direct imports from Pagination.tsx still work during Vite HMR.
// eslint-disable-next-line react-refresh/only-export-components
export { PAGE_SIZE_OPTIONS, getPageSizeLabel, getPageSizeNumber } from './utils'

const getPageItems = (page: number, totalPages: number, siblingCount: number) => {
  const pages: Array<number | 'ellipsis'> = []
  const start = Math.max(2, page - siblingCount)
  const end = Math.min(totalPages - 1, page + siblingCount)

  pages.push(1)

  if (start > 2) {
    pages.push('ellipsis')
  }

  for (let currentPage = start; currentPage <= end; currentPage += 1) {
    pages.push(currentPage)
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis')
  }

  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showPreviousNext = true,
  className = '',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  pageSizeLabel = 'Số dòng/trang',
}: PaginationProps) => {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)
  const pageItems = getPageItems(safePage, safeTotalPages, siblingCount)

  return (
    <div className={`flex flex-wrap items-center justify-end gap-3 text-sm ${className}`}>
      {pageSize !== undefined && onPageSizeChange && (
        <label className="flex items-center gap-2 font-medium text-gray-600">
          <span>{pageSizeLabel}</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 font-medium text-gray-700 outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {getPageSizeLabel(option)}
              </option>
            ))}
          </select>
        </label>
      )}

      <nav className="inline-flex items-center -space-x-px" aria-label="Phân trang">
        {showPreviousNext && (
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => onPageChange(safePage - 1)}
            className="flex h-9 items-center justify-center rounded-l-lg border border-gray-300 bg-white px-3 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Trang trước"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
        )}

        {pageItems.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center border border-gray-300 bg-white font-medium text-gray-500"
              >
                ...
              </span>
            )
          }

          return (
            <button
              key={item}
              type="button"
              aria-current={item === safePage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={`flex h-9 w-9 items-center justify-center border border-gray-300 font-medium ${
                item === safePage
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${!showPreviousNext && item === 1 ? 'rounded-l-lg' : ''} ${!showPreviousNext && item === safeTotalPages ? 'rounded-r-lg' : ''}`}
            >
              {item}
            </button>
          )
        })}

        {showPreviousNext && (
          <button
            type="button"
            disabled={safePage === safeTotalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="flex h-9 items-center justify-center rounded-r-lg border border-gray-300 bg-white px-3 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Trang sau"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        )}
      </nav>
    </div>
  )
}
