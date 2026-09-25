export interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

export interface CategoryFilterParams {
  is_active?: boolean | string;
  search?: string;
  sort_by?: "name" | "created_at";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface PaginatedCategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
}
