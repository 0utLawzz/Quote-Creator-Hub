import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Status = "draft" | "posted" | "scheduled";

export function StatusBadge({ status }: { status: Status }) {
  const colors = useColors();
  const colorKey = status === "posted" ? "posted" : status === "scheduled" ? "scheduled" : "draft";
  const color = colors[colorKey as keyof typeof colors] as string;

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + "15" }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
