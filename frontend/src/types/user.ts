export interface User {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  role: string;
  department_id: string | null;
  is_active: boolean;
}
