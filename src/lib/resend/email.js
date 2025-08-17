import { Resend } from 'resend';

// Initialize Resend - you'll need to add your API key
const resend = new Resend(process.env.RESEND_API_KEY || 'your-resend-api-key');

const EMAIL_FROM = 'Sportsmagasinet <noreply@sportsmag247.com>';

export async function sendInvitationEmail(to, type, inviteData) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/${inviteData.token}`;
  
  const templates = {
    agent: {
      subject: 'Invitasjon til Sportsmagasinet - Agent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/icons/sportsmagasinet.png" alt="Sportsmagasinet" style="width: 200px; margin-bottom: 20px;">
          <h2>Velkommen som agent for Sportsmagasinet!</h2>
          <p>Du har blitt invitert til å bli agent for Sportsmagasinet.</p>
          <p>Som agent vil du kunne:</p>
          <ul>
            <li>Selge lisenpakker til klubber</li>
            <li>Administrere dine klubber</li>
            <li>Følge opp salg og statistikk</li>
          </ul>
          <p>Klikk på lenken nedenfor for å fullføre registreringen:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Fullfør registrering</a>
          <p style="color: #666; font-size: 14px;">Denne invitasjonen utløper om 48 timer.</p>
        </div>
      `
    },
    club_admin: {
      subject: `Invitasjon til Sportsmagasinet - ${inviteData.clubName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/icons/sportsmagasinet.png" alt="Sportsmagasinet" style="width: 200px; margin-bottom: 20px;">
          <h2>Velkommen ${inviteData.clubName}!</h2>
          <p>Din klubb har blitt invitert til å delta i Sportsmagasinet.</p>
          <p><strong>Valgt lisenpakke:</strong> ${inviteData.packageSize} lisenser</p>
          <p>Som klubbadministrator vil du kunne:</p>
          <ul>
            <li>Administrere klubbens lisenser</li>
            <li>Invitere selgere fra klubben</li>
            <li>Følge opp salg og inntekter</li>
          </ul>
          <p>Klikk på lenken nedenfor for å fullføre registreringen:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Fullfør registrering</a>
          <p style="color: #666; font-size: 14px;">Denne invitasjonen utløper om 48 timer.</p>
        </div>
      `
    },
    seller: {
      subject: `Invitasjon fra ${inviteData.clubName} - Sportsmagasinet`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/icons/sportsmagasinet.png" alt="Sportsmagasinet" style="width: 200px; margin-bottom: 20px;">
          <h2>Du er invitert som selger!</h2>
          <p>${inviteData.clubName} har invitert deg til å selge Sportsmagasinet-abonnementer.</p>
          <p>Som selger vil du kunne:</p>
          <ul>
            <li>Selge abonnementer til medlemmer</li>
            <li>Følge opp dine salg</li>
            <li>Bidra til klubbens inntekter</li>
          </ul>
          <p>Klikk på lenken nedenfor for å komme i gang:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Start registrering</a>
          <p style="color: #666; font-size: 14px;">Denne invitasjonen utløper om 48 timer.</p>
        </div>
      `
    }
  };
  
  const template = templates[type];
  if (!template) {
    throw new Error(`Ukjent invitasjonstype: ${type}`);
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSubscriptionConfirmation(to, subscriptionData) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL}/icons/sportsmagasinet.png" alt="Sportsmagasinet" style="width: 200px; margin-bottom: 20px;">
      <h2>Velkommen til Sportsmagasinet!</h2>
      <p>Takk for at du abonnerer på Sportsmagasinet gjennom ${subscriptionData.clubName}.</p>
      <p><strong>Abonnementsdetaljer:</strong></p>
      <ul>
        <li>Pris: 100 NOK per måned</li>
        <li>Klubb: ${subscriptionData.clubName}</li>
        <li>Start dato: ${new Date().toLocaleDateString('nb-NO')}</li>
      </ul>
      <p>Du har nå full tilgang til alle artikler på sportsmag247.com</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Logg inn</a>
      <p style="color: #666; font-size: 14px;">Abonnementet fornyes automatisk hver måned.</p>
    </div>
  `;
  
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Velkommen til Sportsmagasinet!',
      html,
    });
    
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
