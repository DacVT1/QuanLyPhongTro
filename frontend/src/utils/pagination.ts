export function getRowNumber(
  index: number,
  currentPage: number,
  pageSize: number,
): number {
  return (currentPage - 1) * pageSize + index + 1;
}
