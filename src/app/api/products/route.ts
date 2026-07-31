import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(products)
      .orderBy(products.name);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب المنتجات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      unit = "قطعة",
      minQuantity = 5,
      costPrice = 0,
      salePrice = 0,
      openingStock = 0,
      openingCostPrice = 0,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "اسم المنتج مطلوب" }, { status: 400 });
    }

    const [product] = await db
      .insert(products)
      .values({
        name,
        unit,
        minQuantity: String(minQuantity),
        costPrice: String(costPrice),
        salePrice: String(salePrice),
        openingStock: String(openingStock),
        openingCostPrice: String(openingCostPrice),
        quantity: String(openingStock), // initial stock = opening stock
      })
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في إضافة المنتج" }, { status: 500 });
  }
}
