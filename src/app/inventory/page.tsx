"use client";

import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/MainLayout";
import { Package, Plus, Edit2, Trash2, AlertTriangle, Search, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: string;
  minQuantity: string;
  costPrice: string;
  salePrice: string;
  openingStock: string;
  openingCostPrice: string;
}

const emptyForm = {
  name: "",
  unit: "قطعة",
  minQuantity: "5",
  costPrice: "0",
  salePrice: "0",
  openingStock: "0",
  openingCostPrice: "0",
};

const units = ["قطعة", "كيلو", "جرام", "لتر", "متر", "علبة", "كرتون", "دزينة", "باكت", "زجاجة"];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) {
      setError("اسم المنتج مطلوب");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      } else {
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
        fetchProducts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name,
      unit: p.unit,
      minQuantity: p.minQuantity,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      openingStock: p.openingStock,
      openingCostPrice: p.openingCostPrice,
    });
    setEditId(p.id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchProducts();
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>
              <Package size={22} style={{ display: "inline", marginLeft: "10px", color: "#f59e0b" }} />
              المخزون
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              {products.length} منتج - {products.filter(p => parseFloat(p.quantity) <= parseFloat(p.minQuantity)).length} منخفض المخزون
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f59e0b",
              color: "#0f1117",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            منتج جديد
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: "20px",
            maxWidth: "380px",
          }}
        >
          <Search
            size={16}
            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
          />
          <input
            type="text"
            placeholder="بحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 40px 10px 14px",
              backgroundColor: "#1e2130",
              border: "1px solid #2e3348",
              borderRadius: "10px",
              color: "#e2e8f0",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Modal */}
        {showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <div
              style={{
                backgroundColor: "#1e2130",
                border: "1px solid #2e3348",
                borderRadius: "16px",
                padding: "28px",
                width: "min(560px, 95vw)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, color: "#e2e8f0", fontSize: "18px", fontWeight: "700" }}>
                  {editId ? "تعديل المنتج" : "إضافة منتج جديد"}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>اسم المنتج *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    placeholder="أدخل اسم المنتج"
                  />
                </div>

                <div>
                  <label style={labelStyle}>الوحدة</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={inputStyle}
                  >
                    {units.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>حد التحذير (الكمية الدنيا)</label>
                  <input
                    type="number"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    style={inputStyle}
                    placeholder="5"
                  />
                </div>

                <div>
                  <label style={labelStyle}>رصيد أول المدة (الكمية)</label>
                  <input
                    type="number"
                    value={form.openingStock}
                    onChange={(e) => setForm({ ...form, openingStock: e.target.value })}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label style={labelStyle}>تكلفة رصيد أول المدة</label>
                  <input
                    type="number"
                    value={form.openingCostPrice}
                    onChange={(e) => setForm({ ...form, openingCostPrice: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={labelStyle}>سعر التكلفة (سعر الشراء)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={labelStyle}>سعر البيع</label>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ padding: "10px 20px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{ padding: "10px 24px", backgroundColor: "#f59e0b", border: "none", borderRadius: "8px", color: "#0f1117", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
                >
                  {saving ? "جارٍ الحفظ..." : editId ? "تحديث" : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm !== null && (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          >
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", padding: "28px", maxWidth: "380px", textAlign: "center" }}>
              <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: "16px" }} />
              <h3 style={{ color: "#e2e8f0", margin: "0 0 8px" }}>تأكيد الحذف</h3>
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 24px" }}>
                هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 20px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>
                  إلغاء
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "10px 20px", backgroundColor: "#ef4444", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", overflow: "hidden" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>جارٍ التحميل...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#252840" }}>
                    {["المنتج", "الكمية المتاحة", "الوحدة", "رصيد أول المدة", "سعر الشراء", "سعر البيع", "الحالة", "إجراءات"].map((h) => (
                      <th key={h} style={{ textAlign: "right", padding: "14px 16px", color: "#64748b", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const qty = parseFloat(p.quantity ?? "0");
                    const min = parseFloat(p.minQuantity ?? "5");
                    const isLow = qty <= min;
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid #2e3348", transition: "background 0.15s" }}>
                        <td style={{ padding: "14px 16px", color: "#e2e8f0", fontSize: "14px" }}>
                          {p.name}
                          {isLow && (
                            <AlertTriangle size={13} color="#ef4444" style={{ marginRight: "6px", display: "inline" }} />
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", color: isLow ? "#ef4444" : "#10b981", fontSize: "14px", fontWeight: "700" }}>
                          {qty.toLocaleString("ar-EG")}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{p.unit}</td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                          {parseFloat(p.openingStock ?? "0").toLocaleString("ar-EG")}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                          {parseFloat(p.costPrice ?? "0").toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td style={{ padding: "14px 16px", color: "#f59e0b", fontSize: "14px", fontWeight: "600" }}>
                          {parseFloat(p.salePrice ?? "0").toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            backgroundColor: isLow ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                            color: isLow ? "#ef4444" : "#10b981",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}>
                            {isLow ? `⚠ أقل من ${min}` : "✓ جيد"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleEdit(p)} style={{ background: "rgba(59,130,246,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#3b82f6" }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(p.id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  {search ? "لا توجد نتائج للبحث" : "لا توجد منتجات بعد، ابدأ بإضافة منتج جديد"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: "500",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "#252840",
  border: "1px solid #2e3348",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "14px",
};
