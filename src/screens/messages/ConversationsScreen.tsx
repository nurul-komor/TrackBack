import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Text,
  TextInput, ActivityIndicator, Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { subscribeToConversations } from '../../services/chat.service';
import { Conversation } from '../../types';
import { COLORS } from '../../theme/theme';

interface UserProfile { name: string; photoURL: string; }

const timeAgo = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const getInitial = (id: string) => (id ? id[0].toUpperCase() : 'U');

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
const avatarColor = (id?: string) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export const ConversationsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const fetchedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);

      const missing = convs
        .map((c) => c.participants.find((p) => p !== user.uid) || '')
        .filter((id) => id && !fetchedIds.current.has(id));

      missing.forEach((id) => {
        fetchedIds.current.add(id);
        getDoc(doc(db, 'users', id)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserProfiles((prev) => ({
              ...prev,
              [id]: { name: data.displayName || '', photoURL: data.photoURL || '' },
            }));
          }
        });
      });
    });
    return unsub;
  }, [user]);

  const getOtherUserId = (conv: Conversation) =>
    conv.participants.find((p) => p !== user?.uid) || '';

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const otherId = getOtherUserId(c);
    const name = userProfiles[otherId]?.name || '';
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={[styles.centered, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Large Title */}
      <Text style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>Messages</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={COLORS.textSecondary}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Contact someone about their lost or found item to start a conversation.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingHorizontal: 16, paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View style={styles.listHeader} />}
          renderItem={({ item, index }) => {
            const otherId = getOtherUserId(item);
            const profile = userProfiles[otherId];
            const displayName = profile?.name || (otherId ? `User ${otherId.slice(0, 6)}` : 'Unknown');
            const photoURL = profile?.photoURL || '';
            const isFirst = index === 0;
            const isLast = index === filtered.length - 1;
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  isFirst && styles.rowFirst,
                  isLast && styles.rowLast,
                  !isLast && styles.rowBorder,
                ]}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    itemId: item.itemId,
                    otherUserId: otherId,
                  })
                }
                activeOpacity={0.7}
              >
                {/* Avatar */}
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColor(otherId) }]}>
                    <Text style={styles.avatarText}>{getInitial(otherId)}</Text>
                  </View>
                )}

                {/* Body */}
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessage || 'No messages yet'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.separator} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Search bar
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Conversation list
  list: {},
  listHeader: { height: 4 },

  // Glass row items
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 72,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.background,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },

  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
