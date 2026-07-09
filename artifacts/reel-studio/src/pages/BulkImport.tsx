import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateReel, getListReelsQueryKey, getGetRecentReelsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import {
  Upload, FileText, Trash2, Play, CheckCircle2, XCircle, Loader2,
  Plus, AlertCircle, Download, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "motivation", "success", "love", "wisdom",
  "friendship", "courage", "life", "mindfulness",
];

const DEFAULT_CATEGORY = "motivation";
const DEFAULT_TEMPLATE = "dark-gold";

interface Entry {
  id: string;
  quote: string;
  author: string;
  category: string;
  status: "pending" | "importing" | "done" | "error";
  error?: string;
}

function parseInput(raw: string): Entry[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const entries: Entry[] = [];

  // Try JSON array first
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw.trim());
      if (Array.isArray(parsed)) {
        return parsed
          .filter((r) => r && typeof r.quote === "string" && r.quote.trim())
          .map((r, i) => ({
            id: `json-${i}-${Date.now()}`,
            quote: r.quote.trim(),
            author: (r.author ?? "").trim(),
            category: r.category?.trim() ?? DEFAULT_CATEGORY,
            status: "pending",
          }));
      }
    } catch {
      // fall through to line-by-line parsing
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header/empty lines
    if (!line || line.startsWith("#") || line.toLowerCase() === "quote,author,category") continue;

    // Try CSV parsing (comma or semicolon-separated)
    const sep = line.includes(";") ? ";" : ",";
    // Only split CSV if there are separators and first field doesn't start with a quote that spans the whole line
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));

    if (parts.length >= 2 && parts[0].length > 0) {
      entries.push({
        id: `csv-${i}-${Date.now()}`,
        quote: parts[0],
        author: parts[1] ?? "",
        category: CATEGORIES.includes(parts[2]?.toLowerCase()) ? parts[2].toLowerCase() : DEFAULT_CATEGORY,
        status: "pending",
      });
    } else if (line.length > 5) {
      // Plain quote line
      const clean = line.replace(/^[""\u201C\u201D']|[""\u201C\u201D']$/g, "").trim();
      if (clean) {
        entries.push({
          id: `plain-${i}-${Date.now()}`,
          quote: clean,
          author: "",
          category: DEFAULT_CATEGORY,
          status: "pending",
        });
      }
    }
  }

  return entries;
}

const PLACEHOLDER = `Paste quotes here — one per line, or CSV format:
quote,author,category

Example:
The only way to do great work is to love what you do.,Steve Jobs,motivation
In the middle of every difficulty lies opportunity.,Albert Einstein,wisdom
You are braver than you believe.,A.A. Milne,courage

Or just plain quotes:
Success is not final, failure is not fatal.
The journey of a thousand miles begins with one step.`;

