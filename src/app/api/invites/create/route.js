import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';
import { generateInviteToken } from '@/lib/auth/jwt';
import { sendInvitationEmail } from '@/lib/resend/email';
import { sendInvitationSms } from '@/lib/twilio/sms';

export async function POST(request) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { 
      role, 
      inviteData, 
      recipientData, 
      message, 
      sendSms, 
      sendEmail = true 
    } = await request.json();
    
    const { user } = auth;
    
    // Validate permissions based on role
    const permissions = {
      platform_admin: ['agent'],
      agent: ['club_admin'],
      club_admin: ['seller', 'subscriber'],
      seller: ['subscriber']
    };
    
    if (!permissions[user.role]?.includes(role)) {
      return NextResponse.json(
        { error: 'Du har ikke tillatelse til å sende denne typen invitasjon' },
        { status: 403 }
      );
    }
    
    // Check if email is already registered
    const existingUser = await db.collection('users')
      .where('email', '==', recipientData.email)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'Denne e-postadressen er allerede registrert' },
        { status: 400 }
      );
    }
    
    // Check for existing pending invitation
    const existingInvite = await db.collection('invitations')
      .where('email', '==', recipientData.email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (!existingInvite.empty) {
      return NextResponse.json(
        { error: 'Det finnes allerede en ventende invitasjon for denne e-postadressen' },
        { status: 400 }
      );
    }
    
    // Generate invitation token
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiry
    
    // Prepare invitation data
    const invitationData = {
      email: recipientData.email,
      phone: recipientData.phone,
      firstName: recipientData.firstName,
      lastName: recipientData.lastName,
      role,
      token,
      status: 'pending',
      invitedBy: user.uid,
      invitedByRole: user.role,
      invitedByName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date(),
      expiresAt,
      customMessage: message || null,
      metadata: inviteData || {},
    };
    
    // Add specific metadata based on role
    if (role === 'club_admin') {
      // Agent inviting club admin - include package selection
      invitationData.metadata = {
        ...inviteData,
        agentId: user.uid,
        agentName: `${user.firstName} ${user.lastName}`,
        agentEmail: user.email,
        packageId: inviteData.packageId, // Ensure package ID is stored
        packageAssignedAt: new Date(),
      };
    } else if (role === 'seller') {
      // Club admin inviting seller
      if (user.clubId) {
        const clubDoc = await db.collection('clubs').doc(user.clubId).get();
        if (clubDoc.exists) {
          const clubData = clubDoc.data();
          invitationData.metadata = {
            ...inviteData,
            clubId: user.clubId,
            clubName: clubData.name,
            clubAdminId: user.uid,
          };
        }
      }
    } else if (role === 'subscriber') {
      // Seller or club admin inviting subscriber
      if (user.role === 'seller') {
        invitationData.metadata = {
          ...inviteData,
          sellerId: user.uid,
          sellerName: `${user.firstName} ${user.lastName}`,
          clubId: user.clubId,
        };
      } else if (user.role === 'club_admin' && user.clubId) {
        const clubDoc = await db.collection('clubs').doc(user.clubId).get();
        if (clubDoc.exists) {
          const clubData = clubDoc.data();
          invitationData.metadata = {
            ...inviteData,
            clubId: user.clubId,
            clubName: clubData.name,
            invitedDirectlyByClub: true,
          };
        }
      }
    }
    
    // Save invitation to Firestore
    const inviteRef = await db.collection('invitations').add(invitationData);
    
    // Send invitation email if enabled
    if (sendEmail && recipientData.email) {
      const emailResult = await sendInvitationEmail(
        recipientData.email,
        role,
        {
          token,
          firstName: recipientData.firstName,
          lastName: recipientData.lastName,
          inviterName: `${user.firstName} ${user.lastName}`,
          customMessage: message,
          ...invitationData.metadata,
        }
      );
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
      }
    }
    
    // Send SMS if enabled
    if (sendSms && recipientData.phone) {
      const smsResult = await sendInvitationSms(
        recipientData.phone,
        role,
        {
          token,
          inviterName: `${user.firstName} ${user.lastName}`,
          shortMessage: message?.substring(0, 160),
        }
      );
      
      if (!smsResult.success) {
        console.error('Failed to send invitation SMS:', smsResult.error);
      }
    }
    
    // Update invitation with notification status
    await inviteRef.update({
      emailSent: sendEmail && recipientData.email ? true : false,
      smsSent: sendSms && recipientData.phone ? true : false,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Invitasjon sendt',
      invitationId: inviteRef.id,
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke opprette invitasjon' },
      { status: 500 }
    );
  }
}
