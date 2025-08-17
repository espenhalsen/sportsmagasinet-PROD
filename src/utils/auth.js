import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function verifyAuthToken(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    console.log('Auth debug - checking session cookie:', {
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie?.value ? 'present' : 'missing'
    });

    if (!sessionCookie) {
      return { success: false, error: 'No session cookie found' };
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
    
    console.log('Auth debug - decoded claims:', {
      uid: decodedClaims?.uid,
      email: decodedClaims?.email
    });

    if (!decodedClaims) {
      return { success: false, error: 'Invalid session cookie' };
    }

    // Get user record to ensure user still exists and get latest claims
    const userRecord = await auth.getUser(decodedClaims.uid);
    
    console.log('Auth debug - user record:', {
      uid: userRecord.uid,
      email: userRecord.email,
      role: userRecord.customClaims?.role,
      clubId: userRecord.customClaims?.clubId
    });
    
    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        phoneNumber: userRecord.phoneNumber,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        // Include custom claims
        role: userRecord.customClaims?.role || null,
        clubId: userRecord.customClaims?.clubId || null,
        firstName: userRecord.customClaims?.firstName || null,
        lastName: userRecord.customClaims?.lastName || null,
        customClaims: userRecord.customClaims || {},
      }
    };

  } catch (error) {
    console.error('Error verifying auth token:', error);
    return { success: false, error: error.message };
  }
}

export async function requireAuth(request, allowedRoles = []) {
  const authResult = await verifyAuthToken(request);
  
  if (!authResult.success) {
    return { success: false, error: 'Authentication required', status: 401 };
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(authResult.user.role)) {
    return { success: false, error: 'Insufficient permissions', status: 403 };
  }

  return { success: true, user: authResult.user };
}

export async function requireRole(request, requiredRole) {
  return requireAuth(request, [requiredRole]);
}
