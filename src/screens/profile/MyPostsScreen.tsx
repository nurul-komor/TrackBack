import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUserItems, resolveItem, deleteItem } from '../../services/items.service';
import { COLORS } from '../../theme/theme';
import { Item } from '../../types';

export const MyPostsScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    if (!user?.uid) return;
    const data = await getUserItems(user.uid);
    setItems(data);
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleResolve = (item: Item) => {
    Alert.alert('Mark Resolved', `Mark "${item.title}" as resolved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          await resolveItem(item.id);
          loadItems();
        },
      },
    ]);
  };

  const handleDelete = (item: Item) => {
    Alert.alert('Delete Post', `Delete "${item.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          loadItems();
        },
      },
    ]);
  };

  const filtered = items.filter((i) => i.status === filter);

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.card}>
      {/* Badge + Category Row */}
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: item.type === 'lost' ? COLORS.lostChip : COLORS.foundChip }]}>
          <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{item.title}</Text>

      {/* Location + Date */}
      <View style={styles.cardMeta}>
        <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.cardLocation}>{item.location}</Text>
        <Text style={styles.cardDot}>·</Text>
        <Text style={styles.cardDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString?.() ?? ''}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {item.status === 'active' && (
          <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item)} activeOpacity={0.7}>
            <Text style={styles.resolveBtnText}>Resolve</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F2F2F7' }]}>
      {/* Page Title */}
      <Text style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>My Posts</Text>

      {/* Filter Toggle */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]}
          onPress={() => setFilter('resolved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'resolved' && styles.filterTabTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : [styles.listContent, { paddingBottom: insets.bottom + 110 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No {filter} posts yet</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'active'
                ? 'Your active lost & found reports will appear here.'
                : 'Resolved posts will appear here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.inputBackground,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardDot: {
    fontSize: 13,
    color: COLORS.separator,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  resolveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  resolveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFF0EF',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
