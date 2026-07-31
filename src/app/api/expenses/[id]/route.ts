import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { categoryId, description, amount, expenseDate } = body;

    const [updated] = await db
      .update(expenses)
      .set({
        categoryId: categoryId ?? null,
        description,
        amount: String(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      })
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في تحديث المصروف" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(expenses).where(eq(expenses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في حذف المصروف" }, { status: 500 });
  }
}
