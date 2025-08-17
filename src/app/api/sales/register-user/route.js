import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const { saleId, firstName, lastName, phone, city, address, postalCode } = await request.json();

    if (!saleId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Sale ID, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Get sale data
    const saleDoc = await db.collection('license_sales').doc(saleId).get();
    
    if (!saleDoc.exists) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const saleData = saleDoc.data();
    
    if (saleData.status !== 'active') {
      return NextResponse.json(
        { error: 'Sale is not active' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserSnapshot = await db.collection('users')
      .where('email', '==', saleData.customerEmail)
      .limit(1)
      .get();

    let userId;
    let isNewUser = false;

    if (existingUserSnapshot.empty) {
      // Create new Firebase Auth user
      const firebaseUser = await admin.auth().createUser({
        email: saleData.customerEmail,
        displayName: `${firstName} ${lastName}`,
        emailVerified: true
      });

      userId = firebaseUser.uid;
      isNewUser = true;

      // Set custom claims for subscriber role
      await admin.auth().setCustomUserClaims(userId, {
        role: 'subscriber',
        clubId: saleData.clubId
      });

      // Create user document in Firestore
      await db.collection('users').doc(userId).set({
        uid: userId,
        email: saleData.customerEmail,
        firstName: firstName,
        lastName: lastName,
        role: 'subscriber',
        phone: phone || null,
        city: city || null,
        address: address || null,
        postalCode: postalCode || null,
        clubId: saleData.clubId,
        createdAt: new Date(),
        
        // Subscriber specific fields
        subscriptionStatus: 'active',
        licenseId: saleId,
        licenseValidUntil: saleData.licenseValidUntil,
        
        // Payment information
        paymentMethod: 'vipps',
        lastPaymentAt: new Date(),
        totalPaid: saleData.salePrice
      });

      // Create subscription record
      await db.collection('subscriptions').add({
        userId: userId,
        clubId: saleData.clubId,
        clubName: saleData.clubName,
        sellerId: saleData.sellerId,
        sellerName: saleData.sellerName,
        licenseId: saleId,
        
        // Subscription details
        status: 'active',
        plan: 'annual',
        price: saleData.salePrice,
        currency: 'NOK',
        
        // Dates
        startDate: new Date(),
        validUntil: saleData.licenseValidUntil,
        createdAt: new Date(),
        
        // Payment info
        paymentMethod: 'vipps',
        vippsAgreementId: saleData.vippsAgreementId,
        
        metadata: {
          originalSaleId: saleId,
          registrationCompletedAt: new Date()
        }
      });

    } else {
      // User exists, update their information
      const existingUser = existingUserSnapshot.docs[0];
      userId = existingUser.id;
      
      await existingUser.ref.update({
        firstName: firstName,
        lastName: lastName,
        phone: phone || existingUser.data().phone,
        city: city || existingUser.data().city,
        address: address || existingUser.data().address,
        postalCode: postalCode || existingUser.data().postalCode,
        
        // Update subscription info
        licenseId: saleId,
        licenseValidUntil: saleData.licenseValidUntil,
        subscriptionStatus: 'active',
        lastPaymentAt: new Date(),
        totalPaid: (existingUser.data().totalPaid || 0) + saleData.salePrice,
        
        updatedAt: new Date()
      });

      // Update Firebase Auth custom claims
      await admin.auth().setCustomUserClaims(userId, {
        role: 'subscriber',
        clubId: saleData.clubId
      });
    }

    // Update sale record to mark registration as completed
    await saleDoc.ref.update({
      registrationCompleted: true,
      registrationCompletedAt: new Date(),
      customerName: `${firstName} ${lastName}`,
      customerPhone: phone || null,
      userId: userId,
      metadata: {
        ...saleData.metadata,
        registrationData: {
          firstName,
          lastName,
          phone,
          city,
          address,
          postalCode,
          completedAt: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      userId: userId,
      isNewUser: isNewUser,
      message: isNewUser 
        ? 'User registered successfully' 
        : 'User information updated successfully'
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
