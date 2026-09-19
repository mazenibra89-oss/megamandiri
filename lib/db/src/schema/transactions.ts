import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  receiptNo: text("receipt_no").notNull(),
  branchId: text("branch_id").notNull(),
  date: timestamp("date").notNull(),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull(), // 'success' | 'void'
  items: jsonb("items").notNull().$type<{productId: string; name: string; qty: number; price: number;}[]>(),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable);
export type InsertTransaction = typeof transactionsTable.$inferInsert;
export type Transaction = typeof transactionsTable.$inferSelect;
