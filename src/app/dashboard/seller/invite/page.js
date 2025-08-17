'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Send, ArrowLeft, AlertCircle, 
  CheckCircle, Gift, Star, Zap, Heart
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function SellerInviteSubscriber() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inviteMethod, setInviteMethod] = useState('email'); // 'email' or 'sms'
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    sendBoth: false, // Send both email and SMS
  });

  // Translations
  const translations = {
    nb: {
      title: 'Inviter ny abonnent',
      subtitle: 'Del Sportsmagasinet med venner og klubbmedlemmer',
      subscriberInfo: 'Abonnentinformasjon',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      email: 'E-postadresse',
      phone: 'Telefonnummer',
      inviteMethod: 'Invitasjonsmetode',
      emailInvite: 'Send via e-post',
      smsInvite: 'Send via SMS',
      bothInvite: 'Send både e-post og SMS',
      message: 'Personlig melding (valgfri)',
      messagePlaceholder: 'Fortell hvorfor de bør abonnere på Sportsmagasinet...',
      sendInvite: 'Send invitasjon',
      sending: 'Sender...',
      cancel: 'Avbryt',
      successTitle: 'Invitasjon sendt!',
      successMessage: 'Invitasjonen har blitt sendt til',
      sendAnother: 'Inviter flere',
      backToDashboard: 'Tilbake til dashboard',
      errorTitle: 'Kunne ikke sende invitasjon',
      requiredField: 'Dette feltet er påkrevd',
      invalidEmail: 'Ugyldig e-postadresse',
      invalidPhone: 'Ugyldig telefonnummer',
      benefits: 'Hvorfor abonnere?',
      benefit1: 'Eksklusive sportsanalyser og nyheter',
      benefit2: 'Ubegrenset tilgang til alle artikler',
      benefit3: 'Reklamefri leseopplevelse',
      benefit4: 'Støtt din lokale klubb',
      shareLink: 'Del invitasjonslenke',
      copyLink: 'Kopier lenke',
      linkCopied: 'Lenke kopiert!',
      quickInvite: 'Hurtiginvitasjon',
      quickInviteDesc: 'Send en rask invitasjon via SMS eller e-post',
    },
    sv: {
      title: 'Bjud in ny prenumerant',
      subtitle: 'Dela Sportsmagasinet med vänner och klubbmedlemmar',
      subscriberInfo: 'Prenumerantinformation',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      email: 'E-postadress',
      phone: 'Telefonnummer',
      inviteMethod: 'Inbjudningsmetod',
      emailInvite: 'Skicka via e-post',
      smsInvite: 'Skicka via SMS',
      bothInvite: 'Skicka både e-post och SMS',
      message: 'Personligt meddelande (valfritt)',
      messagePlaceholder: 'Berätta varför de bör prenumerera på Sportsmagasinet...',
      sendInvite: 'Skicka inbjudan',
      sending: 'Skickar...',
      cancel: 'Avbryt',
      successTitle: 'Inbjudan skickad!',
      successMessage: 'Inbjudan har skickats till',
      sendAnother: 'Bjud in fler',
      backToDashboard: 'Tillbaka till dashboard',
      errorTitle: 'Kunde inte skicka inbjudan',
      requiredField: 'Detta fält är obligatoriskt',
      invalidEmail: 'Ogiltig e-postadress',
      invalidPhone: 'Ogiltigt telefonnummer',
      benefits: 'Varför prenumerera?',
      benefit1: 'Exklusiva sportanalyser och nyheter',
      benefit2: 'Obegränsad tillgång till alla artiklar',
      benefit3: 'Reklamfri läsupplevelse',
      benefit4: 'Stöd din lokala klubb',
      shareLink: 'Dela inbjudningslänk',
      copyLink: 'Kopiera länk',
      linkCopied: 'Länk kopierad!',
      quickInvite: 'Snabbinbjudan',
      quickInviteDesc: 'Skicka en snabb inbjudan via SMS eller e-post',
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
    // Check required fields based on invite method
    if (inviteMethod === 'email' || formData.sendBoth) {
      if (!formData.email) {
        setError(`${texts.requiredField}: ${texts.email}`);
        return false;
      }
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(texts.invalidEmail);
        return false;
      }
    }

    if (inviteMethod === 'sms' || formData.sendBoth) {
      if (!formData.phone) {
        setError(`${texts.requiredField}: ${texts.phone}`);
        return false;
      }
      // Validate phone
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        setError(texts.invalidPhone);
        return false;
      }
    }

    // Names are optional but recommended
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
          role: 'subscriber',
          inviteData: {
            inviteMethod,
          },
          recipientData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          message: formData.message,
          sendSms: inviteMethod === 'sms' || formData.sendBoth,
          sendEmail: inviteMethod === 'email' || formData.sendBoth,
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
      sendBoth: false,
    });
    setSuccess(false);
    setError('');
  };

  const handleCopyLink = async () => {
    try {
      // Get seller's unique invite link
      const response = await fetch('/api/invites/link');
      const data = await response.json();
      
      if (data.link) {
        await navigator.clipboard.writeText(data.link);
        // Show temporary success message
        const button = document.getElementById('copy-link-btn');
        if (button) {
          button.textContent = texts.linkCopied;
          setTimeout(() => {
            button.textContent = texts.copyLink;
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error copying link:', err);
    }
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
                {texts.successMessage} {formData.email || formData.phone}
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
                  onClick={() => router.push('/dashboard/seller')}
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
            onClick={() => router.push('/dashboard/seller')}
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
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">{texts.benefits}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start">
                <Star className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{texts.benefit1}</span>
              </div>
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{texts.benefit2}</span>
              </div>
              <div className="flex items-start">
                <Gift className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{texts.benefit3}</span>
              </div>
              <div className="flex items-start">
                <Heart className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{texts.benefit4}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Share Link */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{texts.shareLink}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {texts.quickInviteDesc}
                </p>
              </div>
              <Button
                id="copy-link-btn"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {texts.copyLink}
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Invite Method */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{texts.inviteMethod}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="inviteMethod"
                    value="email"
                    checked={inviteMethod === 'email'}
                    onChange={(e) => setInviteMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Mail className="inline h-4 w-4 mr-1" />
                    {texts.emailInvite}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="inviteMethod"
                    value="sms"
                    checked={inviteMethod === 'sms'}
                    onChange={(e) => setInviteMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Phone className="inline h-4 w-4 mr-1" />
                    {texts.smsInvite}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="sendBoth"
                    checked={formData.sendBoth}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {texts.bothInvite}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Subscriber Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {texts.subscriberInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.firstName}
                  </label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.lastName}
                  </label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.email} {(inviteMethod === 'email' || formData.sendBoth) && '*'}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required={inviteMethod === 'email' || formData.sendBoth}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.phone} {(inviteMethod === 'sms' || formData.sendBoth) && '*'}
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+47 12345678"
                    required={inviteMethod === 'sms' || formData.sendBoth}
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/seller')}
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
