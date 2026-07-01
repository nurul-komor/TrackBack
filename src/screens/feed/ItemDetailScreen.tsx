import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, Image, StyleSheet, Alert,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Text, Button, Chip, Divider, ActivityIndicator, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Item } from '../../types';
import { getPotentialMatches, resolveItem } from '../../services/items.service';
import { scoreMatches, MatchResult } from '../../services/matching.service';
import { getOrCreateConversation } from '../../services/chat.service';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';

const { width } = Dimensions.get('window');

const timeAgo = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const ItemDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item }: { item: Item } = route.params;
  const { user } = useAuth();

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item>(item);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: currentItem.type === 'lost' ? 'Lost Item' : 'Found Item',
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
    });
  }, []);

  useEffect(() => {
    getPotentialMatches(currentItem)
      .then((candidates) => setMatches(scoreMatches(currentItem, candidates)))
      .catch(() => {})
      .finally(() => setMatchesLoading(false));
  }, [currentItem.id]);

  const handleResolve = async () => {
    Alert.alert('Mark as Resolved', 'Have you recovered this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Resolved',
        onPress: async () => {
          try {
            setResolving(true);
            await resolveItem(currentItem.id);
            setCurrentItem((prev) => ({ ...prev, status: 'resolved' }));
          } catch {
            Alert.alert('Error', 'Could not update status.');
          } finally {
            setResolving(false);
          }
        },
      },
    ]);
  };

  const handleContact = async () => {
    if (!user) return;
    try {
      setContacting(true);
      const convId = await getOrCreateConversation(user.uid, currentItem.userId, currentItem.id);
      navigation.navigate('Chat', {
        conversationId: convId,
        otherUserName: currentItem.userName,
        itemTitle: currentItem.title,
      });
    } catch {
      Alert.alert('Error', 'Could not open chat.');
    } finally {
      setContacting(false);
    }
  };

  const isOwner = user?.uid === currentItem.userId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Gallery */}
      {currentItem.images?.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {currentItem.images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageIcon}>📦</Text>
          <Text style={styles.noImageText}>No photo uploaded</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Type + Status */}
        <View style={styles.chipRow}>
          <Chip
            style={[styles.typeChip, { backgroundColor: currentItem.type === 'lost' ? COLORS.lostChip : COLORS.foundChip }]}
            textStyle={styles.typeChipText}
          >
            {currentItem.type === 'lost' ? 'LOST' : 'FOUND'}
          </Chip>
          {currentItem.status === 'resolved' && (
            <Chip style={styles.resolvedChip} textStyle={styles.resolvedText}>RESOLVED</Chip>
          )}
          <Chip style={styles.categoryChip} textStyle={styles.categoryText}>{currentItem.category}</Chip>
        </View>

        {/* Title */}
        <Text variant="headlineSmall" style={styles.title}>{currentItem.title}</Text>

        {/* Meta */}
        <Text variant="bodySmall" style={styles.meta}>📍 {currentItem.location || 'Location not specified'}</Text>
        <Text variant="bodySmall" style={styles.meta}>🕐 {timeAgo(currentItem.createdAt)}</Text>

        <Divider style={styles.divider} />

        {/* Description */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Description</Text>
        <Text variant="bodyMedium" style={styles.description}>{currentItem.description}</Text>

        <Divider style={styles.divider} />

        {/* Posted by */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Posted by</Text>
        <View style={styles.posterRow}>
          {currentItem.userPhoto ? (
            <Avatar.Image size={36} source={{ uri: currentItem.userPhoto }} />
          ) : (
            <Avatar.Text size={36} label={currentItem.userName?.charAt(0)?.toUpperCase() || '?'} style={{ backgroundColor: COLORS.primary }} />
          )}
          <Text variant="bodyMedium" style={styles.posterName}>{currentItem.userName || 'Unknown'}</Text>
        </View>

        {/* Action Buttons */}
        {currentItem.status === 'active' && (
          <View style={styles.actions}>
            {!isOwner && (
              <Button
                mode="contained"
                onPress={handleContact}
                loading={contacting}
                disabled={contacting}
                style={[styles.actionBtn, { backgroundColor: COLORS.accent }]}
                textColor="#FFFFFF"
              >
                Contact {currentItem.userName?.split(' ')[0] || 'User'}
              </Button>
            )}
            {isOwner && (
              <Button
                mode="outlined"
                onPress={handleResolve}
                loading={resolving}
                disabled={resolving}
                style={styles.actionBtn}
                textColor={COLORS.primary}
              >
                Mark as Resolved
              </Button>
            )}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Possible Matches */}
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Possible Matches {matchesLoading ? '' : `(${matches.length})`}
        </Text>
        {matchesLoading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.matchLoader} />
        ) : matches.length === 0 ? (
          <Text variant="bodyMedium" style={styles.noMatches}>No matches found yet.</Text>
        ) : (
          matches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              onPress={() => navigation.push('ItemDetail', { item: match })}
              activeOpacity={0.8}
            >
              {match.images?.[0] ? (
                <Image source={{ uri: match.images[0] }} style={styles.matchImage} />
              ) : (
                <View style={[styles.matchImage, styles.matchImagePlaceholder]}>
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
              )}
              <View style={styles.matchInfo}>
                <Chip
                  compact
                  style={[styles.matchTypeChip, { backgroundColor: match.type === 'lost' ? COLORS.lostChip : COLORS.foundChip }]}
                  textStyle={styles.typeChipText}
                >
                  {match.type.toUpperCase()}
                </Chip>
                <Text variant="bodyMedium" style={styles.matchTitle} numberOfLines={2}>{match.title}</Text>
                <Text variant="bodySmall" style={styles.matchScore}>{match.score} keyword{match.score !== 1 ? 's' : ''} matched</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  gallery: { height: 240 },
  galleryImage: { width, height: 240 },
  noImage: { height: 180, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  noImageIcon: { fontSize: 48 },
  noImageText: { color: COLORS.textSecondary, marginTop: 8 },
  body: { padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { height: 28 },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  resolvedChip: { height: 28, backgroundColor: '#9E9E9E' },
  resolvedText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  categoryChip: { height: 28, backgroundColor: '#EEF0FF' },
  categoryText: { fontSize: 11, color: COLORS.primary },
  title: { fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  meta: { color: COLORS.textSecondary, marginBottom: 4 },
  divider: { marginVertical: 16 },
  sectionTitle: { fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  description: { color: COLORS.textPrimary, lineHeight: 22 },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  posterName: { color: COLORS.textPrimary, fontWeight: '500' },
  actions: { gap: 10, marginTop: 16 },
  actionBtn: { paddingVertical: 4 },
  matchLoader: { marginTop: 12 },
  noMatches: { color: COLORS.textSecondary },
  matchCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 10, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  matchImage: { width: 70, height: 70 },
  matchImagePlaceholder: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  matchInfo: { flex: 1, padding: 10, gap: 4 },
  matchTypeChip: { height: 20, alignSelf: 'flex-start' },
  matchTitle: { color: COLORS.textPrimary, fontWeight: '500' },
  matchScore: { color: COLORS.accent, fontSize: 11, fontWeight: '600' },
});
