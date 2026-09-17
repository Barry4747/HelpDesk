export interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

export interface CategoryUpdateInput {
  name?: string;
  is_active?: boolean;
}
