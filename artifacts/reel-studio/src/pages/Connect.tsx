import * as React from "react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Link2, Unlink, CheckCircle2, AlertCircle, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionInfo {
  id: number;
  platform: string;
  username: string | null;
  status: string;
  hasCredentials: boolean;
}

interface PlatformDef {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  docsUrl: string;
  guideText: string;
  canPost: boolean;
}

// Twitter/X removed — Instagram only for direct posting
const PLATFORMS: PlatformDef[] = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    bgGradient: "from-pink-900 to-purple-900",
    description: "Publish image reels to your Instagram Business account",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    guideText:
      "Requires an Instagram Business Account connected to a Facebook Page. Get a Page Access Token and your Instagram Account ID from Meta Business Suite.",
    canPost: true,
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAxxxxxxxxxxxx..." },
      { key: "pageId", label: "Instagram Account ID", placeholder: "1234567890" },
      { key: "username", label: "Instagram Username (optional)", placeholder: "@yourbrand" },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#010101",
    bgGradient: "from-gray-900 to-slate-800",
    description: "Video posting via TikTok for Business API",
    docsUrl: "https://developers.tiktok.com",
    guideText:
      "TikTok's API for direct video posting requires a TikTok for Business account and is available by application only. Export your video reel and upload it manually via TikTok Studio.",
    canPost: false,
    fields: [{ key: "username", label: "TikTok Username", placeholder: "@yourbrand" }],
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    color: "#FF0000",
    bgGradient: "from-red-900 to-rose-900",
    description: "Upload Shorts to your YouTube channel",
    docsUrl: "https://developers.google.com/youtube",
    guideText:
      "YouTube upload requires OAuth 2.0 with the youtube.upload scope. Export your video and use YouTube Studio for direct uploads — no API key needed for manual posting.",
    canPost: false,
    fields: [{ key: "username", label: "Channel Name", placeholder: "Your Channel" }],
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    bgGradient: "from-blue-900 to-blue-800",
    description: "Share to Facebook Pages and profiles",
    docsUrl: "https://developers.facebook.com",
    guideText:
      "Use Meta Graph API with a Page Access Token. Your app must be reviewed for the pages_manage_posts permission. Export and use Meta Business Suite for manual posting.",
    canPost: false,
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAxxxxxxxxxxxx..." },
      { key: "pageId", label: "Facebook Page ID", placeholder: "1234567890" },
      { key: "username", label: "Page Name (optional)", placeholder: "Your Page Name" },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    bgGradient: "from-blue-900 to-cyan-900",
    description: "Publish to your LinkedIn profile or company page",
    docsUrl: "https://developer.linkedin.com",
    guideText:
      "LinkedIn's API requires app review for content posting. Export your reel and post via LinkedIn Creator Studio for best results.",
    canPost: false,
    fields: [{ key: "username", label: "LinkedIn Profile URL", placeholder: "https://linkedin.com/in/yourname" }],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "#E60023",
    bgGradient: "from-rose-900 to-red-800",
    description: "Pin quote images to boards for long-term discovery",
    docsUrl: "https://developers.pinterest.com",
    guideText:
      "Pinterest API v5 supports pin creation. Export your quote image (PNG) and upload via the Pinterest Business hub, or use Tailwind/Buffer for scheduling.",
    canPost: false,
    fields: [{ key: "username", label: "Pinterest Username", placeholder: "@yourbrand" }],
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  tiktok:    "🎵",
  youtube:   "▶",
  facebook:  "f",
  linkedin:  "in",
  pinterest: "P",
};

export default function Connect() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<PlatformDef | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/social/connections");
      if (res.ok) setConnections(await res.json());
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); }, []);

  const getConnection = (platformId: string) => connections.find((c) => c.platform === platformId);

  const openConnect = (platform: PlatformDef) => {
    setActivePlatform(platform);
    const existing = getConnection(platform.id);
    const initial: Record<string, string> = {};
    platform.fields.forEach((f) => { initial[f.key] = ""; });
    if (existing?.username) initial.username = existing.username;
    setForm(initial);
  };

  const handleSave = async () => {
    if (!activePlatform) return;
    setSaving(true);
    try {
      const res = await fetch("/api/social/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: activePlatform.id, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: `${activePlatform.name} connected`, description: "Credentials saved." });
      setActivePlatform(null);
      fetchConnections();
    } catch (err: unknown) {
      toast({ title: "Failed to save", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (platformId: string, name: string) => {
    setDisconnecting(platformId);
    try {
      await fetch(`/api/social/connections/${platformId}`, { method: "DELETE" });
      toast({ title: `${name} disconnected` });
      fetchConnections();
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Social Connect</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect your accounts to post reels directly, or save usernames to track where you post.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading connections...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => {
            const conn = getConnection(platform.id);
            const isConnected = !!conn?.hasCredentials;
            return (
              <div
                key={platform.id}
                className={cn(
                  "relative rounded-xl border border-border/50 overflow-hidden bg-gradient-to-br p-5 flex flex-col gap-4",
                  platform.bgGradient
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                      style={{ backgroundColor: `${platform.color}99` }}
                    >
                      {PLATFORM_ICONS[platform.id]}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{platform.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Connected</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs text-zinc-400">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {platform.canPost && (
                    <Badge variant="secondary" className="text-[10px] bg-white/10 text-white border-white/20">
                      Direct post
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-white/60 leading-relaxed">{platform.description}</p>

                {conn?.username && (
                  <p className="text-xs text-white/50 font-mono truncate">{conn.username}</p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    size="sm"
                    variant={isConnected ? "outline" : "default"}
                    className={cn(
                      "flex-1 text-xs",
                      isConnected
                        ? "border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                        : "bg-white text-black hover:bg-white/90"
                    )}
                    onClick={() => openConnect(platform)}
                  >
                    <Link2 className="h-3 w-3 mr-1.5" />
                    {isConnected ? "Update" : "Connect"}
                  </Button>
                  {isConnected && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-red-400 hover:bg-white/5 text-xs px-2"
                      onClick={() => handleDisconnect(platform.id, platform.name)}
                      disabled={disconnecting === platform.id}
                    >
                      {disconnecting === platform.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Unlink className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex gap-3 p-4 rounded-xl bg-card border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">About Social Connect</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Credentials are stored in your local database. Instagram supports direct posting — export your reel
            as a PNG image, then use the Post button on any saved reel. All other platforms show upload guides
            for manual posting via their native apps or scheduling tools like Buffer or Later.
          </p>
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!activePlatform} onOpenChange={(o) => !o && setActivePlatform(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {activePlatform && (
            <>
              <DialogHeader>
                <DialogTitle>Connect {activePlatform.name}</DialogTitle>
                <DialogDescription>{activePlatform.description}</DialogDescription>
              </DialogHeader>

              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-xs text-muted-foreground leading-relaxed">
                {activePlatform.guideText}
                <a
                  href={activePlatform.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Open developer docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-4 py-2">
                {activePlatform.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-semibold">{field.label}</Label>
                    <Input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setActivePlatform(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Connection
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
