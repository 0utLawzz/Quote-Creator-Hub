import { Router } from "express";
import { db, schedulesTable, reelsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /schedules
router.get("/schedules", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: schedulesTable.id,
        reelId: schedulesTable.reelId,
        platform: schedulesTable.platform,
        scheduledAt: schedulesTable.scheduledAt,
        status: schedulesTable.status,
        createdAt: schedulesTable.createdAt,
        reel: reelsTable,
      })
      .from(schedulesTable)
      .leftJoin(reelsTable, eq(schedulesTable.reelId, reelsTable.id))
      .orderBy(desc(schedulesTable.scheduledAt));

    res.json(rows.map((r) => ({
      ...r,
      scheduledAt: r.scheduledAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      reel: r.reel ? { ...r.reel, createdAt: r.reel.createdAt.toISOString() } : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list schedules");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /schedules
router.post("/schedules", async (req, res) => {
  try {
    const { reelId, platform, scheduledAt } = req.body as { reelId: number; platform: string; scheduledAt: string };
    const [schedule] = await db
      .insert(schedulesTable)
      .values({ reelId, platform, scheduledAt: new Date(scheduledAt) })
      .returning();

    // Also update the reel status to scheduled
    await db.update(reelsTable).set({ status: "scheduled" }).where(eq(reelsTable.id, reelId));

    res.status(201).json({
      ...schedule,
      scheduledAt: schedule.scheduledAt.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create schedule");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /schedules/:id
router.delete("/schedules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schedulesTable).where(eq(schedulesTable.id, id)).returning();
    if (deleted) {
      // Revert reel back to draft
      await db.update(reelsTable).set({ status: "draft" }).where(eq(reelsTable.id, deleted.reelId));
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete schedule");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
