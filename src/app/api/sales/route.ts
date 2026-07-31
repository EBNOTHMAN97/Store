import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesInvoices, salesInvoiceItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const invoices = await db
      .select()
      .from(salesInvoices)
      .orderBy(desc(salesInvoices.invoiceDate));
    return NextResponse.json(invoices);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في جلب فواتير البيع" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceNumber, customer, notes, invoiceDate, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "يجب إضافة منتج واحد على الأقل" }, { status: 400 });
    }

    let totalSaleAmount = 0;
    let totalCostAmount = 0;

    // Validate quantities first
    for (const item of items) {
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (!prod) {
        return NextResponse.json({ error: `المنتج غير موجود` }, { status: 400 });
      }

      const available = parseFloat(prod.quantity ?? "0");
      const requested = parseFloat(item.quantity);

      if (requested > available) {
        return NextResponse.json(
          { error: `الكمية المطلوبة من "${prod.name}" (${requested}) تتجاوز المخزون المتاح (${available})` },
          { status: 400 }
        );
      }

      totalSaleAmount += requested * parseFloat(prod.salePrice ?? "0");
      totalCostAmount += requested * parseFloat(prod.costPrice ?? "0");
    }

    // Create invoice
    const [invoice] = await db
      .insert(salesInvoices)
      .values({
        invoiceNumber,
        customer: customer ?? "",
        notes: notes ?? "",
        totalAmount: String(totalSaleAmount),
        totalCost: String(totalCostAmount),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      })
      .returning();

    // Create items + update stock
    for (const item of items) {
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (!prod) continue;

      const qty = parseFloat(item.quantity);
      const saleP = parseFloat(prod.salePrice ?? "0");
      const costP = parseFloat(prod.costPrice ?? "0");

      await db.insert(salesInvoiceItems).values({
        invoiceId: invoice.id,
        productId: item.productId,
        quantity: String(qty),
        salePrice: String(saleP),
        costPrice: String(costP),
        totalSale: String(qty * saleP),
        totalCost: String(qty * costP),
      });

      // Decrease quantity
      const newQty = parseFloat(prod.quantity ?? "0") - qty;
      await db
        .update(products)
        .set({ quantity: String(newQty), updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل في إنشاء فاتورة البيع" }, { status: 500 });
  }
}