export default function BulkImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createReel = useCreateReel();

  const [rawInput, setRawInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState(DEFAULT_CATEGORY);
  const [previewEntry, setPreviewEntry] = useState<Entry | null>(null);

  const handleParse = useCallback(() => {
    const parsed = parseInput(rawInput);
    if (parsed.length === 0) {
      toast({ title: "No valid entries found", description: "Check the format and try again.", variant: "destructive" });
      return;
    }
    // Apply default category to entries that have DEFAULT_CATEGORY
    const withDefaults = parsed.map((e) => ({
      ...e,
      category: e.category === DEFAULT_CATEGORY ? defaultCategory : e.category,
    }));
    setEntries(withDefaults);
    setIsParsed(true);
  }, [rawInput, defaultCategory, toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawInput(text);
      setIsParsed(false);
      setEntries([]);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateEntry = (id: string, field: keyof Entry, value: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addEmptyEntry = () => {
    setEntries((prev) => [...prev, {
      id: `manual-${Date.now()}`,
      quote: "",
      author: "",
      category: defaultCategory,
      status: "pending",
    }]);
  };

  const handleImportAll = async () => {
    const pending = entries.filter((e) => e.status === "pending" && e.quote.trim());
    if (pending.length === 0) {
      toast({ title: "No entries to import" });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let done = 0;
    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "importing" } : e));
      try {
        await new Promise<void>((resolve, reject) => {
          createReel.mutate(
            {
              data: {
                quote: entry.quote.trim(),
                author: entry.author.trim() || undefined,
                category: entry.category,
                templateId: DEFAULT_TEMPLATE,
              },
            },
            {
              onSuccess: () => {
                setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "done" } : e));
                resolve();
              },
              onError: (err) => {
                setEntries((prev) => prev.map((e) => e.id === entry.id ? {
                  ...e, status: "error",
                  error: err instanceof Error ? err.message : "Failed",
                } : e));
                reject(err);
              },
            }
          );
        });
      } catch {
        // continue importing others even if one fails
      }
      done++;
      setImportProgress(Math.round((done / pending.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentReelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });

    // Count final statuses accurately (state updates are async, track locally)
    const finalEntries = entries.map((e) => {
      if (e.status === "importing") return { ...e, status: "error" as const };
      return e;
    });
    const successCount = finalEntries.filter((e) => e.status === "done").length;
    const failCount = finalEntries.filter((e) => e.status === "error").length;
    const msg = failCount > 0
      ? `${successCount} succeeded, ${failCount} failed — check red rows.`
      : `Check your Library to view them.`;
    toast({ title: `Imported ${successCount} reel${successCount !== 1 ? "s" : ""}`, description: msg });
    setIsImporting(false);
  };

  const downloadTemplate = () => {
    const csv = "quote,author,category\nThe only way to do great work is to love what you do.,Steve Jobs,motivation\nIn the middle of every difficulty lies opportunity.,Albert Einstein,wisdom\nYou are braver than you believe.,A.A. Milne,courage";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reel-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneCount  = entries.filter((e) => e.status === "done").length;
  const errorCount = entries.filter((e) => e.status === "error").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste quotes, upload a CSV, or type a list — create dozens of reels in one click.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 border-border/60">
          <Download className="h-4 w-4" />
          CSV Template
        </Button>
      </div>

      {!isParsed ? (
        // ── Input stage ──────────────────────────────────────────────────
        <div className="space-y-6">
          {/* Format info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "📋", label: "Plain quotes", desc: "One quote per line" },
              { icon: "📊", label: "CSV format", desc: "quote,author,category" },
              { icon: "🗂️", label: "JSON array", desc: '[{"quote":"...","author":"..."}]' },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-border/50 bg-card/50 p-4 flex gap-3 items-start">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Default category */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Default category
            </label>
            <Select value={defaultCategory} onValueChange={setDefaultCategory}>
              <SelectTrigger className="w-48 bg-card/50 border-border/60 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paste area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Paste your quotes
              </label>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3 w-3" />
                Upload CSV/TXT
              </Button>
            </div>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-[280px] resize-none bg-card/50 border-border/60 text-sm font-mono leading-relaxed"
            />
            <input ref={fileInputRef} type="file" accept=".csv,.txt,.json" className="hidden" onChange={handleFileUpload} />
            {rawInput && (
              <p className="text-xs text-muted-foreground text-right">
                {rawInput.split("\n").filter((l) => l.trim()).length} lines
              </p>
            )}
          </div>

          <Button onClick={handleParse} disabled={!rawInput.trim()} className="w-full gap-2 font-semibold h-11">
            <Eye className="h-4 w-4" />
            Preview & Review Entries
          </Button>
        </div>
      ) : (
        // ── Review & import stage ─────────────────────────────────────────
        <div className="space-y-6">
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 flex-wrap flex-1">
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3 w-3" />
                {entries.length} entries
              </Badge>
              {doneCount > 0 && (
                <Badge className="gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  {doneCount} imported
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1.5">
                  <XCircle className="h-3 w-3" />
                  {errorCount} failed
                </Badge>
              )}
              {pendingCount > 0 && !isImporting && (
                <Badge variant="outline" className="gap-1.5 border-border/60">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setIsParsed(false); setEntries([]); }}
                disabled={isImporting} className="text-xs border-border/60">
                ← Edit Input
              </Button>
              <Button variant="outline" size="sm" onClick={addEmptyEntry}
                disabled={isImporting} className="text-xs gap-1 border-border/60">
                <Plus className="h-3 w-3" />
                Add Row
              </Button>
            </div>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2 bg-card/60 rounded-lg border border-border/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Importing reels…</span>
                <span className="text-muted-foreground">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          {/* Entries table */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_auto] gap-0 bg-card/80 border-b border-border/50 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quote</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            </div>
            <div className="divide-y divide-border/30 max-h-[480px] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No entries</div>
              ) : entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "grid grid-cols-[2fr_1.2fr_1fr_auto] gap-2 px-4 py-3 items-center transition-colors",
                    entry.status === "done"  && "bg-green-500/5",
                    entry.status === "error" && "bg-destructive/5",
                    entry.status === "importing" && "bg-primary/5",
                  )}
                >
                  <input
                    value={entry.quote}
                    onChange={(e) => updateEntry(entry.id, "quote", e.target.value)}
                    disabled={entry.status !== "pending"}
                    placeholder="Quote text…"
                    className="text-xs bg-transparent border-b border-border/30 focus:border-primary outline-none py-1 pr-2 text-foreground disabled:opacity-60 truncate"
                  />
                  <input
                    value={entry.author}
                    onChange={(e) => updateEntry(entry.id, "author", e.target.value)}
                    disabled={entry.status !== "pending"}
                    placeholder="Author"
                    className="text-xs bg-transparent border-b border-border/30 focus:border-primary outline-none py-1 pr-2 text-foreground disabled:opacity-60"
                  />
                  <Select
                    value={entry.category}
                    onValueChange={(v) => updateEntry(entry.id, "category", v)}
                    disabled={entry.status !== "pending"}
                  >
                    <SelectTrigger className="h-7 text-xs bg-transparent border-border/30 capitalize px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5 justify-end">
                    {entry.status === "pending" && (
                      <button onClick={() => removeEntry(entry.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {entry.status === "importing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {entry.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {entry.status === "error" && (
                      <div title={entry.error}>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import button */}
          <Button
            onClick={handleImportAll}
            disabled={isImporting || pendingCount === 0}
            className="w-full gap-2 font-semibold h-12 text-base shadow-primary/20 shadow-lg"
          >
            {isImporting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Importing {pendingCount} reels…</>
            ) : (
              <><Play className="h-5 w-5" /> Import {pendingCount} Reel{pendingCount !== 1 ? "s" : ""}</>
            )}
          </Button>

          {doneCount > 0 && !isImporting && (
            <p className="text-center text-sm text-muted-foreground">
              ✓ {doneCount} reel{doneCount !== 1 ? "s" : ""} saved — open{" "}
              <a href="/library" className="text-primary hover:underline">Library</a>{" "}
              to view them
            </p>
          )}
        </div>
      )}
    </div>
  );
}
