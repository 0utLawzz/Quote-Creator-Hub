import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useListReels,
  useDeleteReel,
  useToggleReelFavorite,
  useUpdateReel,
  getListReelsQueryKey,
  getGetStatsQueryKey,
  getGetRecentReelsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { ReelCard } from "@/components/ReelCard";
import { EmptyState } from "@/components/EmptyState";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: reels, isLoading, refetch, isRefetching } = useListReels();

  const invalidateReels = () => {
    queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentReelsQueryKey() });
  };
  const deleteReel = useDeleteReel({
    mutation: { onSuccess: invalidateReels },
  });
  const toggleFavorite = useToggleReelFavorite({
    mutation: { onSuccess: invalidateReels },
  });
  const updateReel = useUpdateReel({
    mutation: { onSuccess: invalidateReels },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>My Library</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Manage your collection of cinematic reels.
      </Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : reels && reels.length > 0 ? (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <ReelCard
              reel={item}
              onToggleFavorite={(id) => toggleFavorite.mutate({ id })}
              onDelete={(id) => deleteReel.mutate({ id })}
              onUpdateStatus={(id, status) => updateReel.mutate({ id, data: { status } })}
            />
          )}
        />
      ) : (
        <EmptyState icon="film" title="No reels yet" subtitle="Create or import reels to see them here." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
