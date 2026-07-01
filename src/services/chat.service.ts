import {
  collection, addDoc, updateDoc, doc, query, where,
  orderBy, onSnapshot, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Conversation, Message } from '../types';

export const getOrCreateConversation = async (
  currentUserId: string,
  otherUserId: string,
  itemId: string,
): Promise<string> => {
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('itemId', '==', itemId),
      where('participants', 'array-contains', currentUserId),
    )
  );
  const existing = snap.docs.find((d) =>
    d.data().participants.includes(otherUserId)
  );
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, 'conversations'), {
    participants: [currentUserId, otherUserId],
    itemId,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
): Promise<void> => {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    text,
    senderId,
    createdAt: serverTimestamp(),
    read: false,
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
) =>
  onSnapshot(
    query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    ),
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))),
  );

export const subscribeToConversations = (
  userId: string,
  callback: (convs: Conversation[]) => void,
) =>
  onSnapshot(
    query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
    ),
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation))),
  );
