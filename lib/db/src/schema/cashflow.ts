import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cashflowTransactionsTable = pgTable("cashflow_transactions", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  receiptImage: text("receipt_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCashflowTransactionSchema = createInsertSchema(cashflowTransactionsTable);
export type InsertCashflowTransaction = typeof cashflowTransactionsTable.$inferInsert;
export type CashflowTransaction = typeof cashflowTransactionsTable.$inferSelect;
