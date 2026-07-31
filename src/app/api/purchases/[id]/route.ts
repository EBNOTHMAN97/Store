import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseInvoices, purchaseInvoiceItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    const [invoice] = await db
      .select()
      .from(purchaseInvoices)
      .where(eq(purchaseInvoices.id, invoiceId));

    if (!invoice) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    const items = await db
      .select({
        id: purchaseInvoiceItems.id,
        productId: purchaseInvoiceItems.productId,
        productName: products.name,
        unit: products.unit,
        quantity: purchaseInvoiceItems.quantity,
        costPrice: purchaseInvoiceItems.costPrice,
        totalCost: purchaseInvoiceItems.totalCost,
      })
      .from(purchaseInvoiceItems)
      .leftJoin(products, eq(purchaseInvoiceItems.productId, products.id))
      .where(eq(purchaseInvoiceItems.invoiceId, invoiceId));

    return NextResponse.json({ invoice, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب الفاتورة" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    // Get items to reverse stock changes
    const items = await db
      .select()
      .from(purchaseInvoiceItems)
      .where(eq(purchaseInvoiceItems.invoiceId, invoiceId));

    // Reverse stock
    for (const item of items) {
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
      if (prod) {
        const newQty = Math.max(0, parseFloat(prod.quantity ?? "0") - parseFloat(item.quantity));
        await db
          .update(products)
          .set({ quantity: String(newQty), updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }
    }

    await db.delete(purchaseInvoices).where(eq(purchaseInvoices.id, invoiceId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في حذف الفاتورة" }, { status: 500 });
  }
}
