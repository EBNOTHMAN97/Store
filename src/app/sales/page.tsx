"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/MainLayout";
import { TrendingUp, Plus, Trash2, Eye, X, Search, Printer } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  salePrice: string;
  costPrice: string;
  quantity: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customer: string;
  totalAmount: string;
  totalCost: string;
  notes: string;
  invoiceDate: string;
}

interface InvoiceItem {
  productId: number;
  productName: string;
  unit: string;
  quantity: string;
  salePrice: string;
  totalSale: string;
}

interface FormItem {
  productId: number;
  productName: string;
  unit: string;
  quantity: string;
  salePrice: string;
  availableQty: string;
}

function SalesContent() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [viewInvoice, setViewInvoice] = useState<{ invoice: Invoice; items: InvoiceItem[] } | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    invoiceNumber: `SAL-${Date.now()}`,
    customer: "",
    notes: "",
    invoiceDate: new Date().toISOString().split("T")[0],
  });
  const [items, setItems] = useState<FormItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [invRes, prodRes] = await Promise.all([
      fetch("/api/sales"),
      fetch("/api/products"),
    ]);
    setInvoices(await invRes.json());
    setProducts(await prodRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = () => {
    const prod = products.find((p) => p.id === parseInt(selectedProductId));
    if (!prod) return;
    if (items.find((i) => i.productId === prod.id)) {
      setError("المنتج مضاف بالفعل");
      return;
    }
    if (parseFloat(prod.quantity) <= 0) {
      setError(`"${prod.name}" نفذ من المخزون`);
      return;
    }
    setItems([...items, {
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      quantity: "1",
      salePrice: prod.salePrice,
      availableQty: prod.quantity,
    }]);
    setSelectedProductId("");
    setError("");
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce(
    (s, i) => s + parseFloat(i.quantity || "0") * parseFloat(i.salePrice || "0"),
    0
  );

  const handleSubmit = async () => {
    setError("");
    if (items.length === 0) { setError("أضف منتجاً واحداً على الأقل"); return; }

    // Validate quantities
    for (const item of items) {
      if (parseFloat(item.quantity) > parseFloat(item.availableQty)) {
        setError(`الكمية المطلوبة من "${item.productName}" تتجاوز المخزون المتاح (${parseFloat(item.availableQty).toLocaleString("ar-EG")} ${item.unit})`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      } else {
        setShowForm(false);
        setItems([]);
        setForm({ invoiceNumber: `SAL-${Date.now()}`, customer: "", notes: "", invoiceDate: new Date().toISOString().split("T")[0] });
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (id: number) => {
    const res = await fetch(`/api/sales/${id}`);
    const data = await res.json();
    setViewInvoice(data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الفاتورة؟")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handlePrint = () => {
    if (!viewInvoice) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const inv = viewInvoice.invoice;
    const itms = viewInvoice.items;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة بيع #${inv.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 24px; color: #111; }
          h1 { text-align: center; color: #d97706; font-size: 28px; margin-bottom: 4px; }
          .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
          .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-box { background: #f9f9f9; padding: 12px; border-radius: 8px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #f3f4f6; padding: 10px 12px; text-align: right; font-size: 13px; color: #666; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .total { text-align: left; font-size: 18px; font-weight: bold; color: #d97706; margin-top: 12px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>إبـن عثمـان</h1>
        <p class="subtitle">نظام إدارة المخزون - فاتورة بيع</p>
        <div class="header-info">
          <div class="info-box"><b>رقم الفاتورة:</b> ${inv.invoiceNumber}</div>
          <div class="info-box"><b>التاريخ:</b> ${new Date(inv.invoiceDate).toLocaleDateString("ar-EG")}</div>
          <div class="info-box"><b>العميل:</b> ${inv.customer || "نقدي"}</div>
        </div>
        <table>
          <thead>
            <tr><th>المنتج</th><th>الكمية</th><th>سعر البيع</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${itms.map((i) => `
              <tr>
                <td>${i.productName}</td>
                <td>${parseFloat(i.quantity).toLocaleString("ar-EG")} ${i.unit}</td>
                <td>${parseFloat(i.salePrice).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</td>
                <td>${parseFloat(i.totalSale).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="total">الإجمالي: ${parseFloat(inv.totalAmount).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</div>
        <p class="footer">شكراً لتعاملكم معنا - إبن عثمان</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>
              <TrendingUp size={22} style={{ display: "inline", marginLeft: "10px", color: "#10b981" }} />
              فواتير المبيعات
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>{invoices.length} فاتورة</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); setItems([]); setForm({ invoiceNumber: `SAL-${Date.now()}`, customer: "", notes: "", invoiceDate: new Date().toISOString().split("T")[0] }); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
          >
            <Plus size={16} /> فاتورة بيع جديدة
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: "20px", maxWidth: "380px" }}>
          <Search size={16} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 40px 10px 14px", backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "10px", color: "#e2e8f0", fontSize: "14px" }} />
        </div>

        {/* New Sale Modal */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: "20px" }}>
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", padding: "28px", width: "min(700px, 100%)", margin: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, color: "#e2e8f0", fontSize: "18px", fontWeight: "700" }}>فاتورة بيع جديدة</h2>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={lbl}>رقم الفاتورة</label>
                  <input type="text" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>تاريخ الفاتورة</label>
                  <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>العميل</label>
                  <input type="text" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={inp} placeholder="اسم العميل (اختياري)" />
                </div>
                <div>
                  <label style={lbl}>ملاحظات</label>
                  <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inp} placeholder="ملاحظات" />
                </div>
              </div>

              <div style={{ backgroundColor: "#252840", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <label style={lbl}>إضافة منتج</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ ...inp, flex: 1, backgroundColor: "#1e2130" }}>
                    <option value="">-- اختر منتج --</option>
                    {products.filter(p => parseFloat(p.quantity) > 0).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — متاح: {parseFloat(p.quantity).toLocaleString("ar-EG")} {p.unit}
                      </option>
                    ))}
                  </select>
                  <button onClick={addItem} disabled={!selectedProductId} style={{ padding: "10px 16px", backgroundColor: "#10b981", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ marginBottom: "16px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#252840" }}>
                        {["المنتج", "الكمية المتاحة", "الكمية", "سعر البيع", "الإجمالي", ""].map((h) => (
                          <th key={h} style={{ textAlign: "right", padding: "10px 12px", color: "#64748b", fontSize: "12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid #2e3348" }}>
                          <td style={{ padding: "10px 12px", color: "#e2e8f0", fontSize: "13px" }}>
                            {item.productName}
                            <span style={{ color: "#64748b", marginRight: "4px", fontSize: "11px" }}>({item.unit})</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#10b981", fontSize: "13px" }}>
                            {parseFloat(item.availableQty).toLocaleString("ar-EG")}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                              style={{ ...inp, width: "80px", padding: "6px 8px", backgroundColor: "#1e2130" }}
                              min="0.001" step="0.001" max={item.availableQty} />
                          </td>
                          <td style={{ padding: "10px 12px", color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                            {parseFloat(item.salePrice || "0").toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                          </td>
                          <td style={{ padding: "10px 12px", color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>
                            {(parseFloat(item.quantity || "0") * parseFloat(item.salePrice || "0")).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <button onClick={() => removeItem(idx)} style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#ef4444" }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ textAlign: "left", marginTop: "12px", padding: "12px", backgroundColor: "#252840", borderRadius: "8px" }}>
                    <span style={{ color: "#94a3b8", fontSize: "14px" }}>الإجمالي: </span>
                    <span style={{ color: "#10b981", fontSize: "20px", fontWeight: "700" }}>
                      {totalAmount.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>إلغاء</button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 24px", backgroundColor: "#10b981", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
                  {saving ? "جارٍ الحفظ..." : "حفظ الفاتورة"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Invoice */}
        {viewInvoice && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "16px", padding: "28px", width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#e2e8f0" }}>فاتورة بيع #{viewInvoice.invoice.invoiceNumber}</h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handlePrint} style={{ background: "rgba(59,130,246,0.15)", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                    <Printer size={14} /> طباعة
                  </button>
                  <button onClick={() => setViewInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ backgroundColor: "#252840", padding: "12px", borderRadius: "8px" }}>
                  <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>العميل</p>
                  <p style={{ color: "#e2e8f0", margin: 0, fontSize: "14px" }}>{viewInvoice.invoice.customer || "نقدي"}</p>
                </div>
                <div style={{ backgroundColor: "#252840", padding: "12px", borderRadius: "8px" }}>
                  <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>التاريخ</p>
                  <p style={{ color: "#e2e8f0", margin: 0, fontSize: "14px" }}>{new Date(viewInvoice.invoice.invoiceDate).toLocaleDateString("ar-EG")}</p>
                </div>
                <div style={{ backgroundColor: "#252840", padding: "12px", borderRadius: "8px" }}>
                  <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>الملاحظات</p>
                  <p style={{ color: "#e2e8f0", margin: 0, fontSize: "14px" }}>{viewInvoice.invoice.notes || "—"}</p>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#252840" }}>
                    {["المنتج", "الكمية", "سعر البيع", "الإجمالي"].map((h) => (
                      <th key={h} style={{ textAlign: "right", padding: "10px 12px", color: "#64748b", fontSize: "12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #2e3348" }}>
                      <td style={{ padding: "10px 12px", color: "#e2e8f0", fontSize: "13px" }}>{item.productName}</td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: "13px" }}>{parseFloat(item.quantity).toLocaleString("ar-EG")} {item.unit}</td>
                      <td style={{ padding: "10px 12px", color: "#10b981", fontSize: "13px", fontWeight: "600" }}>{parseFloat(item.salePrice).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</td>
                      <td style={{ padding: "10px 12px", color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>{parseFloat(item.totalSale).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: "left", backgroundColor: "#252840", padding: "14px", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8" }}>إجمالي الفاتورة: </span>
                <span style={{ color: "#10b981", fontSize: "22px", fontWeight: "700" }}>
                  {parseFloat(viewInvoice.invoice.totalAmount).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                </span>
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
                    {["رقم الفاتورة", "العميل", "التاريخ", "إجمالي البيع", "إجراءات"].map((h) => (
                      <th key={h} style={{ textAlign: "right", padding: "14px 16px", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} style={{ borderTop: "1px solid #2e3348" }}>
                      <td style={{ padding: "14px 16px", color: "#10b981", fontSize: "14px", fontWeight: "600" }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{inv.customer || "نقدي"}</td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{new Date(inv.invoiceDate).toLocaleDateString("ar-EG")}</td>
                      <td style={{ padding: "14px 16px", color: "#f59e0b", fontSize: "14px", fontWeight: "700" }}>
                        {parseFloat(inv.totalAmount).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleView(inv.id)} style={{ background: "rgba(16,185,129,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#10b981" }}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>لا توجد فواتير بعد</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<MainLayout><div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>جارٍ التحميل...</div></MainLayout>}>
      <SalesContent />
    </Suspense>
  );
}

const lbl: React.CSSProperties = { display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#e2e8f0", fontSize: "14px" };
