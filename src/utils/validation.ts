// TODO: [ALL AGENTS] - Add validation utilities as needed

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Get password strength message
 */
export function getPasswordStrengthMessage(password: string): string {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  return '';
}

/**
 * Validate name (at least 2 characters, only letters and spaces)
 */
export function isValidName(name: string): boolean {
  if (name.length < 2) return false;
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name);
}
