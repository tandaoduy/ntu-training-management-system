export const PAGE_SIZE_OPTIONS = ['5', '10', '20', '50', '100', '500', 'all'] as const

export const getPageSizeNumber = (pageSize: string, totalItems: number) => (
  pageSize === 'all' ? Math.max(1, totalItems) : Number(pageSize) || 10
)

export const getPageSizeLabel = (pageSize: string) => (
  pageSize === 'all' ? 'Tất cả' : pageSize
)
