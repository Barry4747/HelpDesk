import { useEffect, useState } from "react";
import { createCategory, getCategories, updateCategory } from "../api/categories";
import { SimpleDictionaryList } from "../components/SimpleDictionaryList";
import type { Category } from "../types/category";

export function CategoryListPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getCategories();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (name: string) => {
    const newItem = await createCategory(name);
    setItems((prev) => [...prev, newItem]);
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const updated = await updateCategory(id, { is_active: !currentValue });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const handleRename = async (id: string, newName: string) => {
    const updated = await updateCategory(id, { name: newName });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <SimpleDictionaryList
      title="Kategorie"
      items={items}
      onCreate={handleCreate}
      onToggleActive={handleToggleActive}
      onRename={handleRename}
    />
  );
}
