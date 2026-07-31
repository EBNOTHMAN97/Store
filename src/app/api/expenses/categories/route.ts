import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseCategories } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db.select().from(expenseCategories).orderBy(expenseCategories.name);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب الفئات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "اسم الفئة مطلوب" }, { status: 400 });
    }

    const [cat] = await db
      .insert(expenseCategories)
      .values({ name })
      .returning();

    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في إضافة الفئة" }, { status: 500 });
  }
}
