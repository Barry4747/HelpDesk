export interface User {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  role: string;
  department_id: string | null;
  is_temporary_password: boolean;
  is_active: boolean;
}

export interface UserCreateInput {
  login: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: "reporter" | "support";
  department_id?: string;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  role?: "reporter" | "support";
  department_id?: string;
  password?: string;
}
