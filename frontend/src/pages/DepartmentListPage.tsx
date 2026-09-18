import { useEffect, useState } from "react";
import { createDepartment, getDepartments, updateDepartment } from "../api/departments";
import { SimpleDictionaryList } from "../components/SimpleDictionaryList";
import type { Department } from "../types/department";

export function DepartmentListPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDepartments();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (name: string) => {
    const newItem = await createDepartment(name);
    setItems((prev) => [...prev, newItem]);
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const updated = await updateDepartment(id, { is_active: !currentValue });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const handleRename = async (id: string, newName: string) => {
    const updated = await updateDepartment(id, { name: newName });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <SimpleDictionaryList
      title="Działy"
      items={items}
      onCreate={handleCreate}
      onToggleActive={handleToggleActive}
      onRename={handleRename}
    />
  );
}
