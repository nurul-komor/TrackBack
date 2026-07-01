import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await setDoc(doc(db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    displayName,
    email,
    photoURL: '',
    fcmToken: '',
    createdAt: serverTimestamp(),
  });
  return credential.user;
};

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const signInWithGoogle = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const userRef = doc(db, 'users', result.user.uid);
  await setDoc(
    userRef,
    {
      uid: result.user.uid,
      displayName: result.user.displayName || '',
      email: result.user.email || '',
      photoURL: result.user.photoURL || '',
      fcmToken: '',
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return result.user;
};

export const logout = () => signOut(auth);
