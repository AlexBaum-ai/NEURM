/**
 * Pagination utilities
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const calculatePagination = (page: number = 1, limit: number = 10) => {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  const skip = (validPage - 1) * validLimit;
  const take = validLimit;

  return { skip, take, page: validPage, limit: validLimit };
};

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const paginate = <T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> => {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
};
