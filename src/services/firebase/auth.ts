/**
 * Firebase Authentication Service
 * Handles all authentication methods: Email/Password, Google, Apple
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  AuthError,
} from 'firebase/auth';
import { getFirebaseAuth } from './config';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

class FirebaseAuthService {
  private auth = getFirebaseAuth();

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Update user profile with full name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign in with Google
   * Note: This requires @react-native-google-signin/google-signin for React Native
   * The idToken should be obtained from the Google Sign-In SDK
   */
  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(this.auth, credential);

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign in with Apple
   * Note: This requires @invertase/react-native-apple-authentication for React Native
   * The identityToken and nonce should be obtained from Apple Sign-In SDK
   */
  async signInWithApple(identityToken: string, nonce: string): Promise<AuthResult> {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      const userCredential = await signInWithCredential(this.auth, credential);

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      await firebaseSignOut(this.auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Get the currently signed-in user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Get current user profile data
   */
  getCurrentUserProfile(): UserProfile | null {
    const user = this.auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<AuthResult> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user signed in' };
      }

      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Update user display name
   */
  async updateDisplayName(displayName: string): Promise<AuthResult> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user signed in' };
      }

      await updateProfile(user, { displayName });
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Update user photo URL
   */
  async updatePhotoURL(photoURL: string): Promise<AuthResult> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user signed in' };
      }

      await updateProfile(user, { photoURL });
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Get Firebase Auth ID token for API calls
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Convert Firebase auth errors to user-friendly messages
   */
  private getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please try again.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
