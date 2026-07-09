import { z } from "zod";
import { type ReelInput, type ReelUpdate, type ScheduleInput, type QuoteRequest } from "@workspace/api-client-react";

export const createReelSchema = z.object({
  quote: z.string().min(1, "Quote is required"),
  author: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  templateId: z.string().min(1, "Template is required"),
  captionText: z.string().optional(),
  hashtags: z.string().optional(),
  platforms: z.string().optional(),
}) satisfies z.ZodType<ReelInput>;

export const scheduleReelSchema = z.object({
  reelId: z.number(),
  platform: z.string().min(1, "Platform is required"),
  scheduledAt: z.string().min(1, "Schedule time is required"),
}) satisfies z.ZodType<ScheduleInput>;

export const quoteRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  mood: z.string().optional(),
  customPrompt: z.string().optional(),
}) satisfies z.ZodType<QuoteRequest>;
