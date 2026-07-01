import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Item, ItemType } from '../types';

export const useItems = (type?: ItemType) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints: any[] = [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    ];
    if (type) constraints.unshift(where('type', '==', type));

    const unsub = onSnapshot(
      query(collection(db, 'items'), ...constraints),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [type]);

  return { items, loading };
};
