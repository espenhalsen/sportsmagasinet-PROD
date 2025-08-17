import admin from 'firebase-admin';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  // Use environment variables for production, fall back to service account file
  let credential;
  
  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Use environment variables (production)
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    // Use service account file (development) 
    try {
      const serviceAccount = require('../../../sportsmagasinet-database-firebase-adminsdk-fbsvc-ee38bba466.json');
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Failed to load service account file:', error);
      throw new Error('Firebase Admin SDK initialization failed');
    }
  }
  
  admin.initializeApp({
    credential,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Helper functions for common operations
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
