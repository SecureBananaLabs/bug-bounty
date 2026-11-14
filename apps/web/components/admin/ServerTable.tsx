"use client";
import { useState, useEffect } from "react";
import type { PaginatedResult } from "../../lib/api";

/**
 * Server-side paginated data table.
 *
 * - Never fetches the full table client-side: pages are requested via `fetchPage`.
 * - Accessible: keyboard-navigable, ARIA labels on controls, proper table semantics.
 * - Handles loading, empty, and error states.
 */
export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface ServerTableProps<T> {
  columns: Column<T>[];
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResult<T>>;
  initialPageSize?: number;
  /** Extra controls rendered above the table (search, filters). */
  toolbar?: React.ReactNode;
  pageSizeOptions?: number[];
}

export function ServerTable<T>({
  columns,
  fetchPage,
  initialPageSize = 10,
  toolbar,
  pageSizeOptions = [5, 10, 20, 50],
}: ServerTableProps<T>) {
  const [data, setData] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const load = async (pageNum: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(pageNum, size);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load whenever page or pageSize changes.
  useEffect(() => {
    load(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const refresh = () => load(page, pageSize);
  const goToPage = (p: number) => {
    if (data) setPage(Math.max(1, Math.min(p, data.totalPages)));
    else setPage(Math.max(1, p));
  };
  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const hasNextPage = data ? data.hasNext : false;
  const hasPrevPage = data ? data.hasPrev : false;
  const totalPages = data ? data.totalPages : 0;
  const total = data ? data.total : 0;

  const pageNumbers: number[] = [];
  if (data) {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
  }

  return (
    <div className="server-table">
      {toolbar && <div className="toolbar">{toolbar}</div>}

      {error && (
        <div className="card" role="alert" aria-label="Error">
          <p>Error: {error}</p>
          <button onClick={refresh} aria-label="Retry">
            Retry
          </button>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card" aria-label="No data">
          <p>No data available.</p>
        </div>
      )}

      {loading && (
        <div className="card" aria-label="Loading" aria-busy="true">
          <p>Loading…</p>
        </div>
      )}

      {data && data.items.length === 0 && !loading && (
        <div className="card" aria-label="Empty state">
          <p>No records match your filters.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <table role="table" aria-label="Data table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={String(col.key)} className={col.className}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className={col.className}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination" role="navigation" aria-label="Pagination">
            <button
              onClick={() => goToPage(1)}
              disabled={!hasPrevPage}
              aria-label="First page"
            >
              ««
            </button>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!hasPrevPage}
              aria-label="Previous page"
            >
              ‹
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasNextPage}
              aria-label="Next page"
            >
              ›
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={!hasNextPage}
              aria-label="Last page"
            >
              »»
            </button>
            <span aria-label={`Page ${page} of ${totalPages}`}>
              Page {page} of {totalPages}
            </span>
            <span aria-label={`${total} total results`}>{total} results</span>
            <label>
              Page size:
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                aria-label="Page size"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
