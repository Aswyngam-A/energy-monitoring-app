// The shape the backend uses for every paginated list (decided in M7): one slice of the items
// plus what is needed to draw page controls. `page` is 0-based; `total` counts the matching items
// over ALL pages (it respects the filters), so the number of pages is ceil(total / size).
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}
