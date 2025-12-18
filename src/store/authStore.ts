import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@types/index';

// Firebase auth service will be provided by AGENT_6
// For now, we define the expected interface
interface FirebaseAuthService {
  signUp: (email: string, password: string) => Promise<{ uid: string; email: string }>;
  signIn: (email: string, password: string) => Promise<{ uid: string; email: string }>;
  signInWithGoogle: () => Promise<{ uid: string; email: string; displayName?: string }>;
  signInWithApple: () => Promise<{ uid: string; email: string; displayName?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getCurrentUser: () => { uid: string; email: string } | null;
  onAuthStateChange: (callback: (user: { uid: string; email: string } | null) => void) => () => void;
}

// Supabase mutations will be provided by AGENT_6
interface SupabaseMutations {
  createUserProfile: (userId: string, data: { email: string; fullName: string }) => Promise<User>;
  getUserProfile: (userId: string) => Promise<User | null>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<User>;
}

// These will be imported from AGENT_6's implementations
let firebaseAuthService: FirebaseAuthService | null = null;
let supabaseMutations: SupabaseMutations | null = null;

// Function to set the services (called during app initialization)
export const setAuthServices = (
  firebase: FirebaseAuthService,
  supabase: SupabaseMutations
) => {
  firebaseAuthService = firebase;
  supabaseMutations = supabase;
};

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      initialized: false,

      signUp: async (email: string, password: string, name: string) => {
        if (!firebaseAuthService || !supabaseMutations) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Create Firebase auth account
          const firebaseUser = await firebaseAuthService.signUp(email, password);

          // Create user profile in Supabase
          const userProfile = await supabaseMutations.createUserProfile(firebaseUser.uid, {
            email,
            fullName: name,
          });

          set({ user: userProfile, loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        if (!firebaseAuthService || !supabaseMutations) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Sign in with Firebase
          const firebaseUser = await firebaseAuthService.signIn(email, password);

          // Fetch user profile from Supabase
          const userProfile = await supabaseMutations.getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            throw new Error('User profile not found');
          }

          set({ user: userProfile, loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        if (!firebaseAuthService || !supabaseMutations) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Sign in with Google via Firebase
          const firebaseUser = await firebaseAuthService.signInWithGoogle();

          // Check if user profile exists, create if not
          let userProfile = await supabaseMutations.getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            userProfile = await supabaseMutations.createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || 'User',
            });
          }

          set({ user: userProfile, loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      signInWithApple: async () => {
        if (!firebaseAuthService || !supabaseMutations) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Sign in with Apple via Firebase
          const firebaseUser = await firebaseAuthService.signInWithApple();

          // Check if user profile exists, create if not
          let userProfile = await supabaseMutations.getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            userProfile = await supabaseMutations.createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || 'User',
            });
          }

          set({ user: userProfile, loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Apple';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      signOut: async () => {
        if (!firebaseAuthService) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          await firebaseAuthService.signOut();
          set({ user: null, loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        if (!firebaseAuthService) {
          set({ error: 'Auth services not initialized' });
          return;
        }

        set({ loading: true, error: null });

        try {
          await firebaseAuthService.resetPassword(email);
          set({ loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setInitialized: (initialized: boolean) => {
        set({ initialized });
      },

      initialize: async () => {
        if (!firebaseAuthService || !supabaseMutations) {
          set({ initialized: true });
          return;
        }

        set({ loading: true });

        try {
          const currentUser = firebaseAuthService.getCurrentUser();

          if (currentUser) {
            const userProfile = await supabaseMutations.getUserProfile(currentUser.uid);
            set({ user: userProfile, loading: false, initialized: true });
          } else {
            set({ user: null, loading: false, initialized: true });
          }
        } catch (error) {
          set({ user: null, loading: false, initialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
