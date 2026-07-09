import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateReel, useListReels, getListReelsQueryKey } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "@/components/StatusBadge";
import { Feather } from "@expo/vector-icons";

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

interface Entry {
  id: string;
  quote: string;
  author: string;
  category: string;
  status: "pending" | "importing" | "done" | "error";
  duplicateOf?: "existing" | string;
}

function normalizeQuote(q: string) {
  return q.toLowerCase().replace(/[\u201C\u201D"'\s]+/g, " ").trim();
}

function parseInput(raw: string): Entry[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const entries: Entry[] = [];

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
            category: CATEGORIES.includes(r.category?.toLowerCase()) ? r.category.toLowerCase() : "motivation",
            status: "pending",
          }));
      }
    } catch {
      // fall through
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#") || line.toLowerCase() === "quote,author,category") continue;
    const sep = line.includes(";") ? ";" : ",";
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2 && parts[0].length > 0) {
      entries.push({
        id: `csv-${i}-${Date.now()}`,
        quote: parts[0],
        author: parts[1] ?? "",
        category: CATEGORIES.includes(parts[2]?.toLowerCase()) ? parts[2].toLowerCase() : "motivation",
        status: "pending",
      });
    } else if (line.length > 5) {
      const clean = line.replace(/^[\u201C\u201D"']|[\u201C\u201D"']$/g, "").trim();
      if (clean) {
        entries.push({ id: `plain-${i}-${Date.now()}`, quote: clean, author: "", category: "motivation", status: "pending" });
      }
    }
  }
  return entries;
}

