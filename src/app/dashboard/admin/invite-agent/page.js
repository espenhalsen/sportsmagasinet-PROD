'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Send, Check, AlertCircle } from 'lucide-react';

export default function InviteAgentPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sendSms, setSendSms] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });

  const text = {
    nb: {
      title: 'Inviter Ny Agent',
      subtitle: 'Send invitasjon til en ny agent for å selge lisenser',
      firstName: 'Fornavn',
      lastName: 'Etternavn',
      email: 'E-postadresse',
      phone: 'Telefonnummer',
      company: 'Selskap (valgfritt)',
      message: 'Personlig melding (valgfritt)',
      sendSmsLabel: 'Send også SMS-invitasjon',
      sendButton: 'Send Invitasjon',
      sending: 'Sender...',
      back: 'Tilbake',
      successTitle: 'Invitasjon Sendt!',
      successMessage: 'Agenten vil motta en e-post med instruksjoner for å registrere seg.',
      errorTitle: 'Kunne ikke sende invitasjon',
      requiredFields: 'Vennligst fyll ut alle påkrevde felt',
      invalidEmail: 'Ugyldig e-postadresse',
      invalidPhone: 'Ugyldig telefonnummer',
    },
    sv: {
      title: 'Bjud in Ny Agent',
      subtitle: 'Skicka inbjudan till en ny agent för att sälja licenser',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      email: 'E-postadress',
      phone: 'Telefonnummer',
      company: 'Företag (valfritt)',
      message: 'Personligt meddelande (valfritt)',
      sendSmsLabel: 'Skicka även SMS-inbjudan',
      sendButton: 'Skicka Inbjudan',
      sending: 'Skickar...',
      back: 'Tillbaka',
      successTitle: 'Inbjudan Skickad!',
      successMessage: 'Agenten kommer att få ett e-postmeddelande med instruktioner för att registrera sig.',
      errorTitle: 'Kunde inte skicka inbjudan',
      requiredFields: 'Vänligen fyll i alla obligatoriska fält',
      invalidEmail: 'Ogiltig e-postadress',
      invalidPhone: 'Ogiltigt telefonnummer',
    },
  };

  const t = text[language];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError(t.requiredFields);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t.invalidEmail);
      return false;
    }

    if (sendSms && formData.phone) {
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
        setError(t.invalidPhone);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'agent',
          inviteData: {
            company: formData.company,
          },
          recipientData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          message: formData.message,
          sendSms: sendSms && !!formData.phone,
          sendEmail: true,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/admin');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || t.errorTitle);
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(t.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.successTitle}</h3>
              <p className="text-sm text-gray-600">{t.successMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/admin')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t.back}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.firstName} *
                </label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.lastName} *
                </label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.email} *
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
              <label className="block text-sm font-medium mb-1">
                {t.phone}
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+47 123 45 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.company}
              </label>
              <Input
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.message}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formData.phone && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendSms"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="sendSms" className="text-sm">
                  {t.sendSmsLabel}
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="mr-2">{t.sending}</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t.sendButton}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
