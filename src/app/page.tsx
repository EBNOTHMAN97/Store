"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalSales: number;
  netProfit: number;
  totalExpenses: number;
  invoiceCount: number;
  lowStockProducts: { id: number; name: string; quantity: string; minQuantity: string; unit: string }[];
}

interface Product {
  id: number;
  name: string;
  quantity: string;
  minQuantity: string;
  unit: string;
  salePrice: string;
  costPrice: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, productsRes] = await Promise.all([
          fetch(`/api/reports?period=monthly`),
          fetch("/api/products"),
        ]);
        const reportData = await reportRes.json();
        const productsData = await productsRes.json();
        setData(reportData);
        setProducts(productsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString("ar-EG", { month: "long" });

  const cards = [
    {
      label: `مبيعات ${monthName}`,
      value: `${(data?.totalSales ?? 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م`,
      icon: TrendingUp,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      sub: `${data?.invoiceCount ?? 0} فاتورة`,
    },
    {
      label: `صافي الربح ${monthName}`,
      value: `${(data?.netProfit ?? 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م`,
      icon: (data?.netProfit ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight,
      color: (data?.netProfit ?? 0) >= 0 ? "#10b981" : "#ef4444",
      bg: (data?.netProfit ?? 0) >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      sub: "بعد خصم المصروفات",
    },
    {
      label: `مصروفات ${monthName}`,
      value: `${(data?.totalExpenses ?? 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م`,
      icon: Wallet,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      sub: "إجمالي المصروفات",
    },
    {
      label: "تحذيرات المخزون",
      value: String(data?.lowStockProducts?.length ?? 0),
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      sub: "منتج يحتاج تجديد",
    },
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#f59e0b",
              margin: 0,
            }}
          >
            إبـــن عثمـــان
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "14px" }}>
            لوحة التحكم - {now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "60px" }}>
            جارٍ التحميل...
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    style={{
                      backgroundColor: "#1e2130",
                      border: "1px solid #2e3348",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>{card.label}</p>
                        <p
                          style={{
                            color: card.color,
                            fontSize: "22px",
                            fontWeight: "700",
                            margin: "6px 0 0",
                          }}
                        >
                          {card.value}
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: card.bg,
                          borderRadius: "12px",
                          padding: "10px",
                        }}
                      >
                        <Icon size={22} color={card.color} />
                      </div>
                    </div>
                    <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>{card.sub}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Low Stock Warning */}
              <div
                style={{
                  backgroundColor: "#1e2130",
                  border: "1px solid #2e3348",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>
                    تحذيرات المخزون
                  </h2>
                </div>
                {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          backgroundColor: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "#e2e8f0", fontSize: "14px" }}>{p.name}</span>
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {parseFloat(p.quantity).toLocaleString("ar-EG")} {p.unit}
                          <span style={{ color: "#64748b", marginRight: "6px" }}>
                            / الحد: {parseFloat(p.minQuantity).toLocaleString("ar-EG")}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#10b981", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                    ✓ جميع المنتجات بمستوى مخزون جيد
                  </p>
                )}
                <Link
                  href="/inventory"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: "16px",
                    color: "#f59e0b",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  عرض كل المخزون ←
                </Link>
              </div>

              {/* Quick Actions */}
              <div
                style={{
                  backgroundColor: "#1e2130",
                  border: "1px solid #2e3348",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>
                  إجراءات سريعة
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { href: "/sales?new=1", label: "فاتورة بيع جديدة", icon: TrendingUp, color: "#10b981" },
                    { href: "/purchases?new=1", label: "فاتورة شراء جديدة", icon: ShoppingCart, color: "#3b82f6" },
                    { href: "/inventory?new=1", label: "إضافة منتج جديد", icon: Package, color: "#f59e0b" },
                    { href: "/expenses?new=1", label: "تسجيل مصروف", icon: Wallet, color: "#a78bfa" },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 16px",
                          backgroundColor: "#252840",
                          borderRadius: "10px",
                          textDecoration: "none",
                          color: "#e2e8f0",
                          fontSize: "14px",
                          transition: "background 0.2s",
                          border: "1px solid #2e3348",
                        }}
                      >
                        <Icon size={18} color={action.color} />
                        {action.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Products summary */}
            <div
              style={{
                backgroundColor: "#1e2130",
                border: "1px solid #2e3348",
                borderRadius: "16px",
                padding: "24px",
                marginTop: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>
                  ملخص المخزون
                </h2>
                <Link href="/inventory" style={{ color: "#f59e0b", fontSize: "13px", textDecoration: "none" }}>
                  عرض الكل
                </Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #2e3348" }}>
                      {["المنتج", "الكمية", "الوحدة", "سعر البيع", "الحالة"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "right",
                            padding: "10px 12px",
                            color: "#64748b",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 8).map((p) => {
                      const qty = parseFloat(p.quantity ?? "0");
                      const min = parseFloat(p.minQuantity ?? "5");
                      const isLow = qty <= min;
                      return (
                        <tr
                          key={p.id}
                          style={{ borderBottom: "1px solid #1a1d27" }}
                        >
                          <td style={{ padding: "12px", color: "#e2e8f0", fontSize: "14px" }}>{p.name}</td>
                          <td style={{ padding: "12px", color: isLow ? "#ef4444" : "#10b981", fontSize: "14px", fontWeight: "600" }}>
                            {qty.toLocaleString("ar-EG")}
                          </td>
                          <td style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>{p.unit}</td>
                          <td style={{ padding: "12px", color: "#f59e0b", fontSize: "14px" }}>
                            {parseFloat(p.salePrice ?? "0").toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                backgroundColor: isLow ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                                color: isLow ? "#ef4444" : "#10b981",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {isLow ? "⚠ منخفض" : "✓ جيد"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                    لا توجد منتجات بعد
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
