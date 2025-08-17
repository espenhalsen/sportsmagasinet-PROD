import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Firebase ID token is required' },
        { status: 400 }
      );
    }
    
    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;
    
    // Get user's custom claims (includes role)
    const userRecord = await auth.getUser(uid);
    let customClaims = userRecord.customClaims || {};
    
    // If no role in custom claims, check Firestore and set claims
    if (!customClaims.role) {
      console.log('No role in custom claims, checking Firestore for user:', uid);
      
      // Check Firestore for user data
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'Bruker ikke funnet i systemet' },
          { status: 404 }
        );
      }
      
      const userData = userDoc.data();
      
      if (!userData.role) {
        return NextResponse.json(
          { error: 'Bruker har ingen tildelt rolle' },
          { status: 403 }
        );
      }
      
      // Set custom claims from Firestore data
      const claimsToSet = {
        role: userData.role,
        clubId: userData.clubId || null,
      };
      
      await auth.setCustomUserClaims(uid, claimsToSet);
      customClaims = claimsToSet;
      
      console.log('Set custom claims for user:', uid, claimsToSet);
    }
    
    // Generate JWT token for session management
    const token = generateToken({
      uid,
      email,
      role: customClaims.role,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      clubId: customClaims.clubId || null,
    });
    
    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        uid,
        email,
        role: customClaims.role,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        clubId: customClaims.clubId || null,
      },
    });
    
    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Innloggingsøkt utløpt' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return NextResponse.json(
        { error: 'Innlogging ugyldig' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Innlogging mislyktes' },
      { status: 500 }
    );
  }
}
