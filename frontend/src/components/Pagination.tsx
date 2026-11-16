interface PaginationProps {
  /** Current page, 0-based (as in the API). */
  page: number;
  /** Items per page, as reported by the server. */
  size: number;
  /** Number of matching items over all pages. */
  total: number;
  /** Called with the 0-based number of the page the user asked for. */
  onPageChange: (page: number) => void;
}

/**
 * Previous / "Page X of Y" / Next, shared by every paginated list. The API counts pages from 0,
 * people count from 1, so the text adds one. Shows nothing when everything fits on a single page.
 */
export default function Pagination({ page, size, total, onPageChange }: PaginationProps) {
  const pageCount = Math.ceil(total / size);
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination">
      <button disabled={page <= 0} onClick={() => { onPageChange(page - 1); }}>Previous page</button>
      <span>Page {page + 1} of {pageCount}</span>
      <button disabled={page >= pageCount - 1} onClick={() => { onPageChange(page + 1); }}>Next page</button>
    </nav>
  );
}
