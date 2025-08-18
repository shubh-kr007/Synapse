"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { useRouter, usePathname } from 'next/navigation';

// Define the shape of the context data
interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Redirect logic
      const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
      if (!currentUser && !isAuthPage) {
        // If user is not logged in and not on an auth page, redirect to sign-in
        router.push('/sign-in');
      } else if (currentUser && isAuthPage) {
        // If user is logged in and on an auth page, redirect to home
        router.push('/');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, pathname]);

  const value = {
    user,
    userId: user?.uid || null,
    loading,
  };

  // While loading, you can show a loader, or nothing
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
