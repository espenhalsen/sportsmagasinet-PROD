'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('r');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [clubName, setClubName] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [clubId, setClubId] = useState('');

  useEffect(() => {
    if (!reservationId) {
      setError('Ugyldig betalingslink');
      setLoading(false);
      return;
    }

    completePayment();
  }, [reservationId]);

  const completePayment = async () => {
    try {
      const response = await fetch('/api/sales/complete-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke fullføre betaling');
      }

      const data = await response.json();
      setClubName(data.clubName);
      setLicenseId(data.licenseId);
      setClubId(data.clubId);
      setSuccess(true);
      
    } catch (error) {
      console.error('Error completing payment:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Fullører betaling...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Betalingsfeil
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-6 w-6 mr-2" />
              Betaling vellykket!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-2">
                Takk for kjøpet! Din lisens for <strong>{clubName}</strong> er nå aktiv.
              </p>
              <p className="text-sm text-gray-500">
                Du vil motta en e-post med instruksjoner for å fullføre registreringen.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = `/register/subscriber?license=${licenseId}&club=${clubId}`}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Fullfør registrering
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Gå til forsiden
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Har du spørsmål? Kontakt kundeservice på support@sportsmagasinet.no
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
