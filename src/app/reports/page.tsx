"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  DollarSign,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface ReportData {
  period: string;
  totalSales: number;
  totalCostOfGoods: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  invoiceCount: number;
  lowStockProducts: { id: number; name: string; quantity: string; minQuantity: string; unit: string }[];
  monthlyData: { month: number; sales: number; costOfGoods: number; expenses: number; netProfit: number }[];
  dailyData: { day: number; sales: number; costOfGoods: number; expenses: number; netProfit: number }[];
}

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?period=${period}&year=${year}&month=${month}&day=${day}`
      );
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [period, year, month, day]);

  const fmt = (n: number) =>
    n.toLocaleString("ar-EG", { minimumFractionDigits: 2 });

  const profitColor = (n: number) => (n >= 0 ? "#10b981" : "#ef4444");
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>
              <BarChart3 size={22} style={{ display: "inline", marginLeft: "10px", color: "#f59e0b" }} />
              التقارير والأرباح
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>تقرير شامل للمبيعات والمصروفات والأرباح</p>
          </div>
          <button
            onClick={fetchReport}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "10px", padding: "10px 16px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}
          >
            <RefreshCw size={14} /> تحديث
          </button>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            {/* Period Tabs */}
            <div>
              <label style={lbl}>نوع التقرير</label>
              <div style={{ display: "flex", gap: "4px", backgroundColor: "#252840", borderRadius: "10px", padding: "4px" }}>
                {(["daily", "monthly", "yearly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: period === p ? "700" : "400",
                      backgroundColor: period === p ? "#f59e0b" : "transparent",
                      color: period === p ? "#0f1117" : "#94a3b8",
                      transition: "all 0.2s",
                    }}
                  >
                    {p === "daily" ? "يومي" : p === "monthly" ? "شهري" : "سنوي"}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label style={lbl}>السنة</label>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={inp}>
                {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Month */}
            {period !== "yearly" && (
              <div>
                <label style={lbl}>الشهر</label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={inp}>
                  {MONTHS_AR.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
            )}

            {/* Day */}
            {period === "daily" && (
              <div>
                <label style={lbl}>اليوم</label>
                <select value={day} onChange={(e) => setDay(parseInt(e.target.value))} style={inp}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>جارٍ تحميل التقرير...</div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "إجمالي المبيعات", value: fmt(data.totalSales), color: "#3b82f6", icon: TrendingUp, sub: `${data.invoiceCount} فاتورة` },
                { label: "تكلفة البضاعة المباعة", value: fmt(data.totalCostOfGoods), color: "#f59e0b", icon: DollarSign, sub: "إجمالي التكاليف" },
                { label: "مجمل الربح", value: fmt(data.grossProfit), color: profitColor(data.grossProfit), icon: data.grossProfit >= 0 ? TrendingUp : TrendingDown, sub: "قبل المصروفات" },
                { label: "إجمالي المصروفات", value: fmt(data.totalExpenses), color: "#ef4444", icon: Wallet, sub: "جميع المصروفات" },
                { label: "صافي الربح", value: fmt(data.netProfit), color: profitColor(data.netProfit), icon: data.netProfit >= 0 ? TrendingUp : TrendingDown, sub: "بعد كل المصروفات" },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} style={{ backgroundColor: "#1e2130", border: `1px solid ${card.color}33`, borderRadius: "14px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px" }}>{card.label}</p>
                        <p style={{ color: card.color, fontSize: "18px", fontWeight: "700", margin: 0 }}>
                          {card.value} ج.م
                        </p>
                        <p style={{ color: "#475569", fontSize: "11px", margin: "4px 0 0" }}>{card.sub}</p>
                      </div>
                      <div style={{ backgroundColor: `${card.color}22`, borderRadius: "10px", padding: "8px" }}>
                        <Icon size={18} color={card.color} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Profit Breakdown Bar */}
            <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>
                <Calendar size={16} style={{ display: "inline", marginLeft: "8px", color: "#f59e0b" }} />
                تحليل الأرباح
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "المبيعات", value: data.totalSales, color: "#3b82f6", max: data.totalSales },
                  { label: "تكلفة البضاعة", value: data.totalCostOfGoods, color: "#f59e0b", max: data.totalSales },
                  { label: "المصروفات", value: data.totalExpenses, color: "#ef4444", max: data.totalSales },
                  { label: "صافي الربح", value: Math.max(0, data.netProfit), color: "#10b981", max: data.totalSales },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>{bar.label}</span>
                      <span style={{ color: bar.color, fontSize: "13px", fontWeight: "600" }}>
                        {fmt(bar.value)} ج.م
                      </span>
                    </div>
                    <div style={{ backgroundColor: "#252840", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                      <div style={{
                        backgroundColor: bar.color,
                        height: "100%",
                        borderRadius: "6px",
                        width: bar.max > 0 ? `${Math.min(100, (bar.value / bar.max) * 100)}%` : "0%",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Net Profit highlight */}
              <div style={{
                marginTop: "20px",
                padding: "16px 20px",
                backgroundColor: data.netProfit >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${data.netProfit >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>صافي الربح النهائي</p>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11px" }}>
                    المبيعات ({fmt(data.totalSales)}) - تكلفة البضاعة ({fmt(data.totalCostOfGoods)}) - المصروفات ({fmt(data.totalExpenses)})
                  </p>
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: profitColor(data.netProfit), fontSize: "24px", fontWeight: "800" }}>
                    {data.netProfit >= 0 ? "+" : ""}{fmt(data.netProfit)} ج.م
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Table for Yearly Report */}
            {period === "yearly" && data.monthlyData.length > 0 && (
              <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>
                  التفصيل الشهري - {year}
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#252840" }}>
                        {["الشهر", "المبيعات", "التكلفة", "مجمل الربح", "المصروفات", "صافي الربح"].map((h) => (
                          <th key={h} style={{ textAlign: "right", padding: "12px 14px", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthlyData.map((row) => (
                        <tr key={row.month} style={{ borderTop: "1px solid #2e3348" }}>
                          <td style={{ padding: "12px 14px", color: "#e2e8f0", fontWeight: "600", fontSize: "13px" }}>{MONTHS_AR[row.month - 1]}</td>
                          <td style={{ padding: "12px 14px", color: "#3b82f6", fontSize: "13px" }}>{fmt(row.sales)}</td>
                          <td style={{ padding: "12px 14px", color: "#f59e0b", fontSize: "13px" }}>{fmt(row.costOfGoods)}</td>
                          <td style={{ padding: "12px 14px", color: profitColor(row.sales - row.costOfGoods), fontSize: "13px", fontWeight: "600" }}>
                            {fmt(row.sales - row.costOfGoods)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#ef4444", fontSize: "13px" }}>{fmt(row.expenses)}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{
                              color: profitColor(row.netProfit),
                              fontWeight: "700",
                              fontSize: "13px",
                            }}>
                              {row.netProfit >= 0 ? "+" : ""}{fmt(row.netProfit)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr style={{ borderTop: "2px solid #f59e0b", backgroundColor: "#252840" }}>
                        <td style={{ padding: "12px 14px", color: "#f59e0b", fontWeight: "700", fontSize: "13px" }}>الإجمالي</td>
                        <td style={{ padding: "12px 14px", color: "#3b82f6", fontWeight: "700", fontSize: "13px" }}>{fmt(data.totalSales)}</td>
                        <td style={{ padding: "12px 14px", color: "#f59e0b", fontWeight: "700", fontSize: "13px" }}>{fmt(data.totalCostOfGoods)}</td>
                        <td style={{ padding: "12px 14px", color: profitColor(data.grossProfit), fontWeight: "700", fontSize: "13px" }}>{fmt(data.grossProfit)}</td>
                        <td style={{ padding: "12px 14px", color: "#ef4444", fontWeight: "700", fontSize: "13px" }}>{fmt(data.totalExpenses)}</td>
                        <td style={{ padding: "12px 14px", color: profitColor(data.netProfit), fontWeight: "800", fontSize: "14px" }}>
                          {data.netProfit >= 0 ? "+" : ""}{fmt(data.netProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily Table for Monthly Report */}
            {period === "monthly" && data.dailyData.length > 0 && (
              <div style={{ backgroundColor: "#1e2130", border: "1px solid #2e3348", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>
                  التفصيل اليومي - {MONTHS_AR[month - 1]} {year}
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#252840" }}>
                        {["اليوم", "المبيعات", "التكلفة", "مجمل الربح", "المصروفات", "صافي الربح"].map((h) => (
                          <th key={h} style={{ textAlign: "right", padding: "12px 14px", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.dailyData.map((row) => (
                        <tr key={row.day} style={{ borderTop: "1px solid #2e3348" }}>
                          <td style={{ padding: "12px 14px", color: "#e2e8f0", fontWeight: "600", fontSize: "13px" }}>{row.day} {MONTHS_AR[month - 1]}</td>
                          <td style={{ padding: "12px 14px", color: "#3b82f6", fontSize: "13px" }}>{fmt(row.sales)}</td>
                          <td style={{ padding: "12px 14px", color: "#f59e0b", fontSize: "13px" }}>{fmt(row.costOfGoods)}</td>
                          <td style={{ padding: "12px 14px", color: profitColor(row.sales - row.costOfGoods), fontSize: "13px", fontWeight: "600" }}>
                            {fmt(row.sales - row.costOfGoods)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#ef4444", fontSize: "13px" }}>{fmt(row.expenses)}</td>
                          <td style={{ padding: "12px 14px", color: profitColor(row.netProfit), fontWeight: "700", fontSize: "13px" }}>
                            {row.netProfit >= 0 ? "+" : ""}{fmt(row.netProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Low Stock Section */}
            {data.lowStockProducts.length > 0 && (
              <div style={{ backgroundColor: "#1e2130", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "14px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>
                  <AlertTriangle size={16} style={{ display: "inline", marginLeft: "8px" }} />
                  منتجات تحتاج تجديد المخزون ({data.lowStockProducts.length})
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  {data.lowStockProducts.map((p) => (
                    <div key={p.id} style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "14px" }}>
                      <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "600", margin: "0 0 8px" }}>{p.name}</p>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#ef4444", fontSize: "13px" }}>
                          متاح: {parseFloat(p.quantity).toLocaleString("ar-EG")} {p.unit}
                        </span>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>
                          الحد: {parseFloat(p.minQuantity).toLocaleString("ar-EG")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>لا توجد بيانات</p>
        )}
      </div>
    </MainLayout>
  );
}

const lbl: React.CSSProperties = { display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px" };
const inp: React.CSSProperties = { padding: "10px 12px", backgroundColor: "#252840", border: "1px solid #2e3348", borderRadius: "8px", color: "#e2e8f0", fontSize: "14px" };
