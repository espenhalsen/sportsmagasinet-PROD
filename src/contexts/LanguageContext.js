'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getCookie, setCookie } from 'cookies-next';

const LanguageContext = createContext();

export const translations = {
  nb: {
    // Navigation
    nav: {
      home: 'Hjem',
      articles: 'Artikler',
      about: 'Om oss',
      contact: 'Kontakt',
      login: 'Logg inn',
      logout: 'Logg ut',
      dashboard: 'Dashbord',
      profile: 'Profil',
    },
    // Common
    common: {
      loading: 'Laster...',
      error: 'En feil oppstod',
      success: 'Suksess',
      save: 'Lagre',
      cancel: 'Avbryt',
      delete: 'Slett',
      edit: 'Rediger',
      add: 'Legg til',
      search: 'Søk',
      filter: 'Filtrer',
      next: 'Neste',
      previous: 'Forrige',
      submit: 'Send inn',
      confirm: 'Bekreft',
      select: 'Velg',
      required: 'Påkrevd',
    },
    // Auth
    auth: {
      email: 'E-post',
      password: 'Passord',
      confirmPassword: 'Bekreft passord',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      birthDate: 'Fødselsdato',
      phoneNumber: 'Telefonnummer',
      companyName: 'Firmanavn',
      vatNumber: 'Org.nummer',
      address: 'Adresse',
      clubName: 'Klubbnavn',
      forgotPassword: 'Glemt passord?',
      rememberMe: 'Husk meg',
      loginTitle: 'Logg inn på Sportsmagasinet',
      registerTitle: 'Registrer deg',
      loginButton: 'Logg inn',
      registerButton: 'Registrer',
      noAccount: 'Har du ikke konto?',
      hasAccount: 'Har du allerede konto?',
      invalidCredentials: 'Ugyldig e-post eller passord',
    },
    // Dashboard
    dashboard: {
      welcome: 'Velkommen',
      overview: 'Oversikt',
      licenses: 'Lisenser',
      sales: 'Salg',
      clubs: 'Klubber',
      agents: 'Agenter',
      sellers: 'Selgere',
      articles: 'Artikler',
      statistics: 'Statistikk',
      settings: 'Innstillinger',
      totalLicenses: 'Totalt lisenser',
      usedLicenses: 'Brukte lisenser',
      availableLicenses: 'Tilgjengelige lisenser',
      monthlyRevenue: 'Månedlig inntekt',
      activeSubscriptions: 'Aktive abonnementer',
      inviteAgent: 'Inviter agent',
      inviteClub: 'Inviter klubb',
      inviteSeller: 'Inviter selger',
      assignLicenses: 'Tildel lisenser',
      viewDetails: 'Se detaljer',
    },
    // Subscription
    subscription: {
      title: 'Abonnement på Sportsmagasinet',
      price: 'Pris',
      perMonth: 'per måned',
      club: 'Klubb',
      seller: 'Selger',
      startDate: 'Startdato',
      endDate: 'Sluttdato',
      status: 'Status',
      active: 'Aktiv',
      cancelled: 'Kansellert',
      expired: 'Utløpt',
      subscribe: 'Abonner',
      cancel: 'Kanseller abonnement',
      renew: 'Forny abonnement',
    },
    // License packages
    packages: {
      title: 'Lisenpakker',
      selectPackage: 'Velg pakke',
      licenses: 'lisenser',
      pricePerLicense: 'Pris per lisens',
      clubProfit: 'Klubbfortjeneste',
      totalProfit: 'Total fortjeneste',
      companyRevenue: 'Selskapsinntekt',
      buyPackage: 'Kjøp pakke',
      packagePurchased: 'Pakke kjøpt',
      paymentPending: 'Betaling venter',
    },
    // Footer
    footer: {
      rights: 'Alle rettigheter reservert',
      privacy: 'Personvern',
      terms: 'Vilkår',
      cookies: 'Cookies',
      followUs: 'Følg oss',
    },
  },
  sv: {
    // Navigation
    nav: {
      home: 'Hem',
      articles: 'Artiklar',
      about: 'Om oss',
      contact: 'Kontakt',
      login: 'Logga in',
      logout: 'Logga ut',
      dashboard: 'Dashboard',
      profile: 'Profil',
    },
    // Common
    common: {
      loading: 'Laddar...',
      error: 'Ett fel uppstod',
      success: 'Framgång',
      save: 'Spara',
      cancel: 'Avbryt',
      delete: 'Radera',
      edit: 'Redigera',
      add: 'Lägg till',
      search: 'Sök',
      filter: 'Filtrera',
      next: 'Nästa',
      previous: 'Föregående',
      submit: 'Skicka',
      confirm: 'Bekräfta',
      select: 'Välj',
      required: 'Obligatorisk',
    },
    // Auth
    auth: {
      email: 'E-post',
      password: 'Lösenord',
      confirmPassword: 'Bekräfta lösenord',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      birthDate: 'Födelsedatum',
      phoneNumber: 'Telefonnummer',
      companyName: 'Företagsnamn',
      vatNumber: 'Org.nummer',
      address: 'Adress',
      clubName: 'Klubbnamn',
      forgotPassword: 'Glömt lösenord?',
      rememberMe: 'Kom ihåg mig',
      loginTitle: 'Logga in på Sportsmagasinet',
      registerTitle: 'Registrera dig',
      loginButton: 'Logga in',
      registerButton: 'Registrera',
      noAccount: 'Har du inget konto?',
      hasAccount: 'Har du redan ett konto?',
      invalidCredentials: 'Ogiltig e-post eller lösenord',
    },
    // Dashboard
    dashboard: {
      welcome: 'Välkommen',
      overview: 'Översikt',
      licenses: 'Licenser',
      sales: 'Försäljning',
      clubs: 'Klubbar',
      agents: 'Agenter',
      sellers: 'Säljare',
      articles: 'Artiklar',
      statistics: 'Statistik',
      settings: 'Inställningar',
      totalLicenses: 'Totalt licenser',
      usedLicenses: 'Använda licenser',
      availableLicenses: 'Tillgängliga licenser',
      monthlyRevenue: 'Månadsinkomst',
      activeSubscriptions: 'Aktiva prenumerationer',
      inviteAgent: 'Bjud in agent',
      inviteClub: 'Bjud in klubb',
      inviteSeller: 'Bjud in säljare',
      assignLicenses: 'Tilldela licenser',
      viewDetails: 'Se detaljer',
    },
    // Subscription
    subscription: {
      title: 'Prenumeration på Sportsmagasinet',
      price: 'Pris',
      perMonth: 'per månad',
      club: 'Klubb',
      seller: 'Säljare',
      startDate: 'Startdatum',
      endDate: 'Slutdatum',
      status: 'Status',
      active: 'Aktiv',
      cancelled: 'Avbruten',
      expired: 'Utgången',
      subscribe: 'Prenumerera',
      cancel: 'Avbryt prenumeration',
      renew: 'Förnya prenumeration',
    },
    // License packages
    packages: {
      title: 'Licenspaket',
      selectPackage: 'Välj paket',
      licenses: 'licenser',
      pricePerLicense: 'Pris per licens',
      clubProfit: 'Klubbvinst',
      totalProfit: 'Total vinst',
      companyRevenue: 'Företagsintäkt',
      buyPackage: 'Köp paket',
      packagePurchased: 'Paket köpt',
      paymentPending: 'Betalning väntar',
    },
    // Footer
    footer: {
      rights: 'Alla rättigheter förbehållna',
      privacy: 'Integritet',
      terms: 'Villkor',
      cookies: 'Cookies',
      followUs: 'Följ oss',
    },
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('nb');

  useEffect(() => {
    const savedLang = getCookie('language') || 'nb';
    setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang) => {
    if (lang === 'nb' || lang === 'sv') {
      setLanguage(lang);
      setCookie('language', lang, { maxAge: 60 * 60 * 24 * 365 });
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
