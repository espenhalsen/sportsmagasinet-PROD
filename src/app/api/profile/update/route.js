import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';

export async function PUT(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    const body = await request.json();

    // Validate input data
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      postalCode,
      profileImageUrl
    } = body;

    // Basic validation - only if we're updating profile info (not just image)
    const isProfileImageOnlyUpdate = profileImageUrl !== undefined && 
      !firstName && !lastName && !email && !phone && !city && !address && !postalCode;
    
    if (!isProfileImageOnlyUpdate && (!firstName || !lastName || !email)) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Email validation - only if email is provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      if (email !== user.email) {
        const existingUserQuery = await db.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();

        if (!existingUserQuery.empty) {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 400 }
          );
        }
      }
    }

    // Update user data
    const updateData = {
      updatedAt: new Date(),
    };

    // Add profile fields if provided
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone?.trim() || '';
    if (city !== undefined) updateData.city = city?.trim() || '';
    if (address !== undefined) updateData.address = address?.trim() || '';
    if (postalCode !== undefined) updateData.postalCode = postalCode?.trim() || '';

    // Add profile image URL if provided
    if (profileImageUrl !== undefined) {
      updateData.profileImageUrl = profileImageUrl;
    }

    // Update user document
    await db.collection('users').doc(user.uid).update(updateData);

    // Log the update
    await db.collection('activityLogs').add({
      type: 'profile_updated',
      userId: user.uid,
      timestamp: new Date(),
      metadata: {
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
        userRole: user.role
      }
    });

    console.log('Profile updated for user:', user.uid);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
