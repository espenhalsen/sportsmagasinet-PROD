'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Translations
  const translations = {
    nb: {
      title: 'Logg inn',
      subtitle: 'Velkommen tilbake til Sportsmagasinet',
      email: 'E-post',
      password: 'Passord',
      rememberMe: 'Husk meg',
      forgotPassword: 'Glemt passord?',
      login: 'Logg inn',
      loggingIn: 'Logger inn...',
      noAccount: 'Har du ikke konto?',
      contactAdmin: 'Kontakt din klubb eller selger',
      invalidCredentials: 'Ugyldig e-post eller passord',
      accountLocked: 'Kontoen din er låst. Kontakt support.',
      serverError: 'Noe gikk galt. Prøv igjen senere.',
      emailRequired: 'E-post er påkrevd',
      passwordRequired: 'Passord er påkrevd',
    },
    sv: {
      title: 'Logga in',
      subtitle: 'Välkommen tillbaka till Sportsmagasinet',
      email: 'E-post',
      password: 'Lösenord',
      rememberMe: 'Kom ihåg mig',
      forgotPassword: 'Glömt lösenord?',
      login: 'Logga in',
      loggingIn: 'Loggar in...',
      noAccount: 'Har du inget konto?',
      contactAdmin: 'Kontakta din klubb eller säljare',
      invalidCredentials: 'Ogiltig e-post eller lösenord',
      accountLocked: 'Ditt konto är låst. Kontakta support.',
      serverError: 'Något gick fel. Försök igen senare.',
      emailRequired: 'E-post krävs',
      passwordRequired: 'Lösenord krävs',
    }
  };

  const texts = translations[language] || translations.nb;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError(texts.emailRequired);
      return false;
    }
    if (!formData.password) {
      setError(texts.passwordRequired);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Step 2: Get ID token from Firebase Auth
      const idToken = await userCredential.user.getIdToken();
      
      // Step 3: Send ID token to our secure API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError(texts.invalidCredentials);
        } else if (response.status === 403) {
          setError(texts.accountLocked);
        } else {
          setError(data.error || texts.serverError);
        }
        return;
      }

      // Redirect based on user role (role is nested in user object)
      const userRole = data.user?.role || data.role;
      switch (userRole) {
        case 'platform_admin':
          router.push('/dashboard/admin');
          break;
        case 'agent':
          router.push('/dashboard/agent');
          break;
        case 'club_admin':
          router.push('/dashboard/club');
          break;
        case 'seller':
          router.push('/dashboard/seller');
          break;
        case 'subscriber':
          // Check if subscription is active
          if (data.subscriptionStatus === 'active') {
            router.push('/');
          } else {
            router.push('/subscribe/payment');
          }
          break;
        default:
          router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(texts.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Sportsmagasinet</h1>
          <p className="text-gray-600">{texts.subtitle}</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{texts.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  icon={Mail}
                  label={texts.email}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="din@epost.no"
                  required
                  autoComplete="email"
                />

                <Input
                  icon={Lock}
                  label={texts.password}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    {texts.rememberMe}
                  </label>
                </div>

                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {texts.forgotPassword}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {texts.loggingIn}
                  </>
                ) : (
                  <>
                    {texts.login}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {texts.noAccount}{' '}
                <span className="text-blue-600 font-medium">
                  {texts.contactAdmin}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="text-center text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">
            Vilkår
          </Link>
          <span className="mx-2">•</span>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">
            Personvern
          </Link>
          <span className="mx-2">•</span>
          <Link href="/contact" className="hover:text-gray-700 transition-colors">
            Kontakt
          </Link>
        </div>
      </div>
    </div>
  );
}
