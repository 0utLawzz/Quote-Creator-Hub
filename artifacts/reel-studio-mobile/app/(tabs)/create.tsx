import React, { useState } from "react";
import {
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
import { useCreateReel, useGenerateQuote, getListReelsQueryKey } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createReel = useCreateReel({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() }),
    },
  });
  const generateQuote = useGenerateQuote();

  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("motivation");
  const [status, setStatus] = useState<"draft" | "posted">("draft");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [saved, setSaved] = useState(false);

  const handleGenerate = () => {
    generateQuote.mutate(
      { data: { category } },
      {
        onSuccess: (data) => {
          setQuote(data.quote);
          setAuthor(data.author ?? "");
          if (data.suggestedHashtags) setHashtags(data.suggestedHashtags);
        },
      }
    );
  };

  const handleSave = () => {
    if (!quote.trim()) return;
    createReel.mutate(
      {
        data: {
          quote: quote.trim(),
          author: author.trim() || undefined,
          category,
          templateId: "dark-gold",
          status,
          captionText: caption.trim() || undefined,
          hashtags: hashtags.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSaved(true);
          setQuote("");
          setAuthor("");
          setCaption("");
          setHashtags("");
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Create Reel</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Craft a new cinematic quote reel.</Text>

        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generateQuote.isPending}
          style={[styles.ghostButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="zap" size={18} color={colors.primary} />
          <Text style={[styles.ghostButtonText, { color: colors.foreground }]}>
            {generateQuote.isPending ? "Generating…" : "Generate quote with AI"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>QUOTE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, minHeight: 100 }]}
          multiline
          placeholder="Enter your quote…"
          placeholderTextColor={colors.mutedForeground}
          value={quote}
          onChangeText={setQuote}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>AUTHOR</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Author (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={author}
          onChangeText={setAuthor}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: category === c ? colors.primary : colors.card }]}
            >
              <Text style={[styles.chipText, { color: category === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>STATUS</Text>
        <View style={styles.chips}>
          {(["draft", "posted"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: status === s ? colors.primary : colors.card }]}
            >
              <Text style={[styles.chipText, { color: status === s ? colors.primaryForeground : colors.foreground }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>CAPTION</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Social caption (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={caption}
          onChangeText={setCaption}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>HASHTAGS</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="#motivation #quotes"
          placeholderTextColor={colors.mutedForeground}
          value={hashtags}
          onChangeText={setHashtags}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!quote.trim() || createReel.isPending}
          style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: !quote.trim() || createReel.isPending ? 0.5 : 1 }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {createReel.isPending ? "Saving…" : saved ? "Saved!" : "Save Reel"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 2, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 16, marginBottom: 8, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  ghostButtonText: { fontSize: 14, fontWeight: "500" },
  primaryButton: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { fontSize: 16, fontWeight: "600" },
});
