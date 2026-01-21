import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {auth, db} from '../lib/firebase';
import { Profile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // We always ensure an anonymous user is present for API access
        // but the "app login" is managed via the 'profile' state
        // If we want to persist the 'user' (profile) login across refreshes, 
        // we might need to store the user id in localStorage since anonymous auth 
        // doesn't inherently link to our custom 'user' collection in a way Firebase Auth knows.
        const savedUserId = localStorage.getItem('app_user_id');
        if (savedUserId) {
          await loadProfile(savedUserId);
        } else {
          setLoading(false);
        }
      } else {
        // Ensure we have at least an anonymous session
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous auth failed:', error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'user', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data } as Profile);
        localStorage.setItem('app_user_id', docSnap.id);
      } else {
        setProfile(null);
        localStorage.removeItem('app_user_id');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    let querySnapshot;
    try {
      const q = query(
        collection(db, 'user'),
        where('email', '==', email),
        where('active', '==', true),
        where('password', '==', password)
      );
      querySnapshot = await getDocs(q);
    } catch (error) {
      console.error('Error in signIn query, falling back to manual filter:', error);
      // Fallback: fetch all users and filter manually
      // This is less efficient but avoids index requirements issues
      const allUsersSnapshot = await getDocs(collection(db, 'user'));
      const filteredDocs = allUsersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.email === email && data.password === password && data.active === true;
      });
      querySnapshot = { docs: filteredDocs, empty: filteredDocs.length === 0 };
    }
    
    if (querySnapshot.empty) {
      throw new Error('Credenciais inválidas');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    setProfile({ id: userDoc.id, ...userData } as Profile);
    localStorage.setItem('app_user_id', userDoc.id);
  };

  const signOut = async () => {
    setProfile(null);
    localStorage.removeItem('app_user_id');
    // We keep the anonymous firebase auth session
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
