import twilio from 'twilio';

// Initialize Twilio client - you'll need to add your credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your-account-sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your-auth-token';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+47XXXXXXXX';

const client = twilio(accountSid, authToken);

export async function sendSubscriptionSMS(phoneNumber, data) {
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/subscriber/${data.token}`;
  
  const message = `
Sportsmagasinet - Abonnement

${data.clubName} tilbyr deg abonnement på Sportsmagasinet.

Pris: 100 NOK/måned
Klubb: ${data.clubName}
Selger: ${data.sellerName}

Klikk for å registrere:
${registrationUrl}

Lenken utløper om 24 timer.
`;

  try {
    const result = await client.messages.create({
      body: message.trim(),
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function sendVerificationSMS(phoneNumber, code) {
  const message = `Din Sportsmagasinet verifikasjonskode: ${code}. Gyldig i 10 minutter.`;
  
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('Verification SMS error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function sendInvitationSms(phoneNumber, role, data) {
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/${data.token}`;
  
  // Create role-specific invitation messages
  let message = '';
  
  switch(role) {
    case 'agent':
      message = `
Sportsmagasinet - Agent Invitasjon

Du er invitert som agent for Sportsmagasinet!

Som agent kan du:
• Invitere klubber
• Administrere lisenspakker
• Se salgsstatistikk

Registrer deg her:
${registrationUrl}

Invitasjonen utløper om 24 timer.
`;
      break;
      
    case 'club_admin':
      message = `
Sportsmagasinet - Klubb Invitasjon

${data.inviterName} har invitert din klubb til Sportsmagasinet!

Som klubbadmin kan du:
• Kjøpe lisenspakker
• Invitere selgere
• Administrere medlemmer

Registrer deg her:
${registrationUrl}

Invitasjonen utløper om 24 timer.
`;
      break;
      
    case 'seller':
      message = `
Sportsmagasinet - Selger Invitasjon

${data.clubName} har invitert deg som selger!

Som selger kan du:
• Selge abonnementer
• Tjene provisjon
• Se din salgsstatistikk

Registrer deg her:
${registrationUrl}

Invitasjonen utløper om 24 timer.
`;
      break;
      
    case 'subscriber':
      message = `
Sportsmagasinet - Abonnement

${data.clubName} tilbyr deg abonnement på Sportsmagasinet.

Pris: 100 NOK/måned
Klubb: ${data.clubName}
Selger: ${data.sellerName}

Registrer deg her:
${registrationUrl}

Invitasjonen utløper om 24 timer.
`;
      break;
      
    default:
      message = `
Sportsmagasinet Invitasjon

Du har blitt invitert til Sportsmagasinet.

Registrer deg her:
${registrationUrl}

Invitasjonen utløper om 24 timer.
`;
  }
  
  try {
    const result = await client.messages.create({
      body: message.trim(),
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Invitation SMS error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function formatPhoneNumber(phoneNumber, countryCode = '+47') {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If number doesn't start with country code, add it
  if (!cleaned.startsWith(countryCode.substring(1))) {
    cleaned = countryCode + cleaned;
  } else {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}
