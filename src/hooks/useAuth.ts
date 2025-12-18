import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { isValidEmail, isValidPassword, isValidName, getPasswordStrengthMessage } from '@utils/validation';

export interface UseAuthReturn {
  // State
  user: ReturnType<typeof useAuthStore>['user'];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialized: boolean;

  // Actions
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;

  // Validation helpers
  validateEmail: (email: string) => { valid: boolean; message?: string };
  validatePassword: (password: string) => { valid: boolean; message?: string };
  validateName: (name: string) => { valid: boolean; message?: string };
  getPasswordStrength: (password: string) => { strength: 'weak' | 'medium' | 'strong'; message: string };
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    loading,
    error,
    initialized,
    signUp: storeSignUp,
    signIn: storeSignIn,
    signInWithGoogle: storeSignInWithGoogle,
    signInWithApple: storeSignInWithApple,
    signOut: storeSignOut,
    resetPassword: storeResetPassword,
    clearError,
    initialize,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const isAuthenticated = user !== null;

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      // Validate inputs
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!isValidPassword(password)) {
        return { success: false, error: getPasswordStrengthMessage(password) };
      }
      if (!isValidName(name)) {
        return { success: false, error: 'Name must be at least 2 characters and contain only letters' };
      }

      try {
        await storeSignUp(email, password, name);
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
        return { success: false, error: errorMessage };
      }
    },
    [storeSignUp]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Validate inputs
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!password) {
        return { success: false, error: 'Please enter your password' };
      }

      try {
        await storeSignIn(email, password);
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
        return { success: false, error: errorMessage };
      }
    },
    [storeSignIn]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      await storeSignInWithGoogle();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      return { success: false, error: errorMessage };
    }
  }, [storeSignInWithGoogle]);

  const signInWithApple = useCallback(async () => {
    try {
      await storeSignInWithApple();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Apple';
      return { success: false, error: errorMessage };
    }
  }, [storeSignInWithApple]);

  const signOut = useCallback(async () => {
    try {
      await storeSignOut();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      return { success: false, error: errorMessage };
    }
  }, [storeSignOut]);

  const resetPassword = useCallback(
    async (email: string) => {
      // Validate email
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      try {
        await storeResetPassword(email);
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
        return { success: false, error: errorMessage };
      }
    },
    [storeResetPassword]
  );

  // Validation helpers
  const validateEmail = useCallback((email: string) => {
    if (!email) {
      return { valid: false, message: 'Email is required' };
    }
    if (!isValidEmail(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true };
  }, []);

  const validatePassword = useCallback((password: string) => {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    const message = getPasswordStrengthMessage(password);
    if (message) {
      return { valid: false, message };
    }
    return { valid: true };
  }, []);

  const validateName = useCallback((name: string) => {
    if (!name) {
      return { valid: false, message: 'Name is required' };
    }
    if (!isValidName(name)) {
      return { valid: false, message: 'Name must be at least 2 characters and contain only letters' };
    }
    return { valid: true };
  }, []);

  const getPasswordStrength = useCallback((password: string) => {
    if (!password || password.length < 8) {
      return { strength: 'weak' as const, message: 'Password is too short' };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (hasLetter && hasNumber) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasSpecial) score++;

    if (score <= 2) {
      return { strength: 'weak' as const, message: 'Add numbers and special characters' };
    }
    if (score <= 3) {
      return { strength: 'medium' as const, message: 'Good, but could be stronger' };
    }
    return { strength: 'strong' as const, message: 'Strong password' };
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialized,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    clearError,
    validateEmail,
    validatePassword,
    validateName,
    getPasswordStrength,
  };
}
