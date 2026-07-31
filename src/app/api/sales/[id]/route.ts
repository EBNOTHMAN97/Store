import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesInvoices, salesInvoiceItems, products } from "@/db/schema";
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
      .from(salesInvoices)
      .where(eq(salesInvoices.id, invoiceId));

    if (!invoice) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    const items = await db
      .select({
        id: salesInvoiceItems.id,
        productId: salesInvoiceItems.productId,
        productName: products.name,
        unit: products.unit,
        quantity: salesInvoiceItems.quantity,
        salePrice: salesInvoiceItems.salePrice,
        costPrice: salesInvoiceItems.costPrice,
        totalSale: salesInvoiceItems.totalSale,
        totalCost: salesInvoiceItems.totalCost,
      })
      .from(salesInvoiceItems)
      .leftJoin(products, eq(salesInvoiceItems.productId, products.id))
      .where(eq(salesInvoiceItems.invoiceId, invoiceId));

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

    // Reverse stock changes
    const items = await db
      .select()
      .from(salesInvoiceItems)
      .where(eq(salesInvoiceItems.invoiceId, invoiceId));

    for (const item of items) {
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
      if (prod) {
        const newQty = parseFloat(prod.quantity ?? "0") + parseFloat(item.quantity);
        await db
          .update(products)
          .set({ quantity: String(newQty), updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }
    }

    await db.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في حذف الفاتورة" }, { status: 500 });
  }
}
