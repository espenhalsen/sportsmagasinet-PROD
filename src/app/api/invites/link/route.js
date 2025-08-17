import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';
import { generateInviteToken } from '@/lib/auth/jwt';

export async function GET(request) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { user } = auth;
    
    // Only sellers and club admins can generate quick invite links
    if (!['seller', 'club_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Ikke autorisert til å generere invitasjonslenker' },
        { status: 403 }
      );
    }
    
    // Check if there's an existing active quick link for this user
    const existingLink = await db.collection('quick_invite_links')
      .where('createdBy', '==', user.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    let token;
    let linkId;
    
    if (!existingLink.empty) {
      // Return existing link
      const linkData = existingLink.docs[0].data();
      token = linkData.token;
      linkId = existingLink.docs[0].id;
    } else {
      // Generate new token and create link
      token = generateInviteToken();
      
      const linkData = {
        token,
        createdBy: user.uid,
        createdByRole: user.role,
        createdByName: `${user.firstName} ${user.lastName}`,
        status: 'active',
        createdAt: new Date(),
        usageCount: 0,
        maxUsage: 100, // Allow up to 100 uses per link
        targetRole: 'subscriber', // Quick links are for subscriber invites
      };
      
      // Add club info if applicable
      if (user.clubId) {
        const clubDoc = await db.collection('clubs').doc(user.clubId).get();
        if (clubDoc.exists) {
          linkData.clubId = user.clubId;
          linkData.clubName = clubDoc.data().name;
        }
      }
      
      // Save to database
      const linkRef = await db.collection('quick_invite_links').add(linkData);
      linkId = linkRef.id;
    }
    
    // Generate the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sportsmag247.com';
    const inviteUrl = `${baseUrl}/register/${token}`;
    
    return NextResponse.json({
      success: true,
      url: inviteUrl,
      token,
      linkId,
    });
    
  } catch (error) {
    console.error('Generate invite link error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke generere invitasjonslenke' },
      { status: 500 }
    );
  }
}
