import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const {
      licenseId,
      clubId,
      name,
      email,
      phoneNumber,
      address,
      birthDate,
      password
    } = await request.json();

    // Validate required fields
    if (!licenseId || !clubId || !name || !email || !password) {
      return NextResponse.json({ error: 'Mangler påkrevde felter' }, { status: 400 });
    }

    // Validate license exists and is completed - use same path as get-buyer-info API
    console.log('Looking for license:', { licenseId, clubId });
    const licenseDoc = await db.collection('club_licenses').doc(clubId).collection('licenses').doc(licenseId).get();
    console.log('License found:', licenseDoc.exists);
    if (licenseDoc.exists) {
      console.log('License data:', licenseDoc.data());
    }
    if (!licenseDoc.exists) {
      return NextResponse.json({ error: 'Lisens ikke funnet' }, { status: 404 });
    }

    const licenseData = licenseDoc.data();
    if (licenseData.state !== 'completed') {
      return NextResponse.json({ error: 'Lisens er ikke fullført' }, { status: 400 });
    }

    // Check if user already registered for this license
    if (licenseData.userId) {
      return NextResponse.json({ error: 'Bruker allerede registrert for denne lisensen' }, { status: 409 });
    }

    // Check if email already exists
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return NextResponse.json({ error: 'E-post er allerede registrert' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Firebase Auth user
    let firebaseUser;
    try {
      // Process phone number correctly - avoid double country code
      let processedPhoneNumber = null;
      if (phoneNumber) {
        if (phoneNumber.startsWith('+')) {
          processedPhoneNumber = phoneNumber;
        } else if (phoneNumber.startsWith('47')) {
          processedPhoneNumber = `+${phoneNumber}`;
        } else {
          processedPhoneNumber = `+47${phoneNumber.replace(/\s/g, '')}`;
        }
        // Validate length (E.164 format max 15 digits)
        if (processedPhoneNumber.length > 15) {
          processedPhoneNumber = null;
        }
      }

      firebaseUser = await auth.createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: name?.substring(0, 50), // Limit display name length
        ...(processedPhoneNumber && { phoneNumber: processedPhoneNumber })
      });
    } catch (authError) {
      console.error('Firebase Auth error:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'E-post er allerede i bruk' }, { status: 409 });
      }
      throw authError;
    }

    // Prepare user data
    const userData = {
      uid: firebaseUser.uid,
      name: name,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber,
      address: address,
      birthDate: birthDate,
      role: 'subscriber',
      licenseId: licenseId,
      clubId: clubId, // Use the clubId from the request, not from licenseData
      packageId: licenseData.packageId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      registrationSource: 'vipps_subscription',
      hashedPassword: hashedPassword,
      verified: true, // Auto-verify since info came from government sources via Vipps
      vippsVerified: true
    };

    // Create user document in Firestore
    await db.collection('users').doc(firebaseUser.uid).set(userData);

    // Update license with user information
    await licenseDoc.ref.update({
      userId: firebaseUser.uid,
      buyerInfo: {
        ...licenseData.buyerInfo,
        registrationPending: false,
        registrationCompleted: true,
        registrationCompletedAt: new Date(),
        userCreated: true
      },
      updatedAt: new Date()
    });

    // Update club statistics
    if (licenseData.clubId) {
      const clubRef = db.collection('clubs').doc(licenseData.clubId);
      const clubDoc = await clubRef.get();
      if (clubDoc.exists) {
        const clubData = clubDoc.data();
        await clubRef.update({
          totalSubscribers: (clubData.totalSubscribers || 0) + 1,
          lastSubscriberAt: new Date()
        });
      }
    }

    // Set custom claims for the user
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: 'subscriber',
      clubId: licenseData.clubId,
      packageId: licenseData.packageId
    });

    return NextResponse.json({
      success: true,
      message: 'Bruker opprettet og registrert',
      userId: firebaseUser.uid,
      licenseId: licenseId,
      clubId: licenseData.clubId
    });

  } catch (error) {
    console.error('Error registering subscriber:', error);
    
    // Clean up if Firebase user was created but Firestore failed
    if (error.firebaseUser) {
      try {
        await auth.deleteUser(error.firebaseUser.uid);
      } catch (cleanupError) {
        console.error('Error cleaning up Firebase user:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Registrering feilet. Prøv igjen senere.' },
      { status: 500 }
    );
  }
}
