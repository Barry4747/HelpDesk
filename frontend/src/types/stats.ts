export interface StatusCount {
  status: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface CategoryCount {
  category_id: string | null;
  category_name: string;
  count: number;
}

export interface StatsOverviewResponse {
  by_status: StatusCount[];
  by_priority: PriorityCount[];
  by_category: CategoryCount[];
}

export interface WorkloadItem {
  user_id: string;
  first_name: string;
  last_name: string;
  active_ticket_count: number;
}

export interface StatsWorkloadResponse {
  items: WorkloadItem[];
}

export interface StatsOverviewFilterParams {
  department_ids?: string;
  date_from?: string;
  date_to?: string;
}

export interface StatsWorkloadFilterParams {
  date_from?: string;
  date_to?: string;
  workload_statuses?: string;
}
