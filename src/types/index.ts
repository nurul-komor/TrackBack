import { Timestamp } from 'firebase/firestore';

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved';
export type NotificationType = 'match' | 'message' | 'search_match';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  fcmToken: string;
  createdAt: Timestamp;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: string;
  images: string[];
  keywords: string[];
  status: ItemStatus;
  location: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Conversation {
  id: string;
  participants: string[];
  itemId: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  itemId: string;
  read: boolean;
  createdAt: Timestamp;
  matchedKeyword?: string; // only set when type === 'search_match'
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  keyword: string;      // normalized: trim().toLowerCase()
  category: string;      // never 'All' — required for equality matching
  keywords: string[];    // extractKeywords(keyword); length >= 2 required to save
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
