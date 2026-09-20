import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getOverview, getWorkload } from "../api/stats";
import { getDepartments } from "../api/departments";
import type { StatsOverviewResponse, StatsWorkloadResponse, WorkloadItem } from "../types/stats";
import type { Department } from "../types/department";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  nowe: "Nowe",
  przyjete: "Przyjęte",
  zamkniete: "Zamknięte",
};

const PRIORITY_LABELS: Record<string, string> = {
  niski: "Niski",
  sredni: "Średni",
  wysoki: "Wysoki",
  krytyczny: "Krytyczny",
};

const COLORS = ["#3B4C9B", "#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#00BCD4"];

// Subcomponent for locally sortable table
function StatsTable({
  rows,
  labelKey,
  labelMap,
}: {
  rows: { label: string; count: number }[];
  labelKey?: string;
  labelMap?: Record<string, string>;
}) {
  const [sortCol, setSortCol] = useState<"label" | "count">("count");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  if (rows.length === 0) {
    return <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Brak danych.</div>;
  }

  const sortedRows = [...rows].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (sortCol === "label") {
      const strA = labelMap ? (labelMap[a.label] ?? a.label) : a.label;
      const strB = labelMap ? (labelMap[b.label] ?? b.label) : b.label;
      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    } else {
      return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    }
  });

  const handleSort = (col: "label" | "count") => {
    if (sortCol === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortOrder(col === "count" ? "desc" : "asc");
    }
  };

  const getSortIcon = (col: "label" | "count") => {
    if (sortCol !== col) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <table className="data-table" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th onClick={() => handleSort("label")} style={{ cursor: "pointer", userSelect: "none" }}>
            Nazwa <span style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}>{getSortIcon("label")}</span>
          </th>
          <th onClick={() => handleSort("count")} style={{ width: 100, textAlign: "right", cursor: "pointer", userSelect: "none" }}>
            Liczba <span style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}>{getSortIcon("count")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr key={row.label}>
            <td>{labelMap ? (labelMap[row.label] ?? row.label) : row.label}</td>
            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState<StatsOverviewResponse | null>(null);
  const [workload, setWorkload] = useState<StatsWorkloadResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const departmentIds = searchParams.get("department_ids") || "";
  const workloadStatuses = searchParams.get("workload_statuses") || "przyjete"; // default

  // Fetch departments for filter
  useEffect(() => {
    getDepartments({ page_size: 1000 }).then(res => setDepartments(res.items)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const overviewParams = {
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      department_ids: departmentIds || undefined,
    };
    
    const workloadParams = {
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      workload_statuses: workloadStatuses,
    };

    Promise.all([getOverview(overviewParams), getWorkload(workloadParams)])
      .then(([ov, wl]) => {
        setOverview(ov);
        setWorkload(wl);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, departmentIds, workloadStatuses]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleStatusToggle = (status: string) => {
    const current = workloadStatuses ? workloadStatuses.split(",") : [];
    if (current.includes(status)) {
      const next = current.filter(s => s !== status).join(",");
      updateFilters({ workload_statuses: next || null });
    } else {
      current.push(status);
      updateFilters({ workload_statuses: current.join(",") });
    }
  };

  const setAllStatuses = (selectAll: boolean) => {
    if (selectAll) {
      updateFilters({ workload_statuses: Object.keys(STATUS_LABELS).join(",") });
    } else {
      updateFilters({ workload_statuses: null });
    }
  };

  const handleDepartmentToggle = (deptId: string) => {
    const current = departmentIds ? departmentIds.split(",") : [];
    if (current.includes(deptId)) {
      const next = current.filter(id => id !== deptId).join(",");
      updateFilters({ department_ids: next || null });
    } else {
      current.push(deptId);
      updateFilters({ department_ids: current.join(",") });
    }
  };

  const setAllDepartments = (selectAll: boolean) => {
    if (selectAll && departments.length > 0) {
      updateFilters({ department_ids: departments.map(d => d.id).join(",") });
    } else {
      updateFilters({ department_ids: null });
    }
  };

  // Local sorting for workload
  const [wlSortCol, setWlSortCol] = useState<"name" | "count">("count");
  const [wlSortOrder, setWlSortOrder] = useState<"asc" | "desc">("desc");

  const sortedWorkload = useMemo(() => {
    if (!workload) return [];
    return [...workload.items].sort((a, b) => {
      if (wlSortCol === "name") {
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return wlSortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        return wlSortOrder === "asc" 
          ? a.active_ticket_count - b.active_ticket_count 
          : b.active_ticket_count - a.active_ticket_count;
      }
    });
  }, [workload, wlSortCol, wlSortOrder]);

  const handleWlSort = (col: "name" | "count") => {
    if (wlSortCol === col) {
      setWlSortOrder(wlSortOrder === "asc" ? "desc" : "asc");
    } else {
      setWlSortCol(col);
      setWlSortOrder(col === "count" ? "desc" : "asc");
    }
  };

  const getWlSortIcon = (col: "name" | "count") => {
    if (wlSortCol !== col) return "↕";
    return wlSortOrder === "asc" ? "↑" : "↓";
  };

  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Statystyki</h1>
          <p className="page-subtitle">Przegląd stanu zgłoszeń i obciążenia zespołu</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <span className="card-title">Filtry Obliczeń</span>
        </div>
        <div className="card-body" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          
          <div className="form-group" style={{ marginBottom: 0, minWidth: "180px" }}>
            <label className="form-label">Data od</label>
            <input 
              type="date" 
              className="form-control" 
              value={dateFrom}
              onChange={(e) => updateFilters({ date_from: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: "180px" }}>
            <label className="form-label">Data do</label>
            <input 
              type="date" 
              className="form-control" 
              value={dateTo}
              onChange={(e) => updateFilters({ date_to: e.target.value })}
            />
          </div>
        </div>

        <div className="card-body" style={{ display: "flex", gap: "24px", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
          
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Działy (dotyczy statystyk ogólnych)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => setAllDepartments(true)}>Zaznacz wszystko</button>
                <button type="button" className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => setAllDepartments(false)}>Odznacz wszystko</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", minHeight: "36px" }}>
              {departments.length === 0 ? (
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Brak działów w systemie.</span>
              ) : (
                departments.map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="checkbox"
                      id={`dept-${d.id}`}
                      checked={departmentIds.split(",").includes(d.id)}
                      onChange={() => handleDepartmentToggle(d.id)}
                    />
                    <label htmlFor={`dept-${d.id}`} style={{ fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                      {d.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Statusy (dotyczy obciążenia zespołu)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => setAllStatuses(true)}>Zaznacz wszystko</button>
                <button type="button" className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => setAllStatuses(false)}>Odznacz wszystko</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", minHeight: "36px" }}>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <div key={val} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="checkbox"
                    id={`status-${val}`}
                    checked={workloadStatuses.split(",").includes(val)}
                    onChange={() => handleStatusToggle(val)}
                  />
                  <label htmlFor={`status-${val}`} style={{ fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Trwa ładowanie statystyk...</div>
      ) : overview && workload ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Wg statusu */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Wg statusu</span>
              </div>
              <div className="card-body" style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <StatsTable
                    rows={overview.by_status.map((r) => ({ label: r.status, count: r.count }))}
                    labelMap={STATUS_LABELS}
                  />
                </div>
                <div style={{ width: "200px", height: "200px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.by_status.map((r) => ({ name: STATUS_LABELS[r.status] || r.status, value: r.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {overview.by_status.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Wg priorytetu */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Wg priorytetu</span>
              </div>
              <div className="card-body" style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <StatsTable
                    rows={overview.by_priority.map((r) => ({ label: r.priority, count: r.count }))}
                    labelMap={PRIORITY_LABELS}
                  />
                </div>
                <div style={{ width: "200px", height: "200px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.by_priority.map((r) => ({ name: PRIORITY_LABELS[r.priority] || r.priority, value: r.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {overview.by_priority.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Wg kategorii */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Wg kategorii</span>
              </div>
              <div className="card-body">
                <StatsTable
                  rows={overview.by_category.map((r) => ({ label: r.category_name, count: r.count }))}
                />
              </div>
            </div>

            {/* Obciążenie zespołu */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Obciążenie zespołu</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {sortedWorkload.length === 0 ? (
                  <div style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Brak aktywnych pracowników lub brak zgłoszeń dla wybranych statusów.
                  </div>
                ) : (
                  <>
                    <table className="data-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th onClick={() => handleWlSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Imię i nazwisko <span style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}>{getWlSortIcon("name")}</span>
                          </th>
                          <th onClick={() => handleWlSort("count")} style={{ width: 180, textAlign: "right", cursor: "pointer", userSelect: "none" }}>
                            Aktywne zgłoszenia <span style={{ color: "var(--color-text-secondary)", fontSize: "10px" }}>{getWlSortIcon("count")}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedWorkload.map((item) => (
                          <tr key={item.user_id}>
                            <td>{item.first_name} {item.last_name}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                              {item.active_ticket_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div style={{ height: "200px", padding: "16px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={sortedWorkload.map(item => ({
                            name: `${item.first_name} ${item.last_name}`,
                            value: item.active_ticket_count
                          }))}
                          margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
