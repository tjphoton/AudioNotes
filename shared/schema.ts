import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  originalTranscription: text("original_transcription").notNull(),
  aiProcessedNote: text("ai_processed_note").notNull(),
  audioFilePath: text("audio_file_path"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  outputLanguage: text("output_language").default("en"),
  transcriptionModel: text("transcription_model").default("whisper-1"),
  audioQuality: text("audio_quality").default("high"),
  noteOrganizationStyle: text("note_organization_style").default("minimal"),
  keepRawAudio: boolean("keep_raw_audio").default(true),
  dataRetention: text("data_retention").default("forever"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  language: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  userId: true,
  title: true,
  originalTranscription: true,
  aiProcessedNote: true,
  audioFilePath: true,
  duration: true,
  fileSize: true,
  language: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  outputLanguage: true,
  transcriptionModel: true,
  audioQuality: true,
  noteOrganizationStyle: true,
  keepRawAudio: true,
  dataRetention: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
