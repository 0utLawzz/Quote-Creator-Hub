import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reelsTable = pgTable("reels", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  author: text("author"),
  category: text("category").notNull(),
  templateId: text("template_id").notNull().default("dark-gold"),
  status: text("status").notNull().default("draft"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  captionText: text("caption_text"),
  hashtags: text("hashtags"),
  platforms: text("platforms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReelSchema = createInsertSchema(reelsTable).omit({ id: true, createdAt: true });
export type InsertReel = z.infer<typeof insertReelSchema>;
export type Reel = typeof reelsTable.$inferSelect;
