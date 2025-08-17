'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Mail, Phone, User, Globe, MapPin, 
  Send, ArrowLeft, AlertCircle, CheckCircle, Package, CreditCard
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { LICENSE_PACKAGES, formatCurrency } from '@/utils/packages';

export default function AgentInviteClub() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    clubName: '',
    organizationNumber: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    address: '',
    city: '',
    postalCode: '',
    country: language === 'sv' ? 'SE' : 'NO',
    packageId: 'standard-250', // Default to Standard package
    message: '',
    sendSms: false,
  });

  // Translations
  const translations = {
    nb: {
      title: 'Inviter ny klubb',
      subtitle: 'Send invitasjon til klubbadministrator',
      clubInfo: 'Klubbinformasjon',
      packageInfo: 'Velg lisens pakke',
      packageSubtitle: 'Velg pakken som passer best for klubbens størrelse',
      clubName: 'Klubbnavn',
      organizationNumber: 'Organisasjonsnummer',
      adminInfo: 'Administrator informasjon',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      email: 'E-postadresse',
      phone: 'Telefonnummer',
      address: 'Adresse',
      city: 'By',
      postalCode: 'Postnummer',
      country: 'Land',
      norway: 'Norge',
      sweden: 'Sverige',
      message: 'Melding (valgfri)',
      messagePlaceholder: 'Legg til en personlig melding til invitasjonen...',
      sendSms: 'Send også SMS-varsel',
      monthlyCommission: 'Din månedlige provisjon',
      totalLicenses: 'Antall lisenser',
      monthlyPrice: 'Klubbens månedlige kostnad',
      sendInvite: 'Send invitasjon',
      sending: 'Sender...',
      cancel: 'Avbryt',
      successTitle: 'Invitasjon sendt!',
      successMessage: 'Invitasjonen har blitt sendt til',
      sendAnother: 'Send ny invitasjon',
      backToDashboard: 'Tilbake til dashboard',
      errorTitle: 'Kunne ikke sende invitasjon',
      requiredField: 'Dette feltet er påkrevd',
      invalidEmail: 'Ugyldig e-postadresse',
      invalidPhone: 'Ugyldig telefonnummer',
    },
    sv: {
      title: 'Bjud in ny klubb',
      subtitle: 'Skicka inbjudan till klubbadministratör',
      clubInfo: 'Klubbinformation',
      clubName: 'Klubbnamn',
      organizationNumber: 'Organisationsnummer',
      adminInfo: 'Administratörsinformation',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      email: 'E-postadress',
      phone: 'Telefonnummer',
      address: 'Adress',
      city: 'Stad',
      postalCode: 'Postnummer',
      country: 'Land',
      norway: 'Norge',
      sweden: 'Sverige',
      message: 'Meddelande (valfritt)',
      messagePlaceholder: 'Lägg till ett personligt meddelande till inbjudan...',
      sendSms: 'Skicka även SMS-avisering',
      sendInvite: 'Skicka inbjudan',
      sending: 'Skickar...',
      cancel: 'Avbryt',
      successTitle: 'Inbjudan skickad!',
      successMessage: 'Inbjudan har skickats till',
      sendAnother: 'Skicka ny inbjudan',
      backToDashboard: 'Tillbaka till dashboard',
      errorTitle: 'Kunde inte skicka inbjudan',
      requiredField: 'Detta fält är obligatoriskt',
      invalidEmail: 'Ogiltig e-postadress',
      invalidPhone: 'Ogiltigt telefonnummer',
    }
  };

  const texts = translations[language] || translations.nb;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    // Check required fields
    const required = ['clubName', 'adminFirstName', 'adminLastName', 'adminEmail'];
    for (const field of required) {
      if (!formData[field]) {
        setError(`${texts.requiredField}: ${field}`);
        return false;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      setError(texts.invalidEmail);
      return false;
    }

    // Validate phone if provided or SMS is enabled
    if (formData.sendSms || formData.adminPhone) {
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(formData.adminPhone.replace(/\s/g, ''))) {
        setError(texts.invalidPhone);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'club_admin',
          inviteData: {
            clubName: formData.clubName,
            organizationNumber: formData.organizationNumber,
            packageId: formData.packageId, // Include selected package
            address: {
              street: formData.address,
              city: formData.city,
              postalCode: formData.postalCode,
              country: formData.country,
            },
          },
          recipientData: {
            firstName: formData.adminFirstName,
            lastName: formData.adminLastName,
            email: formData.adminEmail,
            phone: formData.adminPhone,
          },
          message: formData.message,
          sendSms: formData.sendSms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.message || texts.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      clubName: '',
      organizationNumber: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPhone: '',
      address: '',
      city: '',
      postalCode: '',
      country: language === 'sv' ? 'SE' : 'NO',
      packageId: 'standard-250', // Default to Standard package
      message: '',
      sendSms: false,
    });
    setSuccess(false);
    setError('');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {texts.successTitle}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {texts.successMessage} {formData.adminEmail}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleReset}
                >
                  {texts.sendAnother}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/agent')}
                >
                  {texts.backToDashboard}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/agent')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {texts.backToDashboard}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
          <p className="text-gray-600 mt-1">{texts.subtitle}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="flex items-center p-4">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          {/* Club Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                {texts.clubInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.clubName} *
                  </label>
                  <Input
                    type="text"
                    name="clubName"
                    value={formData.clubName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.organizationNumber}
                  </label>
                  <Input
                    type="text"
                    name="organizationNumber"
                    value={formData.organizationNumber}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.address}
                  </label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.city}
                  </label>
                  <Input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.postalCode}
                  </label>
                  <Input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.country}
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NO">{texts.norway}</option>
                    <option value="SE">{texts.sweden}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {texts.packageInfo}
              </CardTitle>
              <CardDescription>{texts.packageSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {LICENSE_PACKAGES.map((pkg) => {
                  const isSelected = formData.packageId === pkg.id;
                  const commission = pkg.licenses * pkg.agentCommission;
                  
                  return (
                    <div key={pkg.id} className="relative">
                      <input
                        type="radio"
                        id={pkg.id}
                        name="packageId"
                        value={pkg.id}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor={pkg.id}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                              {pkg.popular && (
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  POPULÆR
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div className="bg-white rounded-lg p-3 border">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  <span className="text-xs font-medium text-gray-600">{texts.totalLicenses}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                  {pkg.licenses.toLocaleString()} lisenser
                                </p>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 border">
                                <div className="flex items-center space-x-2 mb-1">
                                  <CreditCard className="h-4 w-4 text-red-600" />
                                  <span className="text-xs font-medium text-red-600">Månedlig gjeld</span>
                                </div>
                                <p className="text-sm font-bold text-red-700">
                                  {formatCurrency(pkg.monthlyDebt)} / mnd
                                </p>
                              </div>
                              
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center space-x-2 mb-1">
                                  <CreditCard className="h-4 w-4 text-green-600" />
                                  <span className="text-xs font-medium text-green-600">{texts.monthlyCommission}</span>
                                </div>
                                <p className="text-sm font-bold text-green-700">
                                  {formatCurrency(commission)} / mnd
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600">
                              {pkg.features.slice(0, 2).map((feature, index) => (
                                <span key={index}>
                                  • {feature}
                                  {index === 0 && ' '}
                                </span>
                              ))}
                              {pkg.features.length > 2 && (
                                <span className="text-blue-600 font-medium">
                                  +{pkg.features.length - 2} flere funksjoner
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className={`ml-4 flex-shrink-0 w-5 h-5 border-2 rounded-full ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <div className="w-full h-full rounded-full bg-white m-0.5"></div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Administrator Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {texts.adminInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.firstName} *
                  </label>
                  <Input
                    type="text"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.lastName} *
                  </label>
                  <Input
                    type="text"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.email} *
                  </label>
                  <Input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.phone}
                  </label>
                  <Input
                    type="tel"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    placeholder="+47 12345678"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.message}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={texts.messagePlaceholder}
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="sendSms"
                    checked={formData.sendSms}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {texts.sendSms}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/agent')}
              disabled={loading}
            >
              {texts.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {texts.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {texts.sendInvite}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
