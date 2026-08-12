import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, Image, StyleSheet, Alert,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const SectionDivider = () => <View style={styles.divider} />;

export const ItemDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
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
      headerStyle: { backgroundColor: '#F2F2F7' },
      headerTintColor: COLORS.primary,
      headerTitleStyle: { fontWeight: '700', color: COLORS.textPrimary },
      headerShadowVisible: false,
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
        otherUserId: currentItem.userId,
        itemId: currentItem.id,
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
  const initials = currentItem.userName?.charAt(0)?.toUpperCase() || '?';

  return (
    <View style={styles.gradientRoot}>
      {/* Absolute back button floating over the hero image */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <BlurView intensity={60} tint="light" style={styles.backBtnBlur}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1C1C1E" />
        </BlurView>
      </TouchableOpacity>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image / Carousel */}
        {currentItem.images?.length > 0 ? (
          <View style={styles.galleryWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}
            >
              {currentItem.images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
            {/* Glass badge overlay on the image */}
            <BlurView intensity={60} tint="light" style={styles.imageBadgeBlur}>
              <View style={[
                styles.imageBadge,
                currentItem.type === 'lost' ? styles.imageBadgeLost : styles.imageBadgeFound,
              ]}>
                <Text style={styles.imageBadgeText}>
                  {currentItem.type === 'lost' ? 'LOST' : 'FOUND'}
                </Text>
              </View>
            </BlurView>
          </View>
        ) : (
          <View style={styles.noImage}>
            <MaterialCommunityIcons name="image-off-outline" size={52} color={COLORS.separator} />
            <Text style={styles.noImageText}>No photo uploaded</Text>
          </View>
        )}

        {/* Main Content Card */}
        <View style={styles.card}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, currentItem.type === 'lost' ? styles.badgeLost : styles.badgeFound]}>
              <Text style={styles.badgeText}>{currentItem.type === 'lost' ? 'LOST' : 'FOUND'}</Text>
            </View>
            {currentItem.status === 'resolved' && (
              <View style={styles.badgeResolved}>
                <Text style={styles.badgeText}>RESOLVED</Text>
              </View>
            )}
            <View style={styles.badgeCategory}>
              <Text style={styles.badgeCategoryText}>{currentItem.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{currentItem.title}</Text>

          {/* Meta: location + time */}
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{currentItem.location || 'Location not specified'}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{timeAgo(currentItem.createdAt)}</Text>
          </View>

          <SectionDivider />

          {/* Description */}
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.sectionValue}>{currentItem.description}</Text>

          <SectionDivider />

          {/* Posted by */}
          <Text style={styles.sectionLabel}>POSTED BY</Text>
          <View style={styles.posterRow}>
            {currentItem.userPhoto ? (
              <Image source={{ uri: currentItem.userPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.posterName}>{currentItem.userName || 'Unknown'}</Text>
              <Text style={styles.posterTime}>{timeAgo(currentItem.createdAt)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {currentItem.status === 'active' && (
            <View style={styles.actions}>
              {!isOwner && (
                <View style={styles.contactBtnGradient}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={handleContact}
                    disabled={contacting}
                    activeOpacity={0.85}
                  >
                    {contacting ? (
                      <ActivityIndicator color="#FFFFFF" size={18} />
                    ) : (
                      <Text style={styles.actionBtnPrimaryText}>
                        Contact {currentItem.userName?.split(' ')[0] || 'User'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {isOwner && (
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={handleResolve}
                  disabled={resolving}
                  activeOpacity={0.85}
                >
                  {resolving ? (
                    <ActivityIndicator color={COLORS.primary} size={18} />
                  ) : (
                    <Text style={styles.actionBtnOutlineText}>Mark as Resolved</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Possible Matches Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            POSSIBLE MATCHES{matchesLoading ? '' : ` (${matches.length})`}
          </Text>

          {matchesLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.matchLoader} />
          ) : matches.length === 0 ? (
            <Text style={styles.noMatches}>No matches found yet.</Text>
          ) : (
            matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => navigation.push('ItemDetail', { item: match })}
                activeOpacity={0.8}
              >
                {match.images?.[0] ? (
                  <Image source={{ uri: match.images[0] }} style={styles.matchImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.matchImage, styles.matchImagePlaceholder]}>
                    <Text style={{ fontSize: 18 }}>📦</Text>
                  </View>
                )}
                <View style={styles.matchInfo}>
                  <View style={[styles.badge, match.type === 'lost' ? styles.badgeLost : styles.badgeFound, { alignSelf: 'flex-start' }]}>
                    <Text style={styles.badgeText}>{match.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.matchTitle} numberOfLines={2}>{match.title}</Text>
                  <Text style={styles.matchScore}>
                    {match.score} keyword{match.score !== 1 ? 's' : ''} matched
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },

  /* Gallery / hero image */
  galleryWrapper: {
    position: 'relative',
  },
  gallery: {
    height: 290,
  },
  galleryImage: {
    width,
    height: 290,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noImage: {
    height: 180,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noImageText: {
    color: COLORS.textSecondary,
    marginTop: 10,
    fontSize: 14,
  },

  /* Glass badge overlay on image */
  imageBadgeBlur: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageBadgeLost: {
    backgroundColor: 'rgba(255,59,48,0.2)',
  },
  imageBadgeFound: {
    backgroundColor: 'rgba(52,199,89,0.2)',
  },
  imageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  /* Main card — glass style */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
  },

  /* Badges */
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeLost: {
    backgroundColor: COLORS.lostChip,
  },
  badgeFound: {
    backgroundColor: COLORS.foundChip,
  },
  badgeResolved: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#9E9E9E',
  },
  badgeCategory: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EEF0FF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },

  /* Title */
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: 8,
  },

  /* Meta rows */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: 14,
  },

  /* Back button */
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backBtnBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  /* Section labels + values */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 0,
  },
  sectionValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  /* Poster */
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  posterName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  posterTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  /* Action buttons */
  actions: {
    marginTop: 18,
    marginHorizontal: 0,
    marginBottom: 0,
    gap: 10,
  },
  contactBtnGradient: {
    borderRadius: 12,
    marginHorizontal: 0,
    backgroundColor: '#007AFF',
  },
  actionBtnPrimary: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnOutline: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionBtnOutlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* Match cards */
  matchLoader: {
    marginTop: 12,
  },
  noMatches: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  matchImage: {
    width: 70,
    height: 70,
  },
  matchImagePlaceholder: {
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
    padding: 10,
    gap: 4,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  matchScore: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
