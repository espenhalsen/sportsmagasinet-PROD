'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowRight, Check, User, Building, Phone, Mail, Lock, MapPin, Calendar, Package, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { LICENSE_PACKAGES, getLicensePackageById, formatCurrency } from '@/utils/packages';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [inviteData, setInviteData] = useState(null);
  
  // Form data for different roles
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    
    // Agent fields
    companyName: '',
    organizationNumber: '',
    
    // Club admin fields
    clubName: '',
    clubAddress: '',
    clubZipCode: '',
    clubCity: '',
    
    // Seller fields
    birthDate: '',
    
    // Terms
    acceptTerms: false,
    // Package confirmation for club admin
    packageConfirmed: false,
  });

  // Translations
  const translations = {
    nb: {
      title: 'Registrering',
      loading: 'Laster...',
      invalidInvite: 'Ugyldig eller utløpt invitasjon',
      step1Title: 'Personlig informasjon',
      step2Title: 'Kontaktinformasjon',
      step3TitleAgent: 'Firmainformasjon',
      step3TitleClub: 'Klubbinformasjon',
      step3TitleSeller: 'Tilleggsinformasjon',
      step3TitleSubscriber: 'Abonnementsinformasjon',
      step4TitleClub: 'Pakkebekreftelse',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      email: 'E-post',
      phone: 'Telefon',
      password: 'Passord',
      confirmPassword: 'Bekreft passord',
      companyName: 'Firmanavn',
      organizationNumber: 'Organisasjonsnummer',
      clubName: 'Klubbnavn',
      clubAddress: 'Klubbadresse',
      clubZipCode: 'Postnummer',
      clubCity: 'Poststed',
      birthDate: 'Fødselsdato',
      acceptTerms: 'Jeg godtar vilkår og betingelser',
      packageSelected: 'Din agent har valgt følgende pakke for klubben:',
      packageConfirm: 'Jeg bekrefter at dette er riktig pakke for vår klubb',
      packagePrice: 'Månedlig kostnad',
      packageLicenses: 'Antall lisenser',
      packageFeatures: 'Inkludert i pakken',
      next: 'Neste',
      previous: 'Tilbake',
      complete: 'Fullfør registrering',
      passwordMismatch: 'Passordene er ikke like',
      weakPassword: 'Passordet må være minst 8 tegn',
      registrationComplete: 'Registrering fullført!',
      redirecting: 'Videresender til innlogging...',
    },
    sv: {
      title: 'Registrering',
      loading: 'Laddar...',
      invalidInvite: 'Ogiltig eller utgången inbjudan',
      step1Title: 'Personlig information',
      step2Title: 'Kontaktinformation',
      step3TitleAgent: 'Företagsinformation',
      step3TitleClub: 'Klubbinformation',
      step3TitleSeller: 'Ytterligare information',
      step3TitleSubscriber: 'Prenumerationsinformation',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      email: 'E-post',
      phone: 'Telefon',
      password: 'Lösenord',
      confirmPassword: 'Bekräfta lösenord',
      companyName: 'Företagsnamn',
      organizationNumber: 'Organisationsnummer',
      clubName: 'Klubbnamn',
      clubAddress: 'Klubbadress',
      clubZipCode: 'Postnummer',
      clubCity: 'Postort',
      birthDate: 'Födelsedatum',
      acceptTerms: 'Jag accepterar villkor och bestämmelser',
      next: 'Nästa',
      previous: 'Tillbaka',
      complete: 'Slutför registrering',
      passwordMismatch: 'Lösenorden matchar inte',
      weakPassword: 'Lösenordet måste vara minst 8 tecken',
      registrationComplete: 'Registrering slutförd!',
      redirecting: 'Omdirigerar till inloggning...',
    }
  };

  const texts = translations[language] || translations.nb;

  // Verify invitation token
  useEffect(() => {
    const verifyInvite = async () => {
      try {
        const response = await fetch(`/api/invites/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });

        if (!response.ok) {
          throw new Error('Invalid invite');
        }

        const data = await response.json();
        setInviteData(data);
        setFormData(prev => ({
          ...prev,
          email: data.email || '',
        }));
      } catch (err) {
        setError(texts.invalidInvite);
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      verifyInvite();
    }
  }, [params.token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName;
      case 2:
        if (formData.password !== formData.confirmPassword) {
          setError(texts.passwordMismatch);
          return false;
        }
        if (formData.password.length < 8) {
          setError(texts.weakPassword);
          return false;
        }
        return formData.email && formData.phone && formData.password;
      case 3:
        if (inviteData?.role === 'agent') {
          return formData.companyName && formData.organizationNumber && formData.acceptTerms;
        }
        if (inviteData?.role === 'club_admin') {
          return formData.clubName && formData.clubAddress && formData.clubZipCode && formData.clubCity;
        }
        if (inviteData?.role === 'seller') {
          return formData.birthDate && formData.acceptTerms;
        }
        return formData.acceptTerms;
      case 4:
        if (inviteData?.role === 'club_admin') {
          return formData.packageConfirmed && formData.acceptTerms;
        }
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError('');
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateStep()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message
      setStep(5);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success step
  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{texts.registrationComplete}</h2>
            <p className="text-gray-600">{texts.redirecting}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>{texts.title}</CardTitle>
            <CardDescription>
              {inviteData?.role && `Rolle: ${inviteData.role}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-8">
              {(inviteData?.role === 'club_admin' ? [1, 2, 3, 4] : [1, 2, 3]).map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {num}
                  </div>
                  {num < (inviteData?.role === 'club_admin' ? 4 : 3) && (
                    <div className={`w-full h-1 ${
                      step > num ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                {error}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{texts.step1Title}</h3>
                  <p className="text-gray-600 mb-4">
                    {inviteData?.role === 'agent' && 'Fyll inn dine personlige opplysninger for å opprette din agent-konto.'}
                    {inviteData?.role === 'club_admin' && 'Fyll inn dine personlige opplysninger for å opprette din klubbadmin-konto.'}
                    {inviteData?.role === 'seller' && 'Fyll inn dine personlige opplysninger for å opprette din selger-konto.'}
                    {inviteData?.role === 'subscriber' && 'Fyll inn dine personlige opplysninger for å opprette ditt abonnement.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={User}
                    label={texts.firstName}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    icon={User}
                    label={texts.lastName}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{texts.step2Title}</h3>
                  <p className="text-gray-600 mb-4">
                    Fyll inn din kontaktinformasjon og opprett et sikkert passord for kontoen din.
                  </p>
                </div>
                <Input
                  icon={Mail}
                  label={texts.email}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={inviteData?.email}
                  required
                />
                <Input
                  icon={Phone}
                  label={texts.phone}
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  icon={Lock}
                  label={texts.password}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  icon={Lock}
                  label={texts.confirmPassword}
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            {/* Step 3: Role-specific Information */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {inviteData?.role === 'agent' && texts.step3TitleAgent}
                    {inviteData?.role === 'club_admin' && texts.step3TitleClub}
                    {inviteData?.role === 'seller' && texts.step3TitleSeller}
                    {inviteData?.role === 'subscriber' && texts.step3TitleSubscriber}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {inviteData?.role === 'agent' && 'Legg til informasjon om selskapet ditt for å fullføre agent-registreringen.'}
                    {inviteData?.role === 'club_admin' && 'Legg til informasjon om klubben din for å fullføre registreringen.'}
                    {inviteData?.role === 'seller' && 'Bekreft vilkårene for å fullføre selger-registreringen.'}
                    {inviteData?.role === 'subscriber' && 'Bekreft vilkårene for å aktivere ditt abonnement.'}
                  </p>
                </div>

                {/* Agent fields */}
                {inviteData?.role === 'agent' && (
                  <>
                    <Input
                      icon={Building}
                      label={texts.companyName}
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      icon={Building}
                      label={texts.organizationNumber}
                      name="organizationNumber"
                      value={formData.organizationNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </>
                )}

                {/* Club admin fields */}
                {inviteData?.role === 'club_admin' && (
                  <>
                    <Input
                      icon={Building}
                      label={texts.clubName}
                      name="clubName"
                      value={formData.clubName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      icon={MapPin}
                      label={texts.clubAddress}
                      name="clubAddress"
                      value={formData.clubAddress}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        icon={MapPin}
                        label={texts.clubZipCode}
                        name="clubZipCode"
                        value={formData.clubZipCode}
                        onChange={handleInputChange}
                        required
                      />
                      <Input
                        icon={MapPin}
                        label={texts.clubCity}
                        name="clubCity"
                        value={formData.clubCity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Seller fields */}
                {inviteData?.role === 'seller' && (
                  <Input
                    icon={Calendar}
                    label={texts.birthDate}
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                  />
                )}

                {/* Terms acceptance - only for non-club-admin */}
                {inviteData?.role !== 'club_admin' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      {texts.acceptTerms}
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Package Confirmation (Club Admin only) */}
            {step === 4 && inviteData?.role === 'club_admin' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{texts.step4TitleClub}</h3>
                  <p className="text-gray-600 mb-6">{texts.packageSelected}</p>
                </div>

                {(() => {
                  if (!inviteData?.packageId) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">Ingen pakke er valgt for denne invitasjonen.</p>
                        <p className="text-sm text-red-500 mt-2">PackageId: {inviteData?.packageId || 'undefined'}</p>
                      </div>
                    );
                  }

                  const selectedPackage = getLicensePackageById(inviteData.packageId);
                  if (!selectedPackage) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">Pakke ikke funnet: {inviteData.packageId}</p>
                        <p className="text-sm text-red-500 mt-2">Tilgjengelige pakker: {LICENSE_PACKAGES.map(p => p.id).join(', ')}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {selectedPackage.name}
                          </h4>
                          <p className="text-gray-600 mb-3">
                            {selectedPackage.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-sm text-gray-600">{texts.packageLicenses}</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {selectedPackage.licenses} lisenser
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-sm text-gray-600">{texts.packagePrice}</div>
                              <div className="text-lg font-semibold text-red-600">
                                {formatCurrency(selectedPackage.monthlyDebt)} / mnd
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-2">{texts.packageFeatures}:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {selectedPackage.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="packageConfirmed"
                    name="packageConfirmed"
                    checked={formData.packageConfirmed}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="packageConfirmed" className="text-sm text-gray-700">
                    {texts.packageConfirm}
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    {texts.acceptTerms}
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Neste steg:</h5>
                  <p className="text-sm text-gray-600">
                    Etter registrering vil du kunne logge inn på ditt klubbadmin-dashboard hvor du kan aktivere pakken 
                    og starte betalingsabonnementet via Stripe. Når betalingen er bekreftet, kan dine selgere begynne å selge lisenser.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    onClick={handlePrevious}
                    size="lg"
                  >
                    ← Tilbake
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {step < (inviteData?.role === 'club_admin' ? 4 : 3) ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    size="lg"
                  >
                    Neste →
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading || (step === 3 && !formData.acceptTerms) || (step === 4 && !formData.packageConfirmed)}
                    size="lg"
                  >
                    {loading ? 'Oppretter konto...' : 'Fullfør registrering'}
                    {!loading && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                )}
              </div>
              
              {/* Step indicator */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Steg {step} av {inviteData?.role === 'club_admin' ? 4 : 3}
                {step === 1 && ' - Personlig informasjon'}
                {step === 2 && ' - Kontaktinformasjon'}
                {step === 3 && (inviteData?.role === 'club_admin' ? ' - Organisasjonsinformasjon' : ' - Fullfør registrering')}
                {step === 4 && inviteData?.role === 'club_admin' && ' - Pakkebekreftelse'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
