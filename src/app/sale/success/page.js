'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Loader2, AlertCircle, User, Mail, Phone, ArrowRight } from 'lucide-react';

export default function SaleSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saleId = searchParams.get('saleId');
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('verifying'); // verifying, registration, completed, error
  const [saleData, setSaleData] = useState(null);
  const [error, setError] = useState(null);
  const [registrationForm, setRegistrationForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    address: '',
    postalCode: ''
  });

  useEffect(() => {
    if (saleId) {
      verifySale();
    } else {
      setError('Ingen salg-ID funnet i URL');
      setStep('error');
      setLoading(false);
    }
  }, [saleId]);

  const verifySale = async () => {
    try {
      const response = await fetch(`/api/sales/verify/${saleId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke verifisere salget');
      }

      setSaleData(data);
      
      // Check if user already exists (has registered before)
      if (data.userExists) {
        setStep('completed');
      } else {
        setStep('registration');
      }
      
    } catch (err) {
      console.error('Error verifying sale:', err);
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/sales/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId,
          ...registrationForm
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registrering feilet');
      }

      setStep('completed');
      
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifiserer betaling
            </h2>
            <p className="text-gray-600 text-center">
              Vennligst vent mens vi bekrefter din betaling...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Feil oppstod
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Gå til forsiden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Betaling vellykket!
          </h1>
          <p className="text-gray-600">
            Din lisens er kjøpt og aktivert
          </p>
        </div>

        {/* Registration Step */}
        {step === 'registration' && saleData && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="text-center">
                Fullfør registreringen
              </CardTitle>
              <p className="text-blue-100 text-sm text-center">
                For å få tilgang til {saleData.clubName}
              </p>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Purchase summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-800">Kjøpt:</span>
                  <span className="text-green-800">{saleData.clubName} Lisens</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700">Pris:</span>
                  <span className="text-sm text-green-700">100 kr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Gyldig til:</span>
                  <span className="text-sm text-green-700">
                    {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('nb-NO')}
                  </span>
                </div>
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline h-4 w-4 mr-1" />
                      Fornavn *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={registrationForm.firstName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Etternavn *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={registrationForm.lastName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={registrationForm.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+47 123 45 678"
                  />
                </div>

                {/* Address fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={registrationForm.address}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Gate/vei og nummer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postnummer
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={registrationForm.postalCode}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      By
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={registrationForm.city}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Oslo"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !registrationForm.firstName || !registrationForm.lastName}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Registrerer...
                      </>
                    ) : (
                      <>
                        Fullfør registrering
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  * Obligatoriske felter. Ved å registrere deg godtar du våre vilkår for bruk.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Completed Step */}
        {step === 'completed' && saleData && (
          <Card className="shadow-lg">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Velkommen til {saleData.clubName}!
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Din lisens er aktiv
                </h3>
                <p className="text-sm text-blue-800">
                  Du har nå tilgang til alle klubbens tjenester og fordeler.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/dashboard/subscriber')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Gå til ditt dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Gå til forsiden
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                Du vil motta en bekreftelses-e-post med detaljer om ditt medlemskap.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
