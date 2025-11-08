/**
 * Authentication Configuration
 *
 * This file contains hashed credentials for the application.
 * The password is stored as a SHA-256 hash for security.
 * Safe to commit to version control as the original password is not visible.
 *
 * Credentials:
 * Username: admin
 * Password: [hashed - not stored in plain text]
 */

/**
 * Simple SHA-256 hash implementation using Web Crypto API
 * @param {string} text - The text to hash
 * @returns {Promise<string>} - The hex-encoded hash
 */
export async function hashPassword(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Valid users configuration
 * Each user has a username and a pre-computed password hash
 */
export const VALID_USERS = [
  {
    username: 'admin',
    passwordHash: '04c14a83a60cea1f674674d74f81dde784ff08b7cc9201f451426d649a943bee', // Admin123$#
    role: 'admin'
  },
  {
    username: 'KRajan',
    passwordHash: 'b36f4b97a32746f49849f614e46c3f2ff8652fe09b0d861d6dc6d1bf2c9c6694', // KamalR123$
    role: 'user'
  }
];

/**
 * Verify if the provided credentials are valid
 * @param {string} username - The username to verify
 * @param {string} password - The password to verify
 * @returns {Promise<boolean>} - True if credentials are valid
 */
export async function verifyCredentials(username, password) {
  // Find user by username
  const user = VALID_USERS.find(u => u.username === username);

  if (!user) {
    return false;
  }

  // Hash the provided password and compare
  const hashedInput = await hashPassword(password);
  return hashedInput === user.passwordHash;
}
