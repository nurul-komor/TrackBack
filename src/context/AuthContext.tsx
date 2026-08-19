import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { registerForPushNotifications } from '../services/notifications.service';
import { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            fcmToken: '',
            createdAt: serverTimestamp(),
          });
        }
        setUserProfile(snap.data() as User);
        // Best-effort: no-ops if disabled/in Expo Go, and never blocks auth state.
        registerForPushNotifications(firebaseUser.uid).catch(() => {});
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    // Firebase mutates auth.currentUser in-place, so we need a new reference
    // to trigger React re-renders in consuming components
    setUser(
      Object.create(
        Object.getPrototypeOf(auth.currentUser),
        Object.getOwnPropertyDescriptors(auth.currentUser),
      ) as FirebaseUser,
    );
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) setUserProfile(snap.data() as User);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
