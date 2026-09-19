import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shopeeOrdersTable = pgTable("shopee_orders", {
  id: text("id").primaryKey(),
  orderNo: text("order_no").notNull(),
  items: jsonb("items").notNull().$type<{productId: string; qty: number;}[]>(),
  total: integer("total").notNull(),
  status: text("status").notNull(), // 'new' | 'ready' | 'completed'
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertShopeeOrderSchema = createInsertSchema(shopeeOrdersTable);
export type InsertShopeeOrder = typeof shopeeOrdersTable.$inferInsert;
export type ShopeeOrder = typeof shopeeOrdersTable.$inferSelect;
