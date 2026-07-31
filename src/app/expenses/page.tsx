"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/MainLayout";
import { Wallet, Plus, Trash2, Edit2, X, Tag } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  description: string;
  amount: string;
  expenseDate: string;
}

const emptyForm = {
  categoryId: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().split("T")[0],
};

function ExpensesContent() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [showCatForm, setShowCatForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [expRes, catRes] = await Promise.all([
      fetch("/api/expenses"),
      fetch("/api/expenses/categories"),
    ]);
    setExpenses(await expRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalThisMonth = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + parseFloat(e.amount ?? "0"), 0);

  const totalAll = expenses.reduce((s, e) => s + parseFloat(e.amount ?? "0"), 0);

  const handleSubmit = async () => {
    setError("");
    if (!form.description.trim() || !form.amount) {
      setError("الوصف والمبلغ مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/expenses/${editId}` : "/api/expenses";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId ? parseInt(form.categoryId) : null,
          amount: parseFloat(form.amount),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      } else {
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (e: Expense) => {
    setForm({
      categoryId: e.categoryId ? String(e.categoryId) : "",
      description: e.description,
      amount: e.amount,
      expenseDate: new Date(e.expenseDate).toISOString().split("T")[0],
    });
    setEditId(e.id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا المصروف؟")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchData();
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await fetch("/api/expenses/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName }),
    });
    setNewCatName("");
    setShowCatForm(false);
    fetchData();
  };

  // Group by category for summary
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.categoryName ?? "غير مصنف";
    byCat[cat] = (byCat[cat] ?? 0) + parseFloat(e.amount ?? "0");
  });

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>
              <Wallet size={22} style={{ display: "inline", marginLeft: "10px", color: "#a78bfa" }} />
              المصروفات
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>{expenses.length} مصروف</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowCatForm(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#252840", color: "#94a3b8", border: "1px solid #2e3348", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", cursor: "pointer" }}
            >
              <Tag size={15} /> إدارة الفئات
            </button>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(""); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#a78bfa", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
            >
              <Plus size={16} /> مصروف جديد
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "20px" }}>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px" }}>مصروفات هذا الشهر</p>
            <p style={{ color: "#a78bfa", fontSize: "22px", fontWeight: "700", margin: 0 }}>
              {totalThisMonth.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
            </p>
          </div>
          <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "20px" }}>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px" }}>إجمالي المصروفات</p>
            <p style={{ color: "#ef4444", fontSize: "22px", fontWeight: "700", margin: 0 }}>
              {totalAll.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
            </p>
          </div>
          {Object.entries(byCat).slice(0, 2).map(([cat, amt]) => (
            <div key={cat} style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "20px" }}>
              <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px" }}>{cat}</p>
              <p style={{ color: "#f59e0b", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                {amt.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
              </p>
            </div>
          ))}
        </div>

        {/* Category Manager Modal */}
        {showCatForm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", padding: "28px", width: "min(440px, 95vw)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#e2e8f0", fontSize: "17px" }}>فئات المصروفات</h2>
                <button onClick={() => setShowCatForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input type="text" placeholder="اسم الفئة الجديدة" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  style={{ flex: 1, padding: "10px 12px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#e2e8f0", fontSize: "14px" }} />
                <button onClick={addCategory} style={{ padding: "10px 16px", backgroundColor: "#a78bfa", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: "700" }}>
                  إضافة
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ backgroundColor: "#252840", padding: "10px 14px", borderRadius: "8px", color: "#e2e8f0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Tag size={13} color="#a78bfa" />
                    {cat.name}
                  </div>
                ))}
                {categories.length === 0 && (
                  <p style={{ color: "#64748b", textAlign: "center", fontSize: "13px" }}>لا توجد فئات بعد</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expense Form Modal */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", padding: "28px", width: "min(480px, 95vw)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, color: "#e2e8f0", fontSize: "18px", fontWeight: "700" }}>
                  {editId ? "تعديل المصروف" : "إضافة مصروف"}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={lbl}>الفئة</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inp}>
                    <option value="">-- بدون فئة --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>الوصف *</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inp} placeholder="وصف المصروف" />
                </div>
                <div>
                  <label style={lbl}>المبلغ (ج.م) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inp} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label style={lbl}>التاريخ</label>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} style={inp} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>إلغاء</button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 24px", backgroundColor: "#a78bfa", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
                  {saving ? "جارٍ الحفظ..." : editId ? "تحديث" : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", overflow: "hidden" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>جارٍ التحميل...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#252840" }}>
                    {["التاريخ", "الفئة", "الوصف", "المبلغ", "إجراءات"].map((h) => (
                      <th key={h} style={{ textAlign: "right", padding: "14px 16px", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderTop: "1px solid #2e3348" }}>
                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                        {new Date(exp.expenseDate).toLocaleDateString("ar-EG")}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {exp.categoryName ? (
                          <span style={{ backgroundColor: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "3px 10px", borderRadius: "20px", fontSize: "12px" }}>
                            {exp.categoryName}
                          </span>
                        ) : (
                          <span style={{ color: "#475569", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#e2e8f0", fontSize: "14px" }}>{exp.description}</td>
                      <td style={{ padding: "14px 16px", color: "#ef4444", fontSize: "14px", fontWeight: "700" }}>
                        {parseFloat(exp.amount).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleEdit(exp)} style={{ background: "rgba(59,130,246,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#3b82f6" }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(exp.id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>لا توجد مصروفات بعد</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<MainLayout><div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>جارٍ التحميل...</div></MainLayout>}>
      <ExpensesContent />
    </Suspense>
  );
}

const lbl: React.CSSProperties = { display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#e2e8f0", fontSize: "14px" };
