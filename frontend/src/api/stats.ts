import { apiFetch } from "./client";
import type { 
  StatsOverviewResponse, 
  StatsWorkloadResponse, 
  StatsOverviewFilterParams, 
  StatsWorkloadFilterParams 
} from "../types/stats";

const BASE = "/api/v1/stats";

function buildQs(params: any): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function getOverview(params?: StatsOverviewFilterParams): Promise<StatsOverviewResponse> {
  const res = await apiFetch(`${BASE}/overview${buildQs(params)}`);
  if (!res.ok) throw new Error("Błąd pobierania statystyk");
  return res.json();
}

export async function getWorkload(params?: StatsWorkloadFilterParams): Promise<StatsWorkloadResponse> {
  const res = await apiFetch(`${BASE}/workload${buildQs(params)}`);
  if (!res.ok) throw new Error("Błąd pobierania obciążenia zespołu");
  return res.json();
}
