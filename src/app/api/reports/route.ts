import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesInvoices, expenses, products } from "@/db/schema";
import { gte, lte, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "monthly"; // daily | monthly | yearly
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const day = parseInt(searchParams.get("day") ?? String(new Date().getDate()));

    let startDate: Date;
    let endDate: Date;

    if (period === "daily") {
      startDate = new Date(year, month - 1, day, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59);
    } else if (period === "monthly") {
      startDate = new Date(year, month - 1, 1, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // yearly
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Sales in period
    const salesRows = await db
      .select()
      .from(salesInvoices)
      .where(
        and(
          gte(salesInvoices.invoiceDate, startDate),
          lte(salesInvoices.invoiceDate, endDate)
        )
      );

    const totalSales = salesRows.reduce((s, r) => s + parseFloat(r.totalAmount ?? "0"), 0);
    const totalCostOfGoods = salesRows.reduce((s, r) => s + parseFloat(r.totalCost ?? "0"), 0);
    const grossProfit = totalSales - totalCostOfGoods;

    // Expenses in period
    const expenseRows = await db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        )
      );

    const totalExpenses = expenseRows.reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0);
    const netProfit = grossProfit - totalExpenses;

    // Low stock alerts
    const allProducts = await db.select().from(products);
    const lowStockProducts = allProducts.filter(
      (p) => parseFloat(p.quantity ?? "0") <= parseFloat(p.minQuantity ?? "5")
    );

    // Monthly breakdown for yearly report
    let monthlyData: { month: number; sales: number; costOfGoods: number; expenses: number; netProfit: number }[] = [];
    if (period === "yearly") {
      for (let m = 1; m <= 12; m++) {
        const ms = new Date(year, m - 1, 1, 0, 0, 0);
        const me = new Date(year, m, 0, 23, 59, 59);

        const ms_sales = await db
          .select()
          .from(salesInvoices)
          .where(and(gte(salesInvoices.invoiceDate, ms), lte(salesInvoices.invoiceDate, me)));

        const ms_exp = await db
          .select()
          .from(expenses)
          .where(and(gte(expenses.expenseDate, ms), lte(expenses.expenseDate, me)));

        const mSales = ms_sales.reduce((s, r) => s + parseFloat(r.totalAmount ?? "0"), 0);
        const mCOG = ms_sales.reduce((s, r) => s + parseFloat(r.totalCost ?? "0"), 0);
        const mExp = ms_exp.reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0);

        monthlyData.push({
          month: m,
          sales: mSales,
          costOfGoods: mCOG,
          expenses: mExp,
          netProfit: mSales - mCOG - mExp,
        });
      }
    }

    // Daily breakdown for monthly report
    let dailyData: { day: number; sales: number; costOfGoods: number; expenses: number; netProfit: number }[] = [];
    if (period === "monthly") {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = new Date(year, month - 1, d, 0, 0, 0);
        const de = new Date(year, month - 1, d, 23, 59, 59);

        const dSalesRows = salesRows.filter((r) => {
          const date = new Date(r.invoiceDate);
          return date >= ds && date <= de;
        });
        const dExpRows = expenseRows.filter((r) => {
          const date = new Date(r.expenseDate);
          return date >= ds && date <= de;
        });

        const dSales = dSalesRows.reduce((s, r) => s + parseFloat(r.totalAmount ?? "0"), 0);
        const dCOG = dSalesRows.reduce((s, r) => s + parseFloat(r.totalCost ?? "0"), 0);
        const dExp = dExpRows.reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0);

        if (dSales > 0 || dExp > 0) {
          dailyData.push({
            day: d,
            sales: dSales,
            costOfGoods: dCOG,
            expenses: dExp,
            netProfit: dSales - dCOG - dExp,
          });
        }
      }
    }

    return NextResponse.json({
      period,
      startDate,
      endDate,
      totalSales,
      totalCostOfGoods,
      grossProfit,
      totalExpenses,
      netProfit,
      invoiceCount: salesRows.length,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        minQuantity: p.minQuantity,
        unit: p.unit,
      })),
      monthlyData,
      dailyData,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب التقارير" }, { status: 500 });
  }
}
