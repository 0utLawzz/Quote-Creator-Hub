import { Router } from "express";
import { db, reelsTable, schedulesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { insertReelSchema } from "@workspace/db";

const router = Router();

// GET /reels/recent — must be before /reels/:id
router.get("/reels/recent", async (req, res) => {
  try {
    const reels = await db
      .select()
      .from(reelsTable)
      .orderBy(desc(reelsTable.createdAt))
      .limit(6);
    res.json(reels.map(formatReel));
  } catch (err) {
    req.log.error({ err }, "Failed to get recent reels");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats
router.get("/stats", async (req, res) => {
  try {
    const [totalReels] = await db.select({ count: count() }).from(reelsTable);
    const [scheduledPosts] = await db.select({ count: count() }).from(schedulesTable).where(eq(schedulesTable.status, "pending"));
    const [postedReels] = await db.select({ count: count() }).from(reelsTable).where(eq(reelsTable.status, "posted"));
    const [draftReels] = await db.select({ count: count() }).from(reelsTable).where(eq(reelsTable.status, "draft"));
    const [favoriteReels] = await db.select({ count: count() }).from(reelsTable).where(eq(reelsTable.isFavorite, true));

    const topCategoryResult = await db
      .select({ category: reelsTable.category, cnt: count() })
      .from(reelsTable)
      .groupBy(reelsTable.category)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    res.json({
      totalReels: Number(totalReels.count),
      scheduledPosts: Number(scheduledPosts.count),
      postedReels: Number(postedReels.count),
      draftReels: Number(draftReels.count),
      favoriteReels: Number(favoriteReels.count),
      topCategory: topCategoryResult[0]?.category ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reels
router.get("/reels", async (req, res) => {
  try {
    const { category, status } = req.query as { category?: string; status?: string };
    let query = db.select().from(reelsTable);
    
    const conditions = [];
    if (category) conditions.push(eq(reelsTable.category, category));
    if (status) conditions.push(eq(reelsTable.status, status));

    const reels = await (conditions.length > 0
      ? db.select().from(reelsTable).where(sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`)
      : db.select().from(reelsTable))
      .orderBy(desc(reelsTable.createdAt));

    res.json(reels.map(formatReel));
  } catch (err) {
    req.log.error({ err }, "Failed to list reels");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reels
router.post("/reels", async (req, res) => {
  try {
    const parsed = insertReelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reel data" });
      return;
    }
    const [reel] = await db.insert(reelsTable).values(parsed.data).returning();
    res.status(201).json(formatReel(reel));
  } catch (err) {
    req.log.error({ err }, "Failed to create reel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reels/:id
router.get("/reels/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [reel] = await db.select().from(reelsTable).where(eq(reelsTable.id, id));
    if (!reel) { res.status(404).json({ error: "Reel not found" }); return; }
    res.json(formatReel(reel));
  } catch (err) {
    req.log.error({ err }, "Failed to get reel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /reels/:id
router.patch("/reels/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [reel] = await db.update(reelsTable).set(req.body).where(eq(reelsTable.id, id)).returning();
    if (!reel) { res.status(404).json({ error: "Reel not found" }); return; }
    res.json(formatReel(reel));
  } catch (err) {
    req.log.error({ err }, "Failed to update reel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /reels/:id
router.delete("/reels/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(reelsTable).where(eq(reelsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete reel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /reels/:id/favorite
router.patch("/reels/:id/favorite", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select().from(reelsTable).where(eq(reelsTable.id, id));
    if (!current) { res.status(404).json({ error: "Reel not found" }); return; }
    const [updated] = await db
      .update(reelsTable)
      .set({ isFavorite: !current.isFavorite })
      .where(eq(reelsTable.id, id))
      .returning();
    res.json(formatReel(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to toggle favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatReel(reel: typeof reelsTable.$inferSelect) {
  return {
    ...reel,
    createdAt: reel.createdAt.toISOString(),
  };
}

export default router;
