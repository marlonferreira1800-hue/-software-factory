import { PaginatedMeta, PaginatedResult } from '@software-factory/shared';

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginatedMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, pageSize),
  };
}
