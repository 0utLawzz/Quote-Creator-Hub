import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const connectionsTable = pgTable("connections", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  username: text("username"),
  accessToken: text("access_token"),
  accessTokenSecret: text("access_token_secret"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  pageId: text("page_id"),
  status: text("status").default("connected").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertConnection = typeof connectionsTable.$inferInsert;
export type Connection = typeof connectionsTable.$inferSelect;
