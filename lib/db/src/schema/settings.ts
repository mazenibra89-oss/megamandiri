import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey(), // We'll just use '1' or 'default'
  storeName: text("store_name").notNull(),
  receiptFooter: text("receipt_footer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable);
export type InsertSettings = typeof settingsTable.$inferInsert;
export type Settings = typeof settingsTable.$inferSelect;
