export interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export interface DepartmentUpdateInput {
  name?: string;
  is_active?: boolean;
}
