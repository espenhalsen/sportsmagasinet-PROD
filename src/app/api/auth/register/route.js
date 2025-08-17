import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { hashPassword } from '@/lib/auth/jwt';
// import { sendRegistrationConfirmation } from '@/lib/resend/email'; // Temporarily disabled
import { sendSubscriptionSMS } from '@/lib/twilio/sms';

export async function POST(request) {
  try {
    const data = await request.json();
    const { token, email, password, firstName, lastName, phone } = data;

    // Validate required fields
    if (!token || !email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // URL decode the token (fixes %3D%3D to ==)
    const decodedToken = decodeURIComponent(token);

    // Get invitation from database by decoded token
    const invitationsSnapshot = await db.collection('invitations')
      .where('token', '==', decodedToken)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (invitationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 401 }
      );
    }

    const inviteDoc = invitationsSnapshot.docs[0];
    const inviteId = inviteDoc.id;

    const inviteData = inviteDoc.data();

    // Verify invitation is still pending
    if (inviteData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      );
    }

    // Check if email matches invitation
    if (inviteData.email && inviteData.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match invitation' },
        { status: 400 }
      );
    }

    // Start transaction to create user and update invitation
    const batch = db.batch();

    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phone.startsWith('+') ? phone : `+47${phone.replace(/\s/g, '')}`, // Default to Norway if no country code
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, {
        role: inviteData.role,
        clubId: inviteData.clubId || null,
      });

      // Prepare user data based on role
      const userData = {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        phone,
        role: inviteData.role,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        invitedBy: inviteData.invitedBy,
        language: data.language || 'nb',
      };

      // Add role-specific data
      switch (inviteData.role) {
        case 'agent':
          userData.clubId = null; // Agents are not tied to specific clubs
          userData.companyName = data.companyName;
          userData.organizationNumber = data.organizationNumber;
          userData.totalLicensesSold = 0;
          userData.totalRevenue = 0;
          userData.commissionRate = inviteData.metadata?.commissionRate || 0.10; // 10% default
          break;

        case 'club_admin':
          // Create or update club document with package assignment
          const clubData = {
            name: data.clubName,
            address: data.clubAddress,
            zipCode: data.clubZipCode,
            city: data.clubCity,
            adminId: userRecord.uid,
            agentId: inviteData.invitedBy,
            status: 'active',
            // Package assignment from agent
            packageId: inviteData.metadata?.packageId || null,
            packageStatus: 'pending_payment', // waiting for club admin to pay
            packageAssignedAt: inviteData.metadata?.packageAssignedAt || admin.firestore.FieldValue.serverTimestamp(),
            packageActivatedAt: null, // will be set after payment
            // License tracking
            totalLicenses: 0,
            activeLicenses: 0,
            availableLicenses: 0, // licenses available for sellers to sell
            totalRevenue: 0,
            // Timestamps
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (inviteData.clubId) {
            // Update existing club
            batch.update(db.collection('clubs').doc(inviteData.clubId), {
              ...clubData,
              createdAt: admin.firestore.FieldValue.delete(), // Don't update createdAt
            });
            userData.clubId = inviteData.clubId;
          } else {
            // Create new club
            const clubRef = db.collection('clubs').doc();
            batch.set(clubRef, clubData);
            userData.clubId = clubRef.id;
            
            // Update user claims with club ID
            await admin.auth().setCustomUserClaims(userRecord.uid, {
              role: inviteData.role,
              clubId: clubRef.id,
            });
          }
          break;

        case 'seller':
          userData.clubId = inviteData.metadata?.clubId || inviteData.clubId || null;
          userData.birthDate = data.birthDate;
          userData.totalSales = 0;
          userData.totalRevenue = 0;
          userData.commissionRate = inviteData.metadata?.commissionRate || 0.05; // 5% default
          
          // Update Firebase Auth custom claims with clubId
          if (userData.clubId) {
            await admin.auth().setCustomUserClaims(userRecord.uid, {
              role: inviteData.role,
              clubId: userData.clubId,
            });
          }
          break;

        case 'subscriber':
          userData.clubId = inviteData.clubId || null;
          userData.sellerId = inviteData.invitedBy;
          userData.subscriptionStatus = 'pending'; // Will be activated after payment
          userData.subscriptionStartDate = null;
          userData.subscriptionEndDate = null;
          break;
      }

      // Create user document
      batch.set(db.collection('users').doc(userRecord.uid), userData);

      // Update invitation status
      const inviteRef = db.collection('invitations').doc(inviteId);
      batch.update(inviteRef, {
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedBy: userRecord.uid,
      });

      // Create activity log
      batch.set(db.collection('activityLogs').doc(), {
        type: 'user_registered',
        userId: userRecord.uid,
        role: inviteData.role,
        inviteId: inviteId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          email,
          firstName,
          lastName,
          invitedBy: inviteData.invitedBy,
        }
      });

      // Commit the batch
      await batch.commit();

      // Send confirmation email
      try {
        await sendRegistrationConfirmation(
          email,
          `${firstName} ${lastName}`,
          inviteData.role,
          userData.language || 'nb'
        );
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail registration if email fails
      }

      // Send SMS confirmation for subscribers
      if (inviteData.role === 'subscriber' && phone) {
        try {
          await sendSubscriptionSMS(
            phone,
            firstName,
            userData.language || 'nb'
          );
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
          // Don't fail registration if SMS fails
        }
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        userId: userRecord.uid,
        role: inviteData.role,
        redirectTo: inviteData.role === 'subscriber' ? '/subscribe/payment' : '/login'
      });

    } catch (error) {
      console.error('Error in registration transaction:', error);
      
      // If user was created but transaction failed, delete the user
      if (error.code !== 'auth/email-already-exists') {
        try {
          const user = await auth.getUserByEmail(email);
          await auth.deleteUser(user.uid);
        } catch (deleteError) {
          console.error('Failed to cleanup user:', deleteError);
        }
      }

      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      throw error;
    }

  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
