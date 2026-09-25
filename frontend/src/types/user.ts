export interface User {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  role: "admin" | "support" | "reporter";
  department_id: string | null;
  is_active: boolean;
  is_temporary_password?: boolean;
}

export interface UserFilterParams {
  role?: string;
  department_id?: string;
  is_active?: boolean | string;
  search?: string;
  sort_by?: "login" | "first_name" | "last_name" | "created_at" | "role";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}
