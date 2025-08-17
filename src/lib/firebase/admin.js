import 'server-only';
import admin from 'firebase-admin';
import { createRequire } from 'module';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  // Use environment variables for production, fall back to service account file
  let credential;

  // Use service account JSON string from environment variable
  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (SA_JSON) {
    // Use service account JSON (production)
    let jsonStr;
    try {
      // Handle multiline JSON in .env files by replacing literal newlines with escaped ones
      jsonStr = SA_JSON
        .replace(/\r?\n/g, '\\n')  // Replace actual newlines with \n
        .replace(/\t/g, '\\t')     // Replace tabs with \t
        .trim();
      
      const serviceAccount = JSON.parse(jsonStr);

      // Validate required fields
      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        throw new Error('Missing required fields in service account JSON');
      }

      // Convert escaped newlines back to actual newlines in private_key
      if (serviceAccount.private_key.includes('\\n')) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      // Ensure private_key is properly formatted
      if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format: Missing PEM headers');
      }

      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Failed to parse Firebase service account JSON:', error);
      if (jsonStr) {
        console.error('JSON string length:', jsonStr.length);
        console.error('First 200 chars of JSON:', jsonStr.substring(0, 200));
      }
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
