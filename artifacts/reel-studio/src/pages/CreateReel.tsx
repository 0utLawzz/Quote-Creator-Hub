import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useListTemplates, useGetReel, useCreateReel, useUpdateReel, useGenerateQuote,
  getListReelsQueryKey, getGetRecentReelsQueryKey, getGetStatsQueryKey, getGetReelQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Download, Save, Check, Loader2, Image, Video,
  Upload, X, Type, Hash, AlignLeft, AlignCenter, AlignRight,
  Music, Zap, Clock, Star, Wand2, MoveVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  FONTS, TRANSITION_EFFECTS, DURATION_PRESETS, QUALITY_PRESETS,
  TEXT_EFFECTS, FONT_SIZE_OPTIONS, TEXT_POSITION_OPTIONS,
  renderVideo, type VideoConfig, type TransitionEffect, type QualityPreset,
  type TextEffect, type FontSizeScale, type TextPosition,
} from "@/lib/video-renderer";

const CATEGORIES = [
  "motivation", "success", "love", "wisdom",
  "friendship", "courage", "life", "mindfulness",
];
const PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "Pinterest", "LinkedIn", "Facebook"];

const BASE = import.meta.env.BASE_URL ?? "/";
const BUILTIN_TRACKS = [
  { id: "morning-pages",   name: "Morning Pages",   url: `${BASE}music/morning-pages.mp3` },
  { id: "morning-pages-2", name: "Morning Pages 2",  url: `${BASE}music/morning-pages-2.mp3` },
  { id: "summit-pulse",    name: "Summit Pulse",     url: `${BASE}music/summit-pulse.mp3` },
  { id: "bright-path",     name: "Bright Path",      url: `${BASE}music/bright-path.mp3` },
  { id: "rising-dawn",     name: "Rising Dawn",      url: `${BASE}music/rising-dawn.mp3` },
  { id: "rising-dawn-2",   name: "Rising Dawn 2",    url: `${BASE}music/rising-dawn-2.mp3` },
];
const PRESET_LOGOS = [
  { id: "outlawz-red",   name: "Outlawz",       url: `${BASE}logos/outlawz-red.png` },
  { id: "outlawz-rings", name: "Outlawz Rings",  url: `${BASE}logos/outlawz-rings.png` },
];
const SCENES = [
  { id: "category", label: "Category" },
  { id: "quote",    label: "Quote" },
  { id: "author",   label: "Author" },
  { id: "branding", label: "Brand" },
] as const;
type SceneId = "category" | "quote" | "author" | "branding";
type Mode = "image" | "video";

interface CustomBg { type: "image" | "video"; url: string; name: string; }
interface CustomTemplate { bgColor: string; textColor: string; accentColor: string; }

