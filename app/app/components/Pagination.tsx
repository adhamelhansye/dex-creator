interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  showPageSizeSelector?: boolean;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = "items",
  showPageSizeSelector = true,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-light/10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Page Size Selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Show:</label>
            <select
              value={pageSize}
              onChange={e => {
                const newSize = parseInt(e.target.value);
                onPageSizeChange(newSize);
              }}
              className="bg-dark border border-light/20 rounded px-2 py-1 text-sm focus:border-primary-light outline-none"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400">per page</span>
          </div>
        )}

        {/* Pagination Info */}
        <div className="text-sm text-gray-400">
          Showing {startItem} to {endItem} of {totalItems} {itemName}
        </div>

        {/* Pagination Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 rounded border border-light/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light/10 disabled:hover:bg-transparent"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-2 py-1 rounded text-sm min-w-[32px] ${
                    currentPage === pageNum
                      ? "bg-primary-light text-dark"
                      : "border border-light/20 hover:bg-light/10"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <span className="text-sm text-gray-400 px-2">...</span>
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded border border-light/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light/10 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
