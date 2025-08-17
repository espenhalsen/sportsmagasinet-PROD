'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Loader2, AlertCircle, Info, User, Mail, Phone, MapPin, Calendar, Heart, Trophy, Users, ChevronRight, ChevronLeft, Check, Shield, UserCheck } from 'lucide-react';

function SubscriberRegistrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const licenseId = searchParams.get('license');
  const clubId = searchParams.get('club');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [licenseData, setLicenseData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: {
      street_address: '',
      postal_code: '',
      region: '',
      country: 'NO'
    },
    birthDate: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!licenseId) {
      setError('Ingen lisens ID funnet');
      setLoading(false);
      return;
    }

    if (!clubId) {
      setError('Ingen klubb ID funnet');
      setLoading(false);
      return;
    }

    fetchLicenseData();
  }, [licenseId, clubId]);

  const fetchLicenseData = async () => {
    try {
      const response = await fetch(`/api/licenses/get-buyer-info?licenseId=${licenseId}&club=${clubId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke hente lisensdata');
      }

      const data = await response.json();
      setLicenseData(data);
      
      // Auto-fill form with buyer info if available
      if (data.buyerInfo && !data.buyerInfo.registrationPending) {
        setFormData({
          name: data.buyerInfo.name || '',
          email: data.buyerInfo.email || '',
          phoneNumber: data.buyerInfo.phoneNumber || '',
          address: {
            street_address: data.buyerInfo.address?.street_address || '',
            postal_code: data.buyerInfo.address?.postal_code || '',
            region: data.buyerInfo.address?.region || '',
            country: data.buyerInfo.address?.country || 'NO'
          },
          birthDate: data.buyerInfo.birthDate || '',
          password: '',
          confirmPassword: ''
        });
      }
      
    } catch (error) {
      console.error('Error fetching license data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens');
      return;
    }

    if (formData.password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register-subscriber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseId: licenseId,
          clubId: clubId,
          ...formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registrering feilet');
      }

      const data = await response.json();
      
      // Redirect to login or dashboard
      router.push('/login?message=registration_complete');
      
    } catch (error) {
      console.error('Error registering subscriber:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Henter lisensdata...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !licenseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Registreringsfeil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Gå til forsiden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasGovernmentInfo = licenseData?.buyerInfo && !licenseData.buyerInfo.registrationPending;
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Din informasjon";
      case 2: return "Opprett bruker";
      case 3: return "Klar for start";
      default: return "";
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <UserCheck className="h-8 w-8 text-blue-300" />;
      case 2: return <Shield className="h-8 w-8 text-green-300" />;
      case 3: return <Trophy className="h-8 w-8 text-yellow-300" />;
      default: return <User className="h-8 w-8 text-blue-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
            <div className="text-center">
              {getStepIcon()}
              <CardTitle className="text-3xl font-bold mb-2 mt-4">
                Velkommen til Sportsmagasinet! 🎉
              </CardTitle>
              <p className="text-blue-100 text-lg">
                Du støtter nå <strong className="text-yellow-300">{licenseData?.clubName}</strong>
              </p>
              <div className="flex items-center justify-center mt-3 text-blue-100">
                <Heart className="h-5 w-5 mr-2 text-red-300" />
                <span>Takk for at du støtter norsk idrett</span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                        step === currentStep 
                          ? 'bg-yellow-300 text-blue-900' 
                          : step < currentStep 
                            ? 'bg-green-300 text-blue-900' 
                            : 'bg-blue-300 text-blue-900'
                      }`}>
                        {step < currentStep ? <Check className="h-4 w-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-8 h-1 transition-colors duration-300 ${
                          step < currentStep ? 'bg-green-300' : 'bg-blue-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-blue-100 mt-2 font-medium">{getStepTitle()}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            <div className="min-h-[500px] transition-all duration-500 ease-in-out">
              {/* Step 1: Prefilled Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                  <div className="text-center py-4">
                    <UserCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Din informasjon</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                      Vi har hentet informasjonen din fra Vipps. Alt ser riktig ut!
                    </p>
                  </div>

                  {hasGovernmentInfo && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <Shield className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-green-900">✅ Verifisert via Vipps</h3>
                          <p className="text-sm text-green-800 mt-1">
                            All informasjon er hentet fra offentlige registre og er automatisk verifisert.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                        <p className="text-gray-900 font-medium">{formData.name || 'Ikke oppgitt'}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                        <p className="text-gray-900 font-medium">{formData.email || 'Ikke oppgitt'}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
                        <p className="text-gray-900 font-medium">{formData.phoneNumber || 'Ikke oppgitt'}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fødselsdato</label>
                        <p className="text-gray-900 font-medium">{formData.birthDate || 'Ikke oppgitt'}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <p className="text-gray-900 font-medium">
                          {formData.address.street_address && formData.address.postal_code && formData.address.region
                            ? `${formData.address.street_address}, ${formData.address.postal_code} ${formData.address.region}`
                            : 'Ikke oppgitt'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-3"
                    >
                      Ser bra ut! <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Name and Password Setup */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                  <div className="text-center py-4">
                    <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Opprett din bruker</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                      Velg et brukernavn og et sikkert passord som du husker.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <Info className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-900">🔐 Viktig å huske</h3>
                        <p className="text-sm text-blue-800 mt-1">
                          Du trenger disse opplysningene for å logge inn senere. Velg et passord du husker godt.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="inline h-4 w-4 mr-1" />
                          Ditt navn *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Skriv inn ditt fulle navn"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Shield className="inline h-4 w-4 mr-1" />
                          Passord *
                        </label>
                        <input
                          type="password"
                          required
                          minLength="6"
                          className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Minimum 6 tegn"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bekreft passord *
                        </label>
                        <input
                          type="password"
                          required
                          minLength="6"
                          className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Gjenta passordet"
                        />
                      </div>
                    </div>
                  </form>

                  <div className="flex justify-between">
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="px-6 py-3"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" /> Tilbake
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!formData.name || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-3"
                    >
                      Fortsett <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Ready to Start */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                  <div className="text-center py-6">
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Klar for å komme i gang!</h2>
                    <p className="text-gray-600 text-lg max-w-lg mx-auto">
                      Du er nå klar til å bli en del av Sportsmagasinet-familien og støtte 
                      <strong className="text-green-600"> {licenseData?.clubName}</strong>!
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center">
                        <Heart className="h-8 w-8 text-red-500 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-800">
                          Takk for at du støtter norsk idrett
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">Fellesskap</h4>
                          <p className="text-sm text-gray-600">Bli en del av vårt community</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">Støtte</h4>
                          <p className="text-sm text-gray-600">Bidra til {licenseData?.clubName}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">Innhold</h4>
                          <p className="text-sm text-gray-600">Eksklusivt innhold og fordeler</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm">
                        Ved å fullføre registreringen aksepterer du våre vilkår og blir automatisk abonnent.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="px-6 py-3"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" /> Tilbake
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-12 py-4 text-lg shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Oppretter din bruker...
                        </>
                      ) : (
                        <>
                          <Trophy className="h-5 w-5 mr-2" />
                          Bli med i fellesskapet!
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SubscriberRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Laster...</span>
          </CardContent>
        </Card>
      </div>
    }>
      <SubscriberRegistrationContent />
    </Suspense>
  );
}
