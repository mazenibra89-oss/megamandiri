import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shiftsTable = pgTable("shifts", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  initialCash: integer("initial_cash").notNull(),
  finalCash: integer("final_cash"),
  status: text("status").notNull(), // 'active' | 'closed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertShiftSchema = createInsertSchema(shiftsTable);
export type InsertShift = typeof shiftsTable.$inferInsert;
export type Shift = typeof shiftsTable.$inferSelect;
