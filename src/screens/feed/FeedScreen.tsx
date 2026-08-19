import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Image, TextInput,
} from 'react-native';
import { Text, ActivityIndicator, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItems } from '../../hooks/useItems';
import { useAuth } from '../../context/AuthContext';
import { saveSearchHistory } from '../../services/searchHistory.service';
import { CategoryPickerModal } from '../../components/CategoryPickerModal';
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
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
    <View style={styles.cardRow}>
      <View style={styles.cardImageWrapper}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, item.type === 'lost' ? styles.badgeLost : styles.badgeFound]}>
            <Text style={styles.badgeText}>{item.type === 'lost' ? 'LOST' : 'FOUND'}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.cardLocation} numberOfLines={1}>
            {item.location || 'Unknown location'}
          </Text>
        </View>
        <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export const FeedScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ItemType>('lost');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ keyword: string; category: string } | null>(null);

  const { items, loading } = useItems(activeTab);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(appliedSearch.toLowerCase()) &&
    (category === 'All' || item.category === category)
  );

  const handleRefresh = useCallback(() => {}, []);

  const persistSearch = (keyword: string, cat: string) => {
    if (!user) return;
    const normalizedKeyword = keyword.trim().toLowerCase();
    // Skip re-saving the exact same keyword+category that was just saved —
    // saveSearchHistory is idempotent (upserts by deterministic ID) so this
    // wouldn't create a duplicate document either way, but avoids a redundant
    // write + repeat "Saved" Snackbar when both the debounce and an explicit
    // submit fire for the same unchanged search.
    if (lastSavedRef.current?.keyword === normalizedKeyword && lastSavedRef.current?.category === cat) {
      return;
    }
    saveSearchHistory(user.uid, keyword, cat).then((result) => {
      if (result.saved) {
        lastSavedRef.current = { keyword: normalizedKeyword, category: cat };
        setSnackbarMessage("Saved — we'll notify you about new matches.");
      } else if (result.reason === 'too_generic') {
        setSnackbarMessage('Try a more specific search term to save it as an alert.');
      }
      // reason === 'empty' → nothing worth telling the user
    }).catch(() => {});
  };

  // Auto-save as a standing alert 3s after the user stops typing/changing
  // category. Pressing the keyboard's search button (below) saves immediately
  // instead of waiting — both paths lead to the same persistSearch call.
  useEffect(() => {
    if (!search.trim()) return;
    saveTimerRef.current = setTimeout(() => persistSearch(search, category), 3000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, user]);

  const handleSearchSubmit = () => {
    setAppliedSearch(search);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    persistSearch(search, category);
  };

  // Filtering only otherwise applies on submit/category change (not on every
  // keystroke), so clearing the box back to empty wouldn't reset the list
  // until another submit — poll every 2s and reset the applied filter as soon
  // as the box is empty.
  useEffect(() => {
    const interval = setInterval(() => {
      if (search.trim() === '' && appliedSearch !== '') {
        setAppliedSearch('');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [search, appliedSearch]);

  return (
    <View style={styles.container}>
      {/* Sticky header OUTSIDE FlatList */}
      <BlurView
        intensity={60}
        tint="light"
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          {/* Large Title */}
          <Text style={styles.largeTitle}>TrackBack</Text>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                placeholder="Search items..."
                placeholderTextColor={COLORS.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
              />
            </View>
            <TouchableOpacity
              onPress={() => setCategoryModalVisible(true)}
              style={styles.categoryFilterBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryFilterText} numberOfLines={1}>
                {category === 'All' ? 'Category' : category}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Pills */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'lost' && styles.tabPillActive]}
              onPress={() => setActiveTab('lost')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === 'lost' && styles.tabPillTextActive]}>
                Lost Items
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'found' && styles.tabPillActive]}
              onPress={() => setActiveTab('found')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === 'found' && styles.tabPillTextActive]}>
                Found Items
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="magnify" size={56} color={COLORS.separator} />
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySubtitle}>
                {appliedSearch ? 'Try a different search term.' : `No ${activeTab} items reported yet.`}
              </Text>
            </View>
          )
        }
      />

      <CategoryPickerModal
        visible={categoryModalVisible}
        selected={category}
        includeAllOption
        onSelect={(cat) => {
          setCategory(cat);
          setCategoryModalVisible(false);
          setAppliedSearch(search);
        }}
        onClose={() => setCategoryModalVisible(false)}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={2500}
        style={{ marginBottom: insets.bottom + 100 }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  /* Frosted glass header — sticky, outside FlatList */
  header: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12,
  },

  /* Search bar */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  categoryFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 10,
    maxWidth: 120,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },

  /* Tab pills */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(0,122,255,0.85)',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  /* List */
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  /* Item card — glass style */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 100,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardImageWrapper: {
    width: 100,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    width: 100,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F5',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  placeholderText: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 5,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeLost: {
    backgroundColor: COLORS.lostChip,
  },
  badgeFound: {
    backgroundColor: COLORS.foundChip,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  /* Empty state */
  loaderContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
