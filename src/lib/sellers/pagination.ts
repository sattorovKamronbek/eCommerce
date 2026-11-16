const pageSize = 50;

export function sellerPageRange(page: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize };
}

export function sellerPageResults<T>(rows: T[]) {
  return { rows: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}
