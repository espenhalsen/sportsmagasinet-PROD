'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Send, ArrowLeft, AlertCircle, 
  CheckCircle, Target, Award, TrendingUp
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function ClubInviteSeller() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    sendSms: false,
  });

  // Translations
  const translations = {
    nb: {
      title: 'Inviter ny selger',
      subtitle: 'Rekrutter en selger for din klubb',
      sellerInfo: 'Selgerinformasjon',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      email: 'E-postadresse',
      phone: 'Telefonnummer',
      message: 'Melding (valgfri)',
      messagePlaceholder: 'Legg til en personlig melding om muligheten...',
      sendSms: 'Send også SMS-varsel',
      sendInvite: 'Send invitasjon',
      sending: 'Sender...',
      cancel: 'Avbryt',
      successTitle: 'Invitasjon sendt!',
      successMessage: 'Selgerinvitasjon har blitt sendt til',
      sendAnother: 'Inviter flere selgere',
      backToDashboard: 'Tilbake til dashboard',
      errorTitle: 'Kunne ikke sende invitasjon',
      requiredField: 'Dette feltet er påkrevd',
      invalidEmail: 'Ugyldig e-postadresse',
      invalidPhone: 'Ugyldig telefonnummer',
      benefits: 'Fordeler for selgeren',
      benefit1: 'Mulighet til å bidra til klubben',
      benefit2: 'Fleksibel arbeidstid',
      benefit3: 'Støtte og opplæring fra klubben',
      benefit4: 'Anerkjennelse for gode resultater',
    },
    sv: {
      title: 'Bjud in ny säljare',
      subtitle: 'Rekrytera en säljare för din klubb',
      sellerInfo: 'Säljarinformation',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      email: 'E-postadress',
      phone: 'Telefonnummer',
      message: 'Meddelande (valfritt)',
      messagePlaceholder: 'Lägg till ett personligt meddelande om möjligheten...',
      sendSms: 'Skicka även SMS-avisering',
      sendInvite: 'Skicka inbjudan',
      sending: 'Skickar...',
      cancel: 'Avbryt',
      successTitle: 'Inbjudan skickad!',
      successMessage: 'Säljarinbjudan har skickats till',
      sendAnother: 'Bjud in fler säljare',
      backToDashboard: 'Tillbaka till dashboard',
      errorTitle: 'Kunde inte skicka inbjudan',
      requiredField: 'Detta fält är obligatoriskt',
      invalidEmail: 'Ogiltig e-postadress',
      invalidPhone: 'Ogiltigt telefonnummer',
      benefits: 'Fördelar för säljaren',
      benefit1: 'Möjlighet att bidra till klubben',
      benefit2: 'Flexibel arbetstid',
      benefit3: 'Stöd och utbildning från klubben',
      benefit4: 'Erkännande för goda resultat',
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
    const required = ['firstName', 'lastName', 'email'];
    for (const field of required) {
      if (!formData[field]) {
        setError(`${texts.requiredField}: ${field}`);
        return false;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(texts.invalidEmail);
      return false;
    }

    // Validate phone if provided or SMS is enabled
    if (formData.sendSms || formData.phone) {
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
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
          role: 'seller',
          recipientData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
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
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
                {texts.successMessage} {formData.email}
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
                  onClick={() => router.push('/dashboard/club')}
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
            onClick={() => router.push('/dashboard/club')}
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

        {/* Benefits Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">{texts.benefits}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Award className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-800">{texts.benefit1}</span>
              </li>
              <li className="flex items-start">
                <Target className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-800">{texts.benefit2}</span>
              </li>
              <li className="flex items-start">
                <User className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-800">{texts.benefit3}</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-800">{texts.benefit4}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Seller Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {texts.sellerInfo}
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
                    name="firstName"
                    value={formData.firstName}
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
                    name="lastName"
                    value={formData.lastName}
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
                    name="email"
                    value={formData.email}
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+47 12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Tilleggsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
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
              onClick={() => router.push('/dashboard/club')}
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
