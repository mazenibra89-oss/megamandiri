import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit"),
  cost: integer("cost"),
  price: integer("price").notNull(),
  stock: jsonb("stock").notNull().$type<Record<string, number>>(),
  minStock: integer("min_stock"),
  shopeeEnabled: boolean("shopee_enabled").default(false),
  wholesaleTiers: jsonb("wholesale_tiers").$type<{minQty: number; price: number}[]>(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable);
export type InsertProduct = typeof productsTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;
