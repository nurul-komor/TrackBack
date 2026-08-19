import {
  collection, addDoc, deleteDoc, doc, getDoc, setDoc,
  query, where, onSnapshot, getDocs, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { extractKeywords } from './matching.service';
import { sendPushNotification } from './notifications.service';
import { Item, SearchHistoryEntry } from '../types';

const sanitizeId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '_');

export type SaveSearchResult =
  | { saved: true }
  | { saved: false; reason: 'empty' | 'too_generic' };

// Category is optional — 'All' (or unset) is stored as-is and treated as a
// category-agnostic watcher: notifySearchMatches checks it against every new
// post regardless of category, not just one specific category's posts.
export const saveSearchHistory = async (
  userId: string, keyword: string, category: string,
): Promise<SaveSearchResult> => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return { saved: false, reason: 'empty' };
  const normalizedCategory = category || 'All';

  const keywords = extractKeywords(normalizedKeyword);
  // Only reject if extraction yields nothing usable at all (pure stopwords/too
  // short, e.g. "my id") — single real keywords like "bag" or "wallet" are fine.
  if (keywords.length < 1) return { saved: false, reason: 'too_generic' };

  const safeId = sanitizeId(`${userId}_${normalizedCategory}_${normalizedKeyword}`);
  await setDoc(
    doc(db, 'searchHistory', safeId),
    {
      userId,
      keyword: normalizedKeyword,
      category: normalizedCategory,
      keywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return { saved: true };
};

// Sorted client-side rather than via a Firestore orderBy: this list is small and
// per-user, so it doesn't need a composite index (userId== + orderBy requires one),
// which also means the screen works immediately rather than depending on an index
// build finishing.
export const getUserSearchHistory = (
  userId: string,
  onChange: (entries: SearchHistoryEntry[]) => void,
) =>
  onSnapshot(
    query(collection(db, 'searchHistory'), where('userId', '==', userId)),
    (snap) => {
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchHistoryEntry));
      entries.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
      onChange(entries);
    },
  );

export const deleteSearchHistory = (entryId: string) =>
  deleteDoc(doc(db, 'searchHistory', entryId));

// Called once, right after a new item is created. Finds every OTHER user with a
// saved search whose category matches this item and whose keywords substantially
// overlap this item's keywords, and notifies each matched user exactly once
// (in-app doc + best-effort push).
export const notifySearchMatches = async (
  item: Pick<Item, 'id' | 'title' | 'category' | 'userId' | 'keywords'>,
): Promise<void> => {
  if (!item.category || item.keywords.length === 0) return;

  // Two scoped queries instead of one unscoped one: entries saved against this
  // item's specific category, plus category-agnostic ('All') watchers that
  // should be checked against every new post. item.category is always a real
  // category (never 'All' — required on post creation), so these two sets
  // can't overlap.
  const [scopedSnap, allCategorySnap] = await Promise.all([
    getDocs(query(collection(db, 'searchHistory'), where('category', '==', item.category), limit(500))),
    getDocs(query(collection(db, 'searchHistory'), where('category', '==', 'All'), limit(500))),
  ]);

  // userId -> matched keyword. A Map (not a Set) so we keep exactly one
  // notification per matched user even if several of their saved searches
  // all match this one new post.
  const matchedUsers = new Map<string, string>();
  [...scopedSnap.docs, ...allCategorySnap.docs].forEach((d) => {
    const entry = d.data() as SearchHistoryEntry;
    if (entry.userId === item.userId) return; // never notify the poster about their own search
    if (matchedUsers.has(entry.userId)) return; // already queued for this post
    const overlap = entry.keywords.filter((k) => item.keywords.includes(k));
    const isMatch = entry.keywords.length > 0 && overlap.length / entry.keywords.length >= 0.6;
    if (isMatch) matchedUsers.set(entry.userId, entry.keyword);
  });

  if (matchedUsers.size === 0) return;

  await Promise.all(
    Array.from(matchedUsers.entries()).map(async ([userId, matchedKeyword]) => {
      try {
        const title = `New match for "${matchedKeyword}"`;
        const body = `"${item.title}" was just posted in ${item.category}.`;

        await addDoc(collection(db, 'notifications'), {
          userId,
          type: 'search_match',
          title,
          body,
          itemId: item.id,
          read: false,
          matchedKeyword,
          createdAt: serverTimestamp(),
        });

        const userSnap = await getDoc(doc(db, 'users', userId));
        const fcmToken = userSnap.exists() ? (userSnap.data().fcmToken as string) : '';
        if (fcmToken) {
          sendPushNotification(fcmToken, title, body, { itemId: item.id }).catch(() => {});
        }
      } catch {
        // best-effort per user — one failure shouldn't block notifying the others
      }
    }),
  );
};
