import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
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

    // Check if invitation is still valid
    if (inviteData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      );
    }

    // Check expiration
    const expiresAt = inviteData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      // Update status to expired
      await inviteRef.update({ status: 'expired' });
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Return invitation data
    return NextResponse.json({
      inviteId: inviteDoc.id,
      email: inviteData.email,
      role: inviteData.role,
      clubId: inviteData.clubId || null,
      invitedBy: inviteData.invitedBy,
      packageId: inviteData.metadata?.packageId || null,
      metadata: inviteData.metadata || {}
    });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}
