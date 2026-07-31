import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: expenses.id,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        description: expenses.description,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .orderBy(desc(expenses.expenseDate));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب المصروفات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, description, amount, expenseDate } = body;

    if (!description || !amount) {
      return NextResponse.json({ error: "الوصف والمبلغ مطلوبان" }, { status: 400 });
    }

    const [expense] = await db
      .insert(expenses)
      .values({
        categoryId: categoryId ?? null,
        description,
        amount: String(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      })
      .returning();

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في إضافة المصروف" }, { status: 500 });
  }
}
