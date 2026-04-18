import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const responseSetsTable = pgTable("response_sets", {
  id: serial("id").primaryKey(),
  assessmentInstanceId: integer("assessment_instance_id").notNull().unique(),
  answers: jsonb("answers").notNull().default({}),
  comments: jsonb("comments").notNull().default({}),
  savedAt: timestamp("saved_at", { withTimezone: true }),
});

export const insertResponseSetSchema = createInsertSchema(responseSetsTable).omit({ id: true });
export type InsertResponseSet = z.infer<typeof insertResponseSetSchema>;
export type ResponseSet = typeof responseSetsTable.$inferSelect;
