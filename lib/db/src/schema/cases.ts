import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetPersonId: integer("target_person_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  status: text("status", {
    enum: [
      "draft",
      "self_assessment_open",
      "external_assessment_open",
      "collecting_responses",
      "ready_for_report",
      "report_generated",
      "reviewed",
      "released",
      "closed",
    ],
  }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
