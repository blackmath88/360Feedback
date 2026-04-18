import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentInstancesTable = pgTable("assessment_instances", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  type: text("type", { enum: ["self", "external"] }).notNull(),
  status: text("status", { enum: ["pending", "in_progress", "submitted"] }).notNull().default("pending"),
  respondentName: text("respondent_name"),
  respondentEmail: text("respondent_email"),
  token: text("token").unique(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssessmentInstanceSchema = createInsertSchema(assessmentInstancesTable).omit({ id: true, createdAt: true });
export type InsertAssessmentInstance = z.infer<typeof insertAssessmentInstanceSchema>;
export type AssessmentInstance = typeof assessmentInstancesTable.$inferSelect;
