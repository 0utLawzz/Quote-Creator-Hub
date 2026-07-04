import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useListTemplates,
  useGetReel,
  useCreateReel,
  useUpdateReel,
  useGenerateQuote,
  getListReelsQueryKey,
  getGetRecentReelsQueryKey,
  getGetStatsQueryKey,
  getGetReelQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Download,
  Save,
  ChevronDown,
  Check,
  RotateCcw,
  Star,
  Hash,
  AlignLeft,
  Loader2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "motivation",
  "success",
  "love",
  "wisdom",
  "friendship",
  "courage",
  "life",
  "mindfulness",
];

const PLATFORMS = ["Instagram", "TikTok", "Twitter/X", "Facebook", "LinkedIn"];

export default function CreateReel() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editId = params.get("id") ? Number(params.get("id")) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("motivation");
  const [selectedTemplateId, setSelectedTemplateId] = useState("dark-gold");
  const [captionText, setCaptionText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram"]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useListTemplates();
  const { data: existingReel } = useGetReel(editId!, {
    query: { enabled: !!editId, queryKey: getGetReelQueryKey(editId ?? 0) },
  });

  const createReel = useCreateReel();
  const updateReel = useUpdateReel();
  const generateQuote = useGenerateQuote();

  // Load existing reel data when editing
  useEffect(() => {
    if (existingReel) {
      setQuote(existingReel.quote);
      setAuthor(existingReel.author ?? "");
      setCategory(existingReel.category);
      setSelectedTemplateId(existingReel.templateId);
      setCaptionText(existingReel.captionText ?? "");
      setHashtags(existingReel.hashtags ?? "");
      if (existingReel.platforms) {
        setSelectedPlatforms(existingReel.platforms.split(",").map((p) => p.trim()));
      }
    }
  }, [existingReel]);

  const activeTemplate = templates?.find((t) => t.id === selectedTemplateId) ?? {
    id: "dark-gold",
    name: "Dark Gold",
    bgColor: "#0a0a0a",
    textColor: "#f5e6c8",
    accentColor: "#c9a84c",
    fontStyle: "serif",
    description: "",
  };

  const handleGenerate = () => {
    generateQuote.mutate(
      { data: { category, mood: undefined, customPrompt: undefined } },
      {
        onSuccess: (data) => {
          setQuote(data.quote);
          setAuthor(data.author);
          if (data.suggestedHashtags) setHashtags(data.suggestedHashtags);
          toast({ title: "Quote generated", description: "A fresh quote has been loaded into the editor." });
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Could not generate a quote. Try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleSave = async () => {
    if (!quote.trim()) {
      toast({ title: "Quote required", description: "Please enter a quote before saving.", variant: "destructive" });
      return;
    }
    const data = {
      quote: quote.trim(),
      author: author.trim() || undefined,
      category,
      templateId: selectedTemplateId,
      captionText: captionText.trim() || undefined,
      hashtags: hashtags.trim() || undefined,
      platforms: selectedPlatforms.join(",") || undefined,
    };

    if (editId) {
      updateReel.mutate(
        { id: editId, data },
        {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
            toast({ title: "Reel updated", description: "Your changes have been saved." });
          },
          onError: () => toast({ title: "Save failed", variant: "destructive" }),
        }
      );
    } else {
      createReel.mutate(
        { data },
        {
          onSuccess: (reel) => {
            queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentReelsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
            toast({ title: "Reel saved", description: "Your reel has been added to the library." });
            setLocation(`/create?id=${reel.id}`);
          },
          onError: () => toast({ title: "Save failed", variant: "destructive" }),
        }
      );
    }
  };

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: activeTemplate.bgColor,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `reel-${Date.now()}.png`;
      link.href = url;
      link.click();
      toast({ title: "Downloaded", description: "Reel exported as PNG." });
    } catch (err) {
      toast({ title: "Export failed", description: "Could not export the reel.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  }, [activeTemplate.bgColor, toast]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const isSaving = createReel.isPending || updateReel.isPending;

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">
      {/* Left Panel — Controls */}
      <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0 border-r border-border overflow-y-auto bg-sidebar/40">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {editId ? "Edit Reel" : "Create Reel"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editId ? "Update your cinematic quote" : "Craft a new cinematic quote"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || !quote.trim()}
                className="border-border/60"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5 text-xs">Export</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !quote.trim()}
                className="font-semibold shadow-primary/20 shadow-md"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5 text-xs">{saved ? "Saved" : "Save"}</span>
              </Button>
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card/50 border-border/60 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quote
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={generateQuote.isPending}
                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium"
              >
                {generateQuote.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Generate
              </Button>
            </div>
            <Textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter your quote or click Generate to get one..."
              className="min-h-[120px] resize-none bg-card/50 border-border/60 text-sm leading-relaxed font-serif"
            />
            <p className="text-right text-xs text-muted-foreground">{quote.length} chars</p>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Author
            </Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Marcus Aurelius"
              className="bg-card/50 border-border/60 text-sm"
            />
          </div>

          <Separator className="opacity-40" />

          {/* Template Picker */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visual Template
            </Label>
            {templatesLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={cn(
                      "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none",
                      selectedTemplateId === template.id
                        ? "border-primary shadow-primary/30 shadow-lg scale-105"
                        : "border-border/40 hover:border-border opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: template.bgColor }}
                    title={template.name}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                      <div
                        className="w-full h-0.5 mb-1"
                        style={{ backgroundColor: template.accentColor }}
                      />
                      <div
                        className="w-full h-0.5 mb-1"
                        style={{ backgroundColor: template.textColor, opacity: 0.5 }}
                      />
                      <div
                        className="w-2/3 h-0.5"
                        style={{ backgroundColor: template.textColor, opacity: 0.3 }}
                      />
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {activeTemplate && (
              <p className="text-xs text-muted-foreground text-center font-medium">
                {activeTemplate.name} &mdash; {activeTemplate.description}
              </p>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Caption */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" />
              Caption
            </Label>
            <Textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Caption for your post..."
              className="min-h-[80px] resize-none bg-card/50 border-border/60 text-sm"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Hashtags
            </Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#motivation #mindset #quotes"
              className="bg-card/50 border-border/60 text-sm font-mono"
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platforms
            </Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200",
                    selectedPlatforms.includes(platform)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-card/50 text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                  )}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-4" />
        </div>
      </div>

      {/* Right Panel — Live Preview */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 overflow-y-auto">
        <div className="mb-6 text-center">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Live Preview
          </h2>
          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            Exported at 3x resolution as PNG
          </p>
        </div>

        {/* 9:16 Reel Preview */}
        <div
          className="relative shadow-2xl shadow-black/60 rounded-2xl overflow-hidden"
          style={{ width: "min(320px, 90vw)", aspectRatio: "9/16" }}
        >
          <div
            ref={previewRef}
            className="w-full h-full flex flex-col items-center justify-center relative select-none"
            style={{
              backgroundColor: activeTemplate.bgColor,
              padding: "48px 36px",
            }}
          >
            {/* Decorative top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: activeTemplate.accentColor }}
            />

            {/* Quote mark */}
            <div
              className="absolute top-12 left-10 text-6xl leading-none font-serif opacity-20"
              style={{ color: activeTemplate.accentColor }}
            >
              &ldquo;
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center text-center w-full gap-6">
              {/* Category badge */}
              {category && (
                <div
                  className="px-3 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-[0.15em]"
                  style={{
                    color: activeTemplate.accentColor,
                    border: `1px solid ${activeTemplate.accentColor}40`,
                    backgroundColor: `${activeTemplate.accentColor}15`,
                  }}
                >
                  {category}
                </div>
              )}

              {/* Quote text */}
              <p
                className="leading-relaxed"
                style={{
                  color: activeTemplate.textColor,
                  fontFamily:
                    activeTemplate.fontStyle === "serif"
                      ? "var(--app-font-serif)"
                      : "var(--app-font-sans)",
                  fontSize: quote.length > 100 ? "0.95rem" : quote.length > 60 ? "1.1rem" : "1.25rem",
                  fontWeight: 500,
                  lineHeight: 1.65,
                  textAlign: "center",
                }}
              >
                {quote || (
                  <span style={{ opacity: 0.3 }}>Your inspiring quote will appear here...</span>
                )}
              </p>

              {/* Accent line */}
              <div
                className="w-12 h-px"
                style={{ backgroundColor: activeTemplate.accentColor }}
              />

              {/* Author */}
              {author ? (
                <p
                  className="font-sans text-[11px] uppercase tracking-[0.2em] font-medium"
                  style={{ color: activeTemplate.textColor, opacity: 0.75 }}
                >
                  {author}
                </p>
              ) : (
                <p
                  className="font-sans text-[11px] uppercase tracking-[0.2em]"
                  style={{ color: activeTemplate.textColor, opacity: 0.2 }}
                >
                  Author
                </p>
              )}
            </div>

            {/* Closing quote */}
            <div
              className="absolute bottom-12 right-10 text-6xl leading-none font-serif opacity-20 rotate-180"
              style={{ color: activeTemplate.accentColor }}
            >
              &ldquo;
            </div>

            {/* Decorative bottom bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: activeTemplate.accentColor, opacity: 0.5 }}
            />
          </div>
        </div>

        {/* Action buttons below preview */}
        <div className="mt-8 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generateQuote.isPending}
            className="border-border/60 text-sm"
          >
            {generateQuote.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
            )}
            Generate Quote
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading || !quote.trim()}
            className="border-border/60 text-sm"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PNG
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !quote.trim()}
            className="text-sm font-semibold shadow-primary/20 shadow-md"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? "Saved!" : editId ? "Update Reel" : "Save Reel"}
          </Button>
        </div>

        {selectedPlatforms.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-muted-foreground">For:</span>
            {selectedPlatforms.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
