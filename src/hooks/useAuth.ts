import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

export function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return 'That email or password looks incorrect.';
    case 'auth/user-not-found':
      return 'No account found with that email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    // Safety net: never block the UI forever if auth state can't resolve (e.g. offline).
    const safetyTimer = setTimeout(() => setLoading(false), 10000);
    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return { user, loading, signIn, signUp, resetPassword, signOut };
}
