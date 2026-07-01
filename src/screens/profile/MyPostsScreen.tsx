import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Chip, Card, Button, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getUserItems, resolveItem, deleteItem } from '../../services/items.service';
import { COLORS } from '../../theme/theme';
import { Item } from '../../types';

export const MyPostsScreen = () => {
  const { user } = useAuth();
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
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Chip
            compact
            style={{ backgroundColor: item.type === 'lost' ? COLORS.lostChip : COLORS.foundChip }}
            textStyle={{ color: '#fff', fontSize: 11 }}
          >
            {item.type.toUpperCase()}
          </Chip>
          <Chip compact textStyle={{ fontSize: 11 }}>{item.category}</Chip>
        </View>
        <Text variant="titleSmall" style={styles.title}>{item.title}</Text>
        <Text variant="bodySmall" style={styles.location}>{item.location}</Text>
        <Text variant="bodySmall" style={styles.date}>
          {item.createdAt?.toDate?.()?.toLocaleDateString?.() ?? ''}
        </Text>
      </Card.Content>
      <Card.Actions>
        {item.status === 'active' && (
          <Button compact onPress={() => handleResolve(item)} textColor={COLORS.primary}>
            Resolve
          </Button>
        )}
        <Button compact onPress={() => handleDelete(item)} textColor={COLORS.error}>
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as 'active' | 'resolved')}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'resolved', label: 'Resolved' },
        ]}
        style={styles.segmented}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>No {filter} posts yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  segmented: { margin: 16 },
  listContent: { padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1 },
  card: { marginBottom: 12, backgroundColor: COLORS.surface },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  title: { color: COLORS.textPrimary, fontWeight: '600', marginBottom: 4 },
  location: { color: COLORS.textSecondary, fontSize: 12 },
  date: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },
});