export default function CreateReel() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editId = params.get("id") ? Number(params.get("id")) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ── Content state ──────────────────────────────────────────────────────
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("motivation");
  const [captionText, setCaptionText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram"]);
  const [status, setStatus] = useState<"draft" | "posted" | "scheduled">("draft");
  const [brandName, setBrandName] = useState("REEL STUDIO");

  // ── Visual state ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("image");
  const [selectedTemplateId, setSelectedTemplateId] = useState("dark-gold");
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<CustomTemplate>({
    bgColor: "#0a0a0a", textColor: "#f5e6c8", accentColor: "#c9a84c",
  });
  const [selectedFontId, setSelectedFontId] = useState("playfair");
  const [customBg, setCustomBg] = useState<CustomBg | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [activeScene, setActiveScene] = useState<SceneId>("category");

  // ── Video settings ─────────────────────────────────────────────────────
  const [transition, setTransition] = useState<TransitionEffect>("fade");
  const [duration, setDuration] = useState(15000);
  const [quality, setQuality] = useState<QualityPreset>("1080p");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const [audioVolume, setAudioVolume] = useState(70); // 0–100

  // ── Typography & text effects ──────────────────────────────────────────
  const [sceneEffects, setSceneEffects] = useState<{ category: TextEffect; quote: TextEffect; author: TextEffect }>({ category: "none", quote: "none", author: "none" });
  const [animationSpeed, setAnimationSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [authorChoreographed, setAuthorChoreographed] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>("md");
  const [textPosition, setTextPosition] = useState<TextPosition>("center");
  const [textAlignMode, setTextAlignMode] = useState<"left" | "center" | "right">("center");

  // ── Export quality (image) ─────────────────────────────────────────────
  const [imageScale, setImageScale] = useState<2 | 3 | 6>(3); // 2=1080, 3=2K, 6=4K

  // ── UI state ───────────────────────────────────────────────────────────
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showCustomColors, setShowCustomColors] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useListTemplates();
  const { data: existingReel } = useGetReel(editId!, {
    query: { enabled: !!editId, queryKey: getGetReelQueryKey(editId ?? 0) },
  });
  const createReel = useCreateReel();
  const updateReel = useUpdateReel();
  const generateQuote = useGenerateQuote();

  useEffect(() => {
    if (existingReel) {
      setQuote(existingReel.quote);
      setAuthor(existingReel.author ?? "");
      setCategory(existingReel.category);
      setSelectedTemplateId(existingReel.templateId);
      setStatus((existingReel.status as "draft" | "posted" | "scheduled") ?? "draft");
      setCaptionText(existingReel.captionText ?? "");
      setHashtags(existingReel.hashtags ?? "");
      if (existingReel.platforms) {
        setSelectedPlatforms(existingReel.platforms.split(",").map((p) => p.trim()));
      }
    }
  }, [existingReel]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (customBg) URL.revokeObjectURL(customBg.url);
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTemplate = useCustomTemplate
    ? { id: "custom", name: "Custom", bgColor: customTemplate.bgColor, textColor: customTemplate.textColor, accentColor: customTemplate.accentColor, fontStyle: "serif", description: "Your custom colors" }
    : (templates?.find((t) => t.id === selectedTemplateId) ?? {
        id: "dark-gold", name: "Dark Gold", bgColor: "#0a0a0a", textColor: "#f5e6c8", accentColor: "#c9a84c",
        fontStyle: "serif", description: "",
      });
  const activeFont = FONTS.find((f) => f.id === selectedFontId) ?? FONTS[0];

  // ── Upload handlers ────────────────────────────────────────────────────
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customBg) URL.revokeObjectURL(customBg.url);
    const url = URL.createObjectURL(file);
    setCustomBg({ type: file.type.startsWith("video/") ? "video" : "image", url, name: file.name });
  };
  const clearBg = () => {
    if (customBg) URL.revokeObjectURL(customBg.url);
    setCustomBg(null);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(URL.createObjectURL(file));
    setLogoName(file.name);
  };
  const clearLogo = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
    setLogoName("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
  };
  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioName("");
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // ── Generate quote ─────────────────────────────────────────────────────
  const handleGenerate = () => {
    generateQuote.mutate(
      { data: { category, mood: undefined, customPrompt: undefined } },
      {
        onSuccess: (data) => {
          setQuote(data.quote);
          setAuthor(data.author);
          if (data.suggestedHashtags) setHashtags(data.suggestedHashtags);
          toast({ title: "Quote generated" });
          // Log generated quote for deduplication tracking
          try {
            const log = JSON.parse(localStorage.getItem("reel-studio-quote-log") || "[]");
            log.unshift({ quote: data.quote, author: data.author || "", category, generatedAt: new Date().toISOString() });
            localStorage.setItem("reel-studio-quote-log", JSON.stringify(log.slice(0, 100)));
          } catch { /* ignore storage errors */ }
        },
        onError: () => toast({ title: "Generation failed", variant: "destructive" }),
      }
    );
  };

  // ── Save reel ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!quote.trim()) { toast({ title: "Quote required", variant: "destructive" }); return; }
    const data = {
      quote: quote.trim(), author: author.trim() || undefined, category,
      templateId: selectedTemplateId,
      status,
      captionText: captionText.trim() || undefined,
      hashtags: hashtags.trim() || undefined,
      platforms: selectedPlatforms.join(",") || undefined,
    };
    if (editId) {
      updateReel.mutate({ id: editId, data }, {
        onSuccess: () => {
          setSaved(true); setTimeout(() => setSaved(false), 2000);
          queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
          toast({ title: "Reel updated" });
        },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      });
    } else {
      createReel.mutate({ data }, {
        onSuccess: (reel) => {
          queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentReelsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          toast({ title: "Reel saved" });
          setLocation(`/create?id=${reel.id}`);
        },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      });
    }
  };

  // ── Image export ───────────────────────────────────────────────────────
  const handleDownloadImage = useCallback(async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(previewRef.current, {
        scale: imageScale, useCORS: true, backgroundColor: activeTemplate.bgColor, logging: false,
      });
      const link = document.createElement("a");
      const qualityLabel = imageScale === 2 ? "1080" : imageScale === 3 ? "2K" : "4K";
      link.download = `reel-${qualityLabel}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: `Downloaded as PNG (${qualityLabel})` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  }, [activeTemplate.bgColor, imageScale, toast]);

  // ── Video export ───────────────────────────────────────────────────────
  const handleExportVideo = useCallback(async () => {
    if (!quote.trim()) { toast({ title: "Quote required to export video", variant: "destructive" }); return; }
    setIsRecording(true);
    setVideoProgress(0);
    try {
      const cfg: VideoConfig = {
        quote: quote.trim(),
        author: author.trim() || "Unknown",
        category,
        template: {
          bgColor: activeTemplate.bgColor,
          textColor: activeTemplate.textColor,
          accentColor: activeTemplate.accentColor,
        },
        fontFamily: activeFont.family,
        brandName: brandName || "REEL STUDIO",
        logoUrl: logoUrl ?? undefined,
        bgImageUrl: customBg?.type === "image" ? customBg.url : undefined,
        bgVideoUrl: customBg?.type === "video" ? customBg.url : undefined,
        audioUrl: audioUrl ?? undefined,
        audioVolume: audioVolume / 100,
        transition,
        duration,
        quality,
        sceneEffects,
        animationSpeed,
        authorChoreographed,
        fontSizeScale,
        textPosition,
        textAlign: textAlignMode,
        onProgress: setVideoProgress,
      };
      const blob = await renderVideo(cfg);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const durationLabel = DURATION_PRESETS.find((d) => d.value === duration)?.label ?? "custom";
      link.download = `reel-${quality}-${durationLabel}-${Date.now()}.webm`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast({ title: "Video exported!", description: `${durationLabel} · ${quality} WebM saved.` });
    } catch (err: unknown) {
      toast({ title: "Video export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsRecording(false);
      setVideoProgress(0);
    }
  }, [quote, author, category, activeTemplate, activeFont, brandName, logoUrl, customBg, audioUrl, audioVolume, transition, duration, quality, sceneEffects, animationSpeed, authorChoreographed, fontSizeScale, textPosition, textAlignMode, toast]);

  const togglePlatform = (platform: string) =>
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );

  const isSaving = createReel.isPending || updateReel.isPending;
  const durationLabel = DURATION_PRESETS.find((d) => d.value === duration)?.label ?? "?s";

  // ── Scene preview renderer (HTML) ──────────────────────────────────────
  const renderScenePreview = (scene: SceneId) => {
    const bg = activeTemplate.bgColor;
    const text = activeTemplate.textColor;
    const accent = activeTemplate.accentColor;
    const ff = activeFont.family;

    switch (scene) {
      case "category":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <div className="w-full h-px" style={{ backgroundColor: accent }} />
            <p className="font-black text-center leading-none"
              style={{
                fontFamily: ff, color: text,
                fontSize: `clamp(2rem, ${Math.max(1.5, 8 - category.length * 0.3)}vw, 5rem)`,
              }}>
              {category.toUpperCase()}
            </p>
            <div className="flex gap-2 items-center">
              {[-2, -1, 0, 1, 2].map((i) => (
                <div key={i} className="rounded-full"
                  style={{ width: i === 0 ? 8 : 5, height: i === 0 ? 8 : 5, backgroundColor: accent }} />
              ))}
            </div>
            <div className="w-full h-px" style={{ backgroundColor: accent }} />
          </div>
        );
      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-4">
            <div className="absolute top-6 left-6 text-4xl font-serif leading-none opacity-15"
              style={{ color: accent }}>&ldquo;</div>
            <p className="text-center leading-relaxed z-10"
              style={{
                fontFamily: ff, color: text,
                fontSize: quote.length > 100 ? "0.7rem" : quote.length > 60 ? "0.85rem" : "1rem",
                fontWeight: 500, lineHeight: 1.65,
              }}>
              {quote ? `"${quote}"` : <span style={{ opacity: 0.3 }}>Your quote will appear here...</span>}
            </p>
            <div className="w-8 h-px" style={{ backgroundColor: accent }} />
            <div className="absolute bottom-6 right-6 text-4xl font-serif leading-none opacity-15 rotate-180"
              style={{ color: accent }}>&ldquo;</div>
          </div>
        );
      case "author":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
            <div className="w-px h-12" style={{ backgroundColor: accent, opacity: 0.5 }} />
            <p className="text-[9px] font-sans tracking-[0.2em] uppercase" style={{ color: accent, opacity: 0.8 }}>
              — Words By —
            </p>
            <p className="font-bold text-center text-sm leading-tight" style={{ fontFamily: ff, color: text }}>
              {author || <span style={{ opacity: 0.3 }}>Author Name</span>}
            </p>
            <div className="w-px h-12" style={{ backgroundColor: accent, opacity: 0.5 }} />
          </div>
        );
      case "branding":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
            {/* Logo frame */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: logoUrl ? "transparent" : accent, border: logoUrl ? `2px solid ${accent}` : "none" }}>
              {logoUrl ? (
                <img src={logoUrl} className="w-full h-full object-cover" alt="logo" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill={bg}><polygon points="6,4 20,12 6,20" /></svg>
              )}
            </div>
            <p className="font-black text-center tracking-widest text-sm"
              style={{ fontFamily: "var(--app-font-sans)", color: text }}>
              {(brandName || "REEL STUDIO").toUpperCase()}
            </p>
            <div className="w-16 h-px" style={{ backgroundColor: accent }} />
          </div>
        );
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">

      {/* ── Left Panel ── */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex-shrink-0 lg:border-r border-border overflow-y-auto bg-sidebar/40 order-2 lg:order-1">
        <div className="p-6 space-y-5">

          {/* Mobile simplified form */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">{editId ? "Edit Reel" : "Create Reel"}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Quote, author, and publish.</p>
              </div>
              <div className="flex items-center gap-2">
                {mode === "image" ? (
                  <Button variant="outline" size="sm" onClick={handleDownloadImage}
                    disabled={isDownloading || !quote.trim()} className="border-border/60">
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span className="ml-1.5 text-xs">PNG</span>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleExportVideo}
                    disabled={isRecording || !quote.trim()} className="border-border/60">
                    {isRecording ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
                    <span className="ml-1.5 text-xs">{isRecording ? `${videoProgress}%` : "Export"}</span>
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={isSaving || !quote.trim()}
                  className="font-semibold shadow-primary/20 shadow-md">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : saved ? <Check className="h-3.5 w-3.5" />
                    : <Save className="h-3.5 w-3.5" />}
                  <span className="ml-1.5 text-xs">{saved ? "Saved" : "Save"}</span>
                </Button>
              </div>
            </div>

            <div className="flex rounded-lg overflow-hidden border border-border/60 p-0.5 bg-card/50">
              {(["image", "video"] as Mode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-200",
                    mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {m === "image" ? <Image className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  {m === "image" ? "Image" : "Video"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quote</Label>
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generateQuote.isPending}
                  className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium">
                  {generateQuote.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  Generate
                </Button>
              </div>
              <Textarea value={quote} onChange={(e) => setQuote(e.target.value)}
                placeholder="Enter your quote or click Generate..."
                className="min-h-[80px] resize-none bg-card/50 border-border/60 text-sm leading-relaxed font-serif" />
              <p className="text-right text-xs text-muted-foreground">{quote.length} chars</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Marcus Aurelius" className="bg-card/50 border-border/60 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-card/50 border-border/60 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="bg-card/50 border-border/60 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["draft", "posted", "scheduled"] as const).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
              <Textarea value={captionText} onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Caption for your post..."
                className="min-h-[60px] resize-none bg-card/50 border-border/60 text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</Label>
              <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
                placeholder="#motivation #mindset #quotes"
                className="bg-card/50 border-border/60 text-sm font-mono" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <button key={platform} onClick={() => togglePlatform(platform)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200",
                      selectedPlatforms.includes(platform)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        : "bg-card/50 text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                    )}>
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              For fonts, colors, animations, and music use the desktop studio.
            </p>
          </div>

          {/* Desktop form */}
          <div className="hidden lg:block space-y-5">

          {/* Header + actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{editId ? "Edit Reel" : "Create Reel"}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === "video" ? `${durationLabel} animated · ${quality}` : "Quote image export"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mode === "image" ? (
                <Button variant="outline" size="sm" onClick={handleDownloadImage}
                  disabled={isDownloading || !quote.trim()} className="border-border/60">
                  {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="ml-1.5 text-xs">PNG</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleExportVideo}
                  disabled={isRecording || !quote.trim()} className="border-border/60">
                  {isRecording ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
                  <span className="ml-1.5 text-xs">{isRecording ? `${videoProgress}%` : "Export"}</span>
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={isSaving || !quote.trim()}
                className="font-semibold shadow-primary/20 shadow-md">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : saved ? <Check className="h-3.5 w-3.5" />
                  : <Save className="h-3.5 w-3.5" />}
                <span className="ml-1.5 text-xs">{saved ? "Saved" : "Save"}</span>
              </Button>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border/60 p-0.5 bg-card/50">
            {(["image", "video"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-200",
                  mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {m === "image"
                  ? <><Image className="h-3.5 w-3.5" /> Image (PNG)</>
                  : <><Video className="h-3.5 w-3.5" /> Video ({durationLabel})</>}
              </button>
            ))}
          </div>

          <Separator className="opacity-40" />

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card/50 border-border/60 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quote</Label>
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generateQuote.isPending}
                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium">
                {generateQuote.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate
              </Button>
            </div>
            <Textarea value={quote} onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter your quote or click Generate..."
              className="min-h-[100px] resize-none bg-card/50 border-border/60 text-sm leading-relaxed font-serif" />
            <p className="text-right text-xs text-muted-foreground">{quote.length} chars</p>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Marcus Aurelius" className="bg-card/50 border-border/60 text-sm" />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="bg-card/50 border-border/60 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["draft", "posted", "scheduled"] as const).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="opacity-40" />

          {/* Font selector */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3 w-3" /> Font
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {FONTS.map((font) => (
                <button key={font.id} onClick={() => setSelectedFontId(font.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-md border text-left transition-all duration-200",
                    selectedFontId === font.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                  )}>
                  <p className="text-sm font-medium leading-none mb-0.5" style={{ fontFamily: font.family }}>{font.name}</p>
                  <p className="text-[10px] opacity-60">{font.style}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* Typography & Layout */}
          <div className="space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3 w-3" /> Typography &amp; Layout
            </Label>

            {/* Font size */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Font Size</p>
              <div className="flex gap-1">
                {FONT_SIZE_OPTIONS.map((fs) => (
                  <button key={fs.id} onClick={() => setFontSizeScale(fs.id)}
                    className={cn(
                      "flex-1 py-2 rounded-md border text-xs font-bold transition-all duration-200",
                      fontSizeScale === fs.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                    )}>
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text position */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MoveVertical className="h-3 w-3" /> Text Position
              </p>
              <div className="flex gap-1">
                {TEXT_POSITION_OPTIONS.map((pos) => (
                  <button key={pos.id} onClick={() => setTextPosition(pos.id)}
                    className={cn(
                      "flex-1 py-2 rounded-md border text-xs font-semibold transition-all duration-200",
                      textPosition === pos.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                    )}>
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text alignment */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alignment</p>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((a) => {
                  const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                  return (
                    <button key={a} onClick={() => setTextAlignMode(a)}
                      className={cn(
                        "flex-1 py-2 rounded-md border flex items-center justify-center transition-all duration-200",
                        textAlignMode === a
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* Per-Scene Animation (video only) */}
          {mode === "video" && (
            <div className="space-y-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wand2 className="h-3 w-3" /> Per-Scene Animation
              </Label>

              {/* Category */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scene 1 · Category</p>
                <div className="flex flex-wrap gap-1">
                  {TEXT_EFFECTS.map((fx) => (
                    <button key={fx.id} onClick={() => setSceneEffects(p => ({ ...p, category: fx.id }))}
                      className={cn("px-2 py-1 rounded text-[10px] font-semibold border transition-all",
                        sceneEffects.category === fx.id ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
                      )}>
                      {fx.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scene 2 · Quote</p>
                <div className="flex flex-wrap gap-1">
                  {TEXT_EFFECTS.map((fx) => (
                    <button key={fx.id} onClick={() => setSceneEffects(p => ({ ...p, quote: fx.id }))}
                      className={cn("px-2 py-1 rounded text-[10px] font-semibold border transition-all",
                        sceneEffects.quote === fx.id ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
                      )}>
                      {fx.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scene 3 · Author</p>
                <div className="flex flex-wrap gap-1">
                  {TEXT_EFFECTS.map((fx) => (
                    <button key={fx.id} onClick={() => setSceneEffects(p => ({ ...p, author: fx.id }))}
                      className={cn("px-2 py-1 rounded text-[10px] font-semibold border transition-all",
                        sceneEffects.author === fx.id ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
                      )}>
                      {fx.label}
                    </button>
                  ))}
                </div>
                {/* Choreography toggle */}
                <button onClick={() => setAuthorChoreographed(p => !p)}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-md border w-full text-left transition-all mt-1",
                    authorChoreographed ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
                  )}>
                  <div className={cn("w-8 h-4 rounded-full flex-shrink-0 relative transition-colors",
                    authorChoreographed ? "bg-primary" : "bg-muted-foreground/30")}>
                    <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      authorChoreographed ? "left-[18px]" : "left-0.5")} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold">Choreographed</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">"Words By" → then author name</span>
                  </div>
                </button>
              </div>

              {/* Speed */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Animation Speed</p>
                <div className="flex gap-1">
                  {(["slow", "normal", "fast"] as const).map((s) => (
                    <button key={s} onClick={() => setAnimationSpeed(s)}
                      className={cn("flex-1 py-1.5 rounded border text-xs font-semibold transition-all capitalize",
                        animationSpeed === s ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Separator className="opacity-40" />

          {/* Visual Template */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visual Template</Label>
            {templatesLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[9/16] rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {templates?.map((template) => (
                  <button key={template.id}
                    onClick={() => { setSelectedTemplateId(template.id); setUseCustomTemplate(false); }}
                    className={cn(
                      "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none",
                      !useCustomTemplate && selectedTemplateId === template.id
                        ? "border-primary shadow-primary/30 shadow-lg scale-105"
                        : "border-border/40 hover:border-border opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: template.bgColor }} title={template.name}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                      <div className="w-full h-0.5 mb-1" style={{ backgroundColor: template.accentColor }} />
                      <div className="w-full h-0.5 mb-1" style={{ backgroundColor: template.textColor, opacity: 0.5 }} />
                      <div className="w-2/3 h-0.5" style={{ backgroundColor: template.textColor, opacity: 0.3 }} />
                    </div>
                    {!useCustomTemplate && selectedTemplateId === template.id && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
                {/* Custom template swatch */}
                <button
                  onClick={() => { setUseCustomTemplate(true); setShowCustomColors(true); }}
                  className={cn(
                    "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none",
                    useCustomTemplate
                      ? "border-primary shadow-primary/30 shadow-lg scale-105"
                      : "border-dashed border-border/60 hover:border-border opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: customTemplate.bgColor }}
                  title="Custom colors">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <div className="w-full h-0.5 mb-1" style={{ backgroundColor: customTemplate.accentColor }} />
                    <div className="w-full h-0.5 mb-1" style={{ backgroundColor: customTemplate.textColor, opacity: 0.5 }} />
                    <div className="w-2/3 h-0.5" style={{ backgroundColor: customTemplate.textColor, opacity: 0.3 }} />
                  </div>
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                    <span className="text-[7px] font-bold" style={{ color: customTemplate.accentColor }}>CUSTOM</span>
                  </div>
                  {useCustomTemplate && (
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </button>
              </div>
            )}
            {activeTemplate && (
              <p className="text-xs text-muted-foreground text-center font-medium">
                {activeTemplate.name} &mdash; {activeTemplate.description}
              </p>
            )}

            {/* Custom color pickers */}
            {(showCustomColors || useCustomTemplate) && (
              <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Colors</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                    onClick={() => { setUseCustomTemplate(true); }}>
                    <Star className="h-3 w-3 mr-1 text-primary" /> Apply
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "bgColor" as keyof CustomTemplate, label: "Background" },
                    { key: "textColor" as keyof CustomTemplate, label: "Text" },
                    { key: "accentColor" as keyof CustomTemplate, label: "Accent" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground text-center">{label}</p>
                      <div className="relative">
                        <input
                          type="color"
                          value={customTemplate[key]}
                          onChange={(e) => {
                            setCustomTemplate((prev) => ({ ...prev, [key]: e.target.value }));
                            setUseCustomTemplate(true);
                          }}
                          className="w-full h-10 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                      <p className="text-[9px] text-center font-mono text-muted-foreground">{customTemplate[key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Background upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Background (optional)
            </Label>
            {customBg ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/40">
                {customBg.type === "image" ? (
                  <img src={customBg.url} className="w-10 h-16 object-cover rounded" alt="bg" />
                ) : (
                  <div className="w-10 h-16 bg-muted rounded flex items-center justify-center">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{customBg.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{customBg.type} background</p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearBg}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button onClick={() => bgInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border/50 bg-card/30 p-4 flex items-center gap-3 hover:border-border hover:bg-card/50 transition-all duration-200">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-medium text-muted-foreground">Upload image or video</p>
                  <p className="text-[10px] text-muted-foreground/60">PNG, JPG, MP4, WebM</p>
                </div>
              </button>
            )}
            <input ref={bgInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleBgUpload} />
          </div>

          {/* Logo upload (always visible) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Brand Logo (optional)
            </Label>
            <p className="text-[10px] text-muted-foreground/70">
              {mode === "image" ? "Shows as watermark at bottom of image" : "Appears in Scene 4 branding frame"}
            </p>
            {logoUrl ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/40">
                <img src={logoUrl} className="w-10 h-10 object-contain rounded border border-border/50" alt="logo" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{logoName}</p>
                  <p className="text-[10px] text-muted-foreground">PNG/SVG recommended</p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearLogo}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preset Logos</p>
                <div className="flex gap-2">
                  {PRESET_LOGOS.map((preset) => (
                    <button key={preset.id}
                      onClick={() => { setLogoUrl(preset.url); setLogoName(preset.name); }}
                      className="rounded-lg border border-border/50 bg-card/40 p-1.5 flex items-center justify-center hover:border-primary transition-all">
                      <img src={preset.url} className="h-10 w-10 object-contain rounded" alt={preset.name} />
                    </button>
                  ))}
                </div>
                <button onClick={() => logoInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border/50 bg-card/30 p-3 flex items-center gap-3 hover:border-border hover:bg-card/50 transition-all duration-200">
                  <div className="w-8 h-8 rounded-lg border border-border/50 bg-muted flex items-center justify-center flex-shrink-0">
                    <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-muted-foreground">Upload logo image</p>
                    <p className="text-[10px] text-muted-foreground/60">PNG, SVG, JPG · Square recommended</p>
                  </div>
                </button>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Brand name */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Brand Name
            </Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              placeholder="REEL STUDIO" className="bg-card/50 border-border/60 text-sm font-bold tracking-wider" />
          </div>

          <Separator className="opacity-40" />

          {/* Video-only settings */}
          {mode === "video" && (
            <>
              {/* Scene transitions */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Scene Transition
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {TRANSITION_EFFECTS.map((fx) => (
                    <button key={fx.id} onClick={() => setTransition(fx.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-all duration-200",
                        transition === fx.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        transition === fx.id ? "bg-primary" : "bg-muted-foreground/40"
                      )} />
                      <div className="flex-1">
                        <span className="text-xs font-semibold">{fx.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{fx.desc}</span>
                      </div>
                      {transition === fx.id && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Reel Duration
                </Label>
                <div className="flex gap-2">
                  {DURATION_PRESETS.map((d) => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      className={cn(
                        "flex-1 py-2 rounded-md border text-xs font-semibold transition-all duration-200",
                        duration === d.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {duration === 15000 && "15s — Instagram Reels, TikTok short"}
                  {duration === 30000 && "30s — Instagram, TikTok, YouTube Shorts"}
                  {duration === 60000 && "60s — YouTube Shorts max, LinkedIn"}
                </p>
              </div>

              {/* Background music */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Music className="h-3 w-3" /> Background Music
                </Label>
                {audioUrl ? (
                  <div className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Music className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{audioName}</p>
                        <p className="text-[10px] text-muted-foreground">MP3/WAV/OGG • Will loop during reel</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearAudio}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Volume</span>
                        <span>{audioVolume}%</span>
                      </div>
                      <Slider
                        value={[audioVolume]}
                        onValueChange={([v]) => setAudioVolume(v)}
                        min={0} max={100} step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Built-in Tracks</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {BUILTIN_TRACKS.map((track) => (
                        <button key={track.id}
                          onClick={() => { setAudioUrl(track.url); setAudioName(track.name); }}
                          className="flex flex-col items-start px-2.5 py-2 rounded-md border border-border/50 bg-card/40 text-muted-foreground hover:border-primary hover:text-primary transition-all text-left">
                          <Music className="h-3 w-3 mb-1 opacity-60" />
                          <p className="text-[10px] font-semibold leading-tight">{track.name}</p>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => audioInputRef.current?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-border/50 bg-card/30 p-3 flex items-center gap-3 hover:border-border hover:bg-card/50 transition-all">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-medium text-muted-foreground">Upload your own</p>
                        <p className="text-[10px] text-muted-foreground/60">MP3, WAV, OGG</p>
                      </div>
                    </button>
                  </div>
                )}
                <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
              </div>

              <Separator className="opacity-40" />
            </>
          )}

          {/* Export quality */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export Quality
            </Label>
            {mode === "video" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {QUALITY_PRESETS.map((q) => (
                    <button key={q.id} onClick={() => setQuality(q.id)}
                      className={cn(
                        "py-2 px-2 rounded-md border text-center transition-all duration-200",
                        quality === q.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      <p className="text-xs font-bold">{q.label}</p>
                      <p className="text-[10px] opacity-70">{q.note}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {quality === "720p" && `720×1280 · ${(duration / 1000).toFixed(0)}s render ≈ ${(duration / 1000).toFixed(0)}s real-time`}
                  {quality === "1080p" && `1080×1920 · Standard quality for all platforms`}
                  {quality === "2K" && `1440×2560 · High detail · May take ${Math.round(duration / 1000 * 1.2)}s+ to render`}
                </p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {[
                    { scale: 2, label: "1080p", note: "Fast" },
                    { scale: 3, label: "2K",    note: "Standard" },
                    { scale: 6, label: "4K",    note: "Max detail" },
                  ].map(({ scale, label, note }) => (
                    <button key={scale} onClick={() => setImageScale(scale as 2 | 3 | 6)}
                      className={cn(
                        "py-2 px-2 rounded-md border text-center transition-all duration-200",
                        imageScale === scale
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[10px] opacity-70">{note}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">PNG exported at {imageScale}× scale — crisp on all screens</p>
              </>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Caption */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" /> Caption
            </Label>
            <Textarea value={captionText} onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Caption for your post..."
              className="min-h-[70px] resize-none bg-card/50 border-border/60 text-sm" />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3 w-3" /> Hashtags
            </Label>
            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
              placeholder="#motivation #mindset #quotes"
              className="bg-card/50 border-border/60 text-sm font-mono" />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button key={platform} onClick={() => togglePlatform(platform)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200",
                    selectedPlatforms.includes(platform)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-card/50 text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                  )}>
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-4" />
          </div>
        </div>
      </div>

      {/* ── Right Panel — Preview ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 lg:p-6 overflow-y-auto order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
        <div className="mb-4 text-center">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {mode === "image" ? "Image Preview" : "Video Preview"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            {mode === "image"
              ? `Exported at ${imageScale}× as PNG`
              : `${durationLabel} · ${quality} · ${TRANSITION_EFFECTS.find((t) => t.id === transition)?.label} transition`}
          </p>
        </div>

        {/* Scene tabs (video mode) */}
        {mode === "video" && (
          <div className="flex gap-1 mb-4 p-1 rounded-lg bg-card/60 border border-border/50">
            {SCENES.map((s, i) => (
              <button key={s.id} onClick={() => setActiveScene(s.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  activeScene === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">
                  {i + 1}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* 9:16 Preview canvas */}
        <div className="relative shadow-2xl shadow-black/60 rounded-2xl overflow-hidden"
          style={{ width: "min(300px, 85vw)", aspectRatio: "9/16" }}>
          <div ref={previewRef}
            className="w-full h-full flex flex-col items-center justify-center relative select-none"
            style={{
              backgroundColor: activeTemplate.bgColor,
              padding: mode === "image" ? "40px 32px" : "0",
            }}>

            {/* Custom bg */}
            {customBg && (
              <div className="absolute inset-0">
                {customBg.type === "image" ? (
                  <img src={customBg.url} className="w-full h-full object-cover" alt="background" />
                ) : (
                  <video src={customBg.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                )}
                <div className="absolute inset-0 bg-black/55" />
              </div>
            )}

            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 z-10"
              style={{ backgroundColor: activeTemplate.accentColor }} />

            {mode === "image" ? (
              <div className="relative z-10 flex flex-col items-center text-center w-full gap-5 h-full justify-center">
                {/* Logo watermark at top if provided */}
                {logoUrl && (
                  <div className="absolute top-2 left-0 right-0 flex justify-center">
                    <img src={logoUrl} className="h-8 w-8 object-contain rounded" alt="logo" />
                  </div>
                )}
                <p className="leading-relaxed"
                  style={{
                    color: activeTemplate.textColor,
                    fontFamily: activeFont.family,
                    fontSize: (() => {
                      const fsm = { sm: 0.72, md: 1.0, lg: 1.28, xl: 1.6 }[fontSizeScale];
                      const base = quote.length > 100 ? 0.85 : quote.length > 60 ? 1.0 : 1.15;
                      return `${(base * fsm).toFixed(2)}rem`;
                    })(),
                    fontWeight: 500, lineHeight: 1.65, textAlign: textAlignMode,
                  }}>
                  {quote
                    ? `"${quote}"`
                    : <span style={{ opacity: 0.3 }}>Your inspiring quote will appear here...</span>}
                </p>
                <div className="w-10 h-px" style={{ backgroundColor: activeTemplate.accentColor }} />
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium"
                  style={{ color: activeTemplate.textColor, opacity: author ? 0.75 : 0.2 }}>
                  {author || "Author"}
                </p>
                {/* Brand name at bottom */}
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                  {logoUrl && <img src={logoUrl} className="h-4 w-4 object-contain rounded" alt="logo" />}
                  <p className="text-[8px] font-bold tracking-widest uppercase"
                    style={{ color: activeTemplate.accentColor, opacity: 0.7 }}>
                    {brandName || "REEL STUDIO"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full">
                {renderScenePreview(activeScene)}
              </div>
            )}

            {/* Accent bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 z-10"
              style={{ backgroundColor: activeTemplate.accentColor, opacity: 0.5 }} />
          </div>
        </div>

        {/* Scene description (video mode) */}
        {mode === "video" && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              {activeScene === "category" && `Scene 1 · ${(duration * 0.2 / 1000).toFixed(1)}s — Category title`}
              {activeScene === "quote"    && `Scene 2 · ${(duration * 0.3 / 1000).toFixed(1)}s — Full quote`}
              {activeScene === "author"  && `Scene 3 · ${(duration * 0.25 / 1000).toFixed(1)}s — Author attribution`}
              {activeScene === "branding"&& `Scene 4 · ${(duration * 0.25 / 1000).toFixed(1)}s — Brand / logo`}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              {TRANSITION_EFFECTS.find((t) => t.id === transition)?.label} transition · {audioUrl ? "🎵 With music" : "No audio"}
            </p>
          </div>
        )}

        {/* Video progress */}
        {isRecording && (
          <div className="mt-4 w-full max-w-[300px] space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rendering {quality} video...</span>
              <span>{videoProgress}%</span>
            </div>
            <Progress value={videoProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-center">
              Real-time render — this takes {durationLabel}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          <Button variant="outline" size="sm" onClick={handleGenerate}
            disabled={generateQuote.isPending} className="border-border/60 text-sm">
            {generateQuote.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
            Generate Quote
          </Button>

          {mode === "image" ? (
            <Button variant="outline" size="sm" onClick={handleDownloadImage}
              disabled={isDownloading || !quote.trim()} className="border-border/60 text-sm">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Download PNG
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleExportVideo}
              disabled={isRecording || !quote.trim()} className="border-border/60 text-sm">
              {isRecording ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
              {isRecording ? `Rendering ${videoProgress}%…` : `Export ${quality} Video`}
            </Button>
          )}

          <Button size="sm" onClick={handleSave} disabled={isSaving || !quote.trim()}
            className="text-sm font-semibold shadow-primary/20 shadow-md">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : saved ? <Check className="h-4 w-4 mr-2" />
              : <Save className="h-4 w-4 mr-2" />}
            {saved ? "Saved!" : editId ? "Update Reel" : "Save Reel"}
          </Button>
        </div>

        {selectedPlatforms.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-muted-foreground">For:</span>
            {selectedPlatforms.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
