import {
  pgTable,
  serial,
  varchar,
  numeric,
  integer,
  timestamp,
  text,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Products / Inventory ───────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull().default("قطعة"),
  quantity: numeric("quantity", { precision: 14, scale: 3 })
    .notNull()
    .default("0"),
  minQuantity: numeric("min_quantity", { precision: 14, scale: 3 })
    .notNull()
    .default("5"),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  openingStock: numeric("opening_stock", { precision: 14, scale: 3 })
    .notNull()
    .default("0"),
  openingCostPrice: numeric("opening_cost_price", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Purchase Invoices ───────────────────────────────────────────────────────
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  supplier: varchar("supplier", { length: 255 }).default(""),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  notes: text("notes").default(""),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseInvoiceItems = pgTable("purchase_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => purchaseInvoices.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 14, scale: 2 }).notNull(),
});

// ─── Sales Invoices ──────────────────────────────────────────────────────────
export const salesInvoices = pgTable("sales_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  customer: varchar("customer", { length: 255 }).default(""),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  totalCost: numeric("total_cost", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  notes: text("notes").default(""),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesInvoiceItems = pgTable("sales_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => salesInvoices.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }).notNull(),
  totalSale: numeric("total_sale", { precision: 14, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 14, scale: 2 }).notNull(),
});

// ─── Expenses ────────────────────────────────────────────────────────────────
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id, {
    onDelete: "set null",
  }),
  description: varchar("description", { length: 500 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
