import { verifyIdToken, getUserByEmail } from '../firebase/admin';
import { verifyToken, extractBearerToken } from './jwt';

export async function authenticateRequest(request) {
  try {
    // For Next.js App Router, get token from cookies
    let token = null;
    
    // Try to get token from cookie first (Next.js App Router way)
    if (request.cookies) {
      token = request.cookies.get('auth-token')?.value;
    }
    
    // If not in cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = extractBearerToken(authHeader);
    }
    
    if (!token) {
      return { authenticated: false, error: 'Ingen autentisering funnet' };
    }
    
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return { authenticated: false, error: 'Ugyldig token' };
    }
    
    // Get user from Firebase
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return { authenticated: false, error: 'Bruker ikke funnet' };
    }
    
    // If we don't have clubId from token, try to get it from Firestore
    let clubId = decoded.clubId || user.customClaims?.clubId || null;
    
    if (!clubId && user.uid) {
      try {
        const { db } = require('../firebase/admin');
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          clubId = userData.clubId || null;
        }
      } catch (error) {
        console.log('Could not fetch user clubId from Firestore:', error.message);
      }
    }
    
    return {
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        role: decoded.role || user.customClaims?.role,
        clubId: clubId,
        ...decoded
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Autentiseringsfeil' };
  }
}

export function requireRole(allowedRoles) {
  return async (req, res) => {
    const auth = await authenticateRequest(req, res);
    
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    if (!allowedRoles.includes(auth.user.role)) {
      return res.status(403).json({ error: 'Ikke autorisert for denne handlingen' });
    }
    
    req.user = auth.user;
    return auth;
  };
}

export function optionalAuth() {
  return async (req, res) => {
    const auth = await authenticateRequest(req, res);
    if (auth.authenticated) {
      req.user = auth.user;
    }
    return auth;
  };
}
