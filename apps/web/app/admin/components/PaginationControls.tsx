import type { Pagination } from "../types";

type PaginationControlsProps = {
  pagination: Pagination;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  return (
    <div className="pagination-row">
      <button
        type="button"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {pagination.page} of {pagination.totalPages} - {pagination.totalItems} records
      </span>
      <button
        type="button"
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  );
}
