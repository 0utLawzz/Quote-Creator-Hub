import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { connectionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// List all platform connections
router.get("/connections", async (_req: Request, res: Response) => {
  try {
    const connections = await db.select().from(connectionsTable);
    const safe = connections.map((c) => ({
      id: c.id,
      platform: c.platform,
      username: c.username,
      status: c.status,
      createdAt: c.createdAt,
      hasCredentials: !!(c.accessToken || c.apiKey),
    }));
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load connections" });
  }
});

// Save / update platform credentials
router.post("/connections", async (req: Request, res: Response) => {
  const { platform, username, accessToken, accessTokenSecret, apiKey, apiSecret, pageId } = req.body;
  if (!platform) {
    res.status(400).json({ error: "platform is required" });
    return;
  }
  try {
    const existing = await db.select().from(connectionsTable).where(eq(connectionsTable.platform, String(platform)));
    if (existing.length > 0) {
      await db.update(connectionsTable)
        .set({ username, accessToken, accessTokenSecret, apiKey, apiSecret, pageId, status: "connected", updatedAt: new Date() })
        .where(eq(connectionsTable.platform, String(platform)));
    } else {
      await db.insert(connectionsTable).values({
        platform: String(platform), username, accessToken, accessTokenSecret, apiKey, apiSecret, pageId, status: "connected",
      });
    }
    res.json({ success: true, platform });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save connection" });
  }
});

// Remove a platform connection
router.delete("/connections/:platform", async (req: Request, res: Response) => {
  try {
    await db.delete(connectionsTable).where(eq(connectionsTable.platform, String(req.params.platform)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove connection" });
  }
});

// Post content to a platform
router.post("/post", async (req: Request, res: Response) => {
  const { platform, text, imageUrl } = req.body as { platform?: string; text?: string; imageUrl?: string };
  if (!platform || !text) {
    res.status(400).json({ error: "platform and text are required" });
    return;
  }
  try {
    const [conn] = await db.select().from(connectionsTable).where(eq(connectionsTable.platform, platform));
    if (!conn) {
      res.status(404).json({ error: `No connection found for ${platform}` });
      return;
    }
    if (platform === "twitter") {
      const result = await postToTwitter(conn, text);
      res.json(result);
      return;
    }
    if (platform === "instagram") {
      if (!imageUrl) {
        res.status(400).json({ error: "imageUrl is required for Instagram" });
        return;
      }
      const result = await postToInstagram(conn, text, imageUrl);
      res.json(result);
      return;
    }
    res.status(400).json({ error: `Direct posting for ${platform} requires OAuth flow setup` });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Posting failed";
    res.status(500).json({ error: msg });
  }
});

async function postToTwitter(conn: typeof connectionsTable.$inferSelect, text: string) {
  if (!conn.apiKey || !conn.apiSecret || !conn.accessToken || !conn.accessTokenSecret) {
    throw new Error("Twitter requires API Key, API Secret, Access Token, and Access Token Secret");
  }
  const { createHmac, createHash } = await import("crypto");

  const method = "POST";
  const url = "https://api.twitter.com/2/tweets";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = createHash("sha256").update(Math.random().toString()).digest("hex").substring(0, 32);

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: conn.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: conn.accessToken,
    oauth_version: "1.0",
  };

  const sortedParams = Object.keys(oauthParams).sort().map(
    (k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`
  ).join("&");

  const baseStr = [method, encodeURIComponent(url), encodeURIComponent(sortedParams)].join("&");
  const signingKey = `${encodeURIComponent(conn.apiSecret)}&${encodeURIComponent(conn.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseStr).digest("base64");

  const allParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  const authHeader =
    "OAuth " +
    Object.keys(allParams).sort().map(
      (k) => `${encodeURIComponent(k)}="${encodeURIComponent(allParams[k])}"`
    ).join(", ");

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Twitter API error: ${err}`);
  }
  return { success: true, platform: "twitter", data: await resp.json() as unknown };
}

async function postToInstagram(conn: typeof connectionsTable.$inferSelect, caption: string, imageUrl: string) {
  if (!conn.accessToken || !conn.pageId) {
    throw new Error("Instagram requires an Access Token and Instagram Business Account ID");
  }
  const createResp = await fetch(
    `https://graph.facebook.com/v19.0/${conn.pageId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${conn.accessToken}`,
    { method: "POST" }
  );
  if (!createResp.ok) throw new Error(`Instagram create media failed: ${await createResp.text()}`);
  const createData = await createResp.json() as { id?: string };
  const creationId = createData.id;

  const publishResp = await fetch(
    `https://graph.facebook.com/v19.0/${conn.pageId}/media_publish?creation_id=${creationId}&access_token=${conn.accessToken}`,
    { method: "POST" }
  );
  if (!publishResp.ok) throw new Error(`Instagram publish failed: ${await publishResp.text()}`);
  return { success: true, platform: "instagram", data: await publishResp.json() as unknown };
}

export default router;
