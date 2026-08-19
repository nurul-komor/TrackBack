import React, { useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUserSearchHistory, deleteSearchHistory } from '../../services/searchHistory.service';
import { COLORS } from '../../theme/theme';
import { SearchHistoryEntry } from '../../types';

export const SavedSearchesScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = getUserSearchHistory(user.uid, (data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDelete = (entry: SearchHistoryEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    deleteSearchHistory(entry.id).catch(() => {});
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#F2F2F7' }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F2F2F7' }]}>
      <Text style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>Saved Searches</Text>

      {entries.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="magnify" size={52} color={COLORS.separator} />
          <Text style={styles.emptyTitle}>No saved searches yet</Text>
          <Text style={styles.emptySubtitle}>
            Search on the Home tab to get notified about new matches.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.content}>
                <Text style={styles.keyword} numberOfLines={1}>{item.keyword}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  list: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  keyword: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
