# Authentication Setup

## Overview
This application uses a secure hash-based authentication system that works both locally and when deployed to GitHub Pages.

## How It Works

### Security Approach
- **Password Storage**: The password is stored as a SHA-256 hash (not plain text)
- **Safe to Commit**: The hashed password is safe to commit to GitHub
- **Works Everywhere**: No environment variables needed - works on deployment
- **Client-Side**: Suitable for internal demos and prototypes

### Login Credentials
- **Username**: `admin`
- **Password**: `Admin123$#`

### Technical Details
The authentication system is implemented in:
- `src/config/auth.js` - Contains the hashed password and verification logic
- `src/components/Login.jsx` - Login form with validation

When a user logs in:
1. The entered password is hashed using SHA-256
2. The hash is compared with the stored hash
3. Access is granted only if username AND hash match

## Security Note

⚠️ **Important**: This is a client-side authentication system suitable for:
- Internal company demos
- Prototypes and proof-of-concepts
- Low-security environments

It is **NOT suitable** for:
- Production applications with sensitive data
- Public-facing apps requiring high security
- Applications storing user data or PII

A determined user with technical skills could bypass client-side authentication by inspecting the code or browser console.

## Changing the Password

To change the password:

1. Open your browser console and run:
```javascript
async function hashPassword(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate hash for your new password
hashPassword('YourNewPassword').then(hash => console.log(hash));
```

2. Copy the generated hash

3. Update `VALID_PASSWORD_HASH` in `src/config/auth.js` with the new hash

4. Commit and deploy

## Deployment

This authentication system works seamlessly with GitHub Pages deployment:
- No environment variables to configure
- No build-time secrets needed
- Simply commit and deploy as usual

The same credentials work both locally (`npm run dev`) and on the deployed site.

## Testing

To test the authentication:
1. Run `npm run dev`
2. Navigate to the login page
3. Try incorrect credentials - should show error message
4. Enter correct credentials - should successfully log in
