import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseInvoices, purchaseInvoiceItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const invoices = await db
      .select()
      .from(purchaseInvoices)
      .orderBy(desc(purchaseInvoices.invoiceDate));
    return NextResponse.json(invoices);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب الفواتير" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceNumber, supplier, notes, invoiceDate, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "يجب إضافة منتج واحد على الأقل" }, { status: 400 });
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += parseFloat(item.quantity) * parseFloat(item.costPrice);
    }

    // Create invoice
    const [invoice] = await db
      .insert(purchaseInvoices)
      .values({
        invoiceNumber,
        supplier: supplier ?? "",
        notes: notes ?? "",
        totalAmount: String(totalAmount),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      })
      .returning();

    // Create items + update product quantities and cost prices
    for (const item of items) {
      const qty = parseFloat(item.quantity);
      const cost = parseFloat(item.costPrice);
      const total = qty * cost;

      await db.insert(purchaseInvoiceItems).values({
        invoiceId: invoice.id,
        productId: item.productId,
        quantity: String(qty),
        costPrice: String(cost),
        totalCost: String(total),
      });

      // Update product: increase quantity and update cost price
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (prod) {
        const newQty = parseFloat(prod.quantity ?? "0") + qty;
        await db
          .update(products)
          .set({
            quantity: String(newQty),
            costPrice: String(cost), // Update to latest purchase price
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في إنشاء فاتورة الشراء" }, { status: 500 });
  }
}
