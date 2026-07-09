import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";
import type { Reel } from "@workspace/api-client-react";

export function ReelCard({
  reel,
  onToggleFavorite,
  onDelete,
  onUpdateStatus,
}: {
  reel: Reel;
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: "draft" | "posted") => void;
}) {
  const colors = useColors();
  const isPosted = reel.status === "posted";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.preview}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={[styles.quote, { color: "#ffffff" }]} numberOfLines={4}>
          {reel.quote}
        </Text>
        {reel.author ? (
          <Text style={[styles.author, { color: "#ffffff" }]}>— {reel.author}</Text>
        ) : null}
        <View style={styles.badgeWrapper}>
          <StatusBadge status={reel.status} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Text style={[styles.category, { color: colors.foreground }]}>{reel.category}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {new Date(reel.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onToggleFavorite(reel.id)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={reel.isFavorite ? "star" : "star-o"}
              size={20}
              color={reel.isFavorite ? "#f6ad2d" : colors.mutedForeground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onUpdateStatus(reel.id, isPosted ? "draft" : "posted")}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Feather name={isPosted ? "rotate-ccw" : "send"} size={20} color={isPosted ? colors.mutedForeground : colors.posted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Delete reel?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(reel.id) },
              ])
            }
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  preview: {
    aspectRatio: 9 / 16,
    backgroundColor: "#0a0a0a",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteMark: {
    position: "absolute",
    top: 16,
    left: 20,
    fontSize: 64,
    color: "rgba(246, 173, 45, 0.2)",
    fontWeight: "700",
    lineHeight: 64,
  },
  quote: {
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  author: {
    fontSize: 12,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.8,
  },
  badgeWrapper: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  footer: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meta: {
    gap: 2,
  },
  category: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    padding: 6,
  },
});
