import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { Text, Searchbar, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useItems } from '../../hooks/useItems';
import { COLORS } from '../../theme/theme';
import { Item, ItemType } from '../../types';

const timeAgo = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ItemCard = ({ item, onPress }: { item: Item; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
    <Card style={styles.card} elevation={1}>
      <View style={styles.cardRow}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.chipRow}>
            <Chip
              compact
              style={[styles.typeChip, { backgroundColor: item.type === 'lost' ? COLORS.lostChip : COLORS.foundChip }]}
              textStyle={styles.typeChipText}
            >
              {item.type === 'lost' ? 'LOST' : 'FOUND'}
            </Chip>
            <Chip compact style={styles.categoryChip} textStyle={styles.categoryChipText}>
              {item.category}
            </Chip>
          </View>
          <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodySmall" style={styles.cardLocation} numberOfLines={1}>
            📍 {item.location || 'Unknown location'}
          </Text>
          <Text variant="bodySmall" style={styles.cardTime}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

export const FeedScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ItemType>('lost');
  const [search, setSearch] = useState('');

  const { items, loading } = useItems(activeTab);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = useCallback(() => {}, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lost' && styles.activeTab]}
            onPress={() => setActiveTab('lost')}
          >
            <Text style={[styles.tabText, activeTab === 'lost' && styles.activeTabText]}>
              Lost Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'found' && styles.activeTabFound]}
            onPress={() => setActiveTab('found')}
          >
            <Text style={[styles.tabText, activeTab === 'found' && styles.activeTabText]}>
              Found Items
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
          )}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text variant="titleMedium" style={styles.emptyTitle}>No items found</Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {search ? 'Try a different search term.' : `No ${activeTab} items reported yet.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, elevation: 2 },
  searchbar: { backgroundColor: COLORS.background, marginBottom: 12, elevation: 0, borderWidth: 1, borderColor: '#E0E0E0' },
  searchInput: { fontSize: 14 },
  tabRow: { flexDirection: 'row', marginBottom: 0 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  activeTabFound: { borderBottomColor: COLORS.accent },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: 12 },
  emptyContainer: { flex: 1, padding: 12 },
  loader: { flex: 1, marginTop: 40 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: COLORS.surface, overflow: 'hidden' },
  cardRow: { flexDirection: 'row' },
  cardImage: { width: 90, height: 90 },
  imagePlaceholder: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 28 },
  cardContent: { flex: 1, padding: 10, justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  typeChip: { height: 22 },
  typeChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  categoryChip: { height: 22, backgroundColor: '#F0F0F0' },
  categoryChipText: { fontSize: 10, color: COLORS.textSecondary },
  cardTitle: { color: COLORS.textPrimary, fontWeight: '600', marginBottom: 4 },
  cardLocation: { color: COLORS.textSecondary },
  cardTime: { color: COLORS.textSecondary, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: COLORS.textPrimary, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
