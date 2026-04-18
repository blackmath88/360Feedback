import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  type: text("type", { enum: ["self", "external", "comparison"] }).notNull(),
  releaseState: text("release_state", { enum: ["draft", "reviewed", "released"] }).notNull().default("draft"),
  data: jsonb("data").notNull().default({}),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, generatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
