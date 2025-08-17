import 'server-only';
import admin from 'firebase-admin';
import { createRequire } from 'module';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  // Use environment variables for production, fall back to service account file
  let credential;

  // Preferred: one env var with the whole JSON (string or base64)
  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;           // plain JSON string
  const SA_B64  = process.env.FIREBASE_SERVICE_ACCOUNT_B64;       // base64 of the JSON

  if (SA_JSON || SA_B64) {
    // Use encrypted env variable(s) (production)
    try {
      let jsonStr = SA_JSON ?? Buffer.from(SA_B64, 'base64').toString('utf8');
      
      // Sanitize the JSON string to handle control characters
      jsonStr = jsonStr
        .replace(/\r\n/g, '\\n')  // Replace CRLF with escaped newline
        .replace(/\r/g, '\\n')    // Replace CR with escaped newline
        .replace(/\n/g, '\\n')    // Replace LF with escaped newline
        .replace(/\t/g, '\\t')    // Replace tabs with escaped tabs
        .trim();                  // Remove leading/trailing whitespace
      
      const serviceAccount = JSON.parse(jsonStr);

      // Handle escaped newlines in private_key if present
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Failed to parse Firebase service account JSON:', error);
      throw new Error('Firebase Admin SDK initialization failed: Invalid service account JSON');
    }
  } else if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    // Backwards-compatible: separate env vars for each field
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    // Use service account file (development)
    try {
      const require = createRequire(import.meta.url);
      // Keep your original relative path fallback:
      const serviceAccount = require('../../../sportsmag-adminfile.json');
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Failed to load service account file:', error);
      throw new Error('Firebase Admin SDK initialization failed');
    }
  }

  // Optional: include storageBucket if you set FIREBASE_STORAGE_BUCKET
  const appOptions = { credential };
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    appOptions.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  admin.initializeApp(appOptions);
}

// Exports kept exactly as before
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Helper functions for common operations (unchanged)
export async function verifyIdToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function setCustomUserClaims(uid, claims) {
  try {
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

export async function getUserByEmail(email) {
  try {
    const user = await auth.getUserByEmail(email);
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export default admin;
