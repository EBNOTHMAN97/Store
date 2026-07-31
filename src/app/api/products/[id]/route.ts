import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await req.json();

    const {
      name,
      unit,
      minQuantity,
      costPrice,
      salePrice,
      openingStock,
      openingCostPrice,
    } = body;

    // Get current product to calculate quantity adjustment
    const [current] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!current) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    const oldOpening = parseFloat(current.openingStock ?? "0");
    const newOpening = parseFloat(String(openingStock ?? oldOpening));
    const currentQty = parseFloat(current.quantity ?? "0");
    const diff = newOpening - oldOpening;
    const newQty = Math.max(0, currentQty + diff);

    const [updated] = await db
      .update(products)
      .set({
        name: name ?? current.name,
        unit: unit ?? current.unit,
        minQuantity: String(minQuantity ?? current.minQuantity),
        costPrice: String(costPrice ?? current.costPrice),
        salePrice: String(salePrice ?? current.salePrice),
        openingStock: String(openingStock ?? current.openingStock),
        openingCostPrice: String(openingCostPrice ?? current.openingCostPrice),
        quantity: String(newQty),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في تحديث المنتج" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    await db.delete(products).where(eq(products.id, productId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في حذف المنتج" }, { status: 500 });
  }
}
