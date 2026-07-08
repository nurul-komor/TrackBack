import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, getDocs, serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Item, ItemType, ItemStatus } from '../types';
import { extractKeywords } from './matching.service';

export const createItem = async (
  data: Omit<Item, 'id' | 'keywords' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  const keywords = extractKeywords(`${data.title} ${data.description}`);
  const ref = await addDoc(collection(db, 'items'), {
    ...data,
    keywords,
    status: 'active' as ItemStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getItems = async (type?: ItemType): Promise<Item[]> => {
  const constraints: any[] = [orderBy('createdAt', 'desc')];
  if (type) constraints.unshift(where('type', '==', type));
  constraints.unshift(where('status', '==', 'active'));
  const snap = await getDocs(query(collection(db, 'items'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
};

export const getUserItems = async (userId: string): Promise<Item[]> => {
  const snap = await getDocs(
    query(collection(db, 'items'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
};

export const getPotentialMatches = async (item: Item): Promise<Item[]> => {
  const oppositeType: ItemType = item.type === 'lost' ? 'found' : 'lost';
  const snap = await getDocs(
    query(
      collection(db, 'items'),
      where('type', '==', oppositeType),
      where('category', '==', item.category),
      where('status', '==', 'active'),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
};

export const resolveItem = (itemId: string) =>
  updateDoc(doc(db, 'items', itemId), { status: 'resolved', updatedAt: serverTimestamp() });

export const deleteItem = (itemId: string) =>
  deleteDoc(doc(db, 'items', itemId));

export const updateUserItemsProfile = async (
  userId: string,
  update: { userName?: string; userPhoto?: string },
): Promise<void> => {
  const snap = await getDocs(
    query(collection(db, 'items'), where('userId', '==', userId)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, update));
  await batch.commit();
};