export default function ImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createReel = useCreateReel({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() }),
    },
  });
  const { data: existingReels } = useListReels();

  const [rawInput, setRawInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("motivation");
  const [defaultStatus, setDefaultStatus] = useState<"draft" | "posted">("draft");
  const [progress, setProgress] = useState(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const detectDuplicates = (parsed: Entry[]): Entry[] => {
    const existingKeys = new Set((existingReels ?? []).map((r) => normalizeQuote(r.quote)));
    const seen = new Map<string, string>();
    return parsed.map((e) => {
      const key = normalizeQuote(e.quote);
      if (!key) return e;
      if (existingKeys.has(key)) return { ...e, duplicateOf: "existing" };
      if (seen.has(key)) return { ...e, duplicateOf: seen.get(key) };
      seen.set(key, e.id);
      return e;
    });
  };

  const handleParse = () => {
    const parsed = parseInput(rawInput);
    if (parsed.length === 0) return;
    setEntries(detectDuplicates(parsed.map((e) => ({ ...e, category: e.category === "motivation" ? defaultCategory : e.category }))));
    setIsParsed(true);
  };

  const handleImport = async () => {
    const pending = entries.filter((e) => e.status === "pending" && e.quote.trim() && !(skipDuplicates && e.duplicateOf));
    if (pending.length === 0) return;
    setIsImporting(true);
    setProgress(0);
    let done = 0;
    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "importing" } : e)));
      try {
        await createReel.mutateAsync({
          data: {
            quote: entry.quote.trim(),
            author: entry.author.trim() || undefined,
            category: entry.category,
            templateId: "dark-gold",
            status: defaultStatus,
          },
        });
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "done" } : e)));
      } catch {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "error" } : e)));
      }
      done++;
      setProgress(Math.round((done / pending.length) * 100));
    }
    setIsImporting(false);
  };

  const duplicateCount = entries.filter((e) => e.duplicateOf).length;
  const importableCount = entries.filter((e) => e.status === "pending" && e.quote.trim() && !(skipDuplicates && e.duplicateOf)).length;
  const doneCount = entries.filter((e) => e.status === "done").length;

  const renderInputStage = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>PASTE QUOTES</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
        multiline
        numberOfLines={10}
        placeholder="One quote per line, or CSV: quote,author,category"
        placeholderTextColor={colors.mutedForeground}
        value={rawInput}
        onChangeText={setRawInput}
      />

      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>DEFAULT CATEGORY</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setDefaultCategory(c)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: defaultCategory === c ? colors.primary : colors.card }]}
          >
            <Text style={[styles.chipText, { color: defaultCategory === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>CREATE AS</Text>
      <View style={styles.chips}>
        {(["draft", "posted"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setDefaultStatus(s)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: defaultStatus === s ? colors.primary : colors.card }]}
          >
            <Text style={[styles.chipText, { color: defaultStatus === s ? colors.primaryForeground : colors.foreground }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleParse}
        disabled={!rawInput.trim()}
        style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: !rawInput.trim() ? 0.5 : 1 }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Preview {rawInput.split("\n").filter((l) => l.trim()).length} entries</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReviewStage = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.statusBar, { borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={[styles.count, { color: colors.foreground }]}>{entries.length} entries</Text>
          {duplicateCount > 0 && <Text style={[styles.count, { color: colors.accent }]}>{duplicateCount} duplicates</Text>}
          {doneCount > 0 && <Text style={[styles.count, { color: colors.posted }]}>{doneCount} imported</Text>}
        </View>
        <TouchableOpacity onPress={() => setIsParsed(false)}>
          <Text style={[styles.count, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {duplicateCount > 0 && !isImporting && (
        <TouchableOpacity
          onPress={() => setSkipDuplicates(!skipDuplicates)}
          style={[styles.skipRow, { borderColor: colors.border }]}>
          <Feather name={skipDuplicates ? "check-square" : "square"} size={18} color={colors.foreground} />
          <Text style={[styles.skipText, { color: colors.foreground }]}>Skip {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}</Text>
        </TouchableOpacity>
      )}

      {isImporting && (
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}>
        {entries.map((entry) => (
          <View key={entry.id} style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.entryQuote, { color: colors.foreground }]} numberOfLines={2}>{entry.quote}</Text>
              <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.author || "No author"} • {entry.category}</Text>
              {entry.duplicateOf && (
                <Text style={[styles.duplicate, { color: colors.accent }]}>
                  {entry.duplicateOf === "existing" ? "Already in library" : "Duplicate in this import"}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {entry.status === "pending" && !entry.duplicateOf && <StatusBadge status="draft" />}
              {entry.duplicateOf && <StatusBadge status="draft" />}
              {entry.status === "importing" && <ActivityIndicator color={colors.primary} />}
              {entry.status === "done" && <Feather name="check-circle" size={20} color={colors.posted} />}
              {entry.status === "error" && <Feather name="alert-circle" size={20} color={colors.destructive} />}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleImport}
          disabled={isImporting || importableCount === 0}
          style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isImporting || importableCount === 0 ? 0.5 : 1 }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {isImporting ? `Importing ${importableCount}…` : `Import ${importableCount} Reel${importableCount !== 1 ? "s" : ""}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={[styles.title, { color: colors.foreground, paddingTop: insets.top + 16 }]}>Bulk Import</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create dozens of reels in one go.</Text>
      {!isParsed ? renderInputStage() : renderReviewStage()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "700", paddingHorizontal: 16 },
  subtitle: { fontSize: 14, paddingHorizontal: 16, marginTop: 2, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
    minHeight: 200,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  primaryButton: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { fontSize: 16, fontWeight: "600" },
  statusBar: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  count: { fontSize: 13, fontWeight: "600" },
  skipRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 10 },
  skipText: { fontSize: 14, fontWeight: "500" },
  progressBar: { height: 4, marginHorizontal: 16, marginTop: 12, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%" },
  entryRow: { flexDirection: "row", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  entryQuote: { fontSize: 15, fontWeight: "500", lineHeight: 20 },
  entryMeta: { fontSize: 12, marginTop: 2 },
  duplicate: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "transparent", borderTopWidth: 1 },
});
