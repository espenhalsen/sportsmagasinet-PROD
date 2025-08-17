'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Loader2, ExternalLink, AlertCircle, Clock, CheckCircle } from 'lucide-react';

function BuyerInviteContent() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('r');
  
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!reservationId) {
      setError('Ugyldig invitasjonslink');
      setLoading(false);
      return;
    }

    fetchReservationData();
  }, [reservationId]);

  const handleVippsPayment = async () => {
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/vipps/create-agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Vipps agreement');
      }

      const data = await response.json();
      // Redirect to Vipps
      window.location.href = data.vippsLandingPage;
      
    } catch (error) {
      console.error('Error creating Vipps agreement:', error);
      setError('Kunne ikke opprette betaling. Prøv igjen.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchReservationData = async () => {
    try {
      const response = await fetch(`/api/sales/reservation/${reservationId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke hente reservasjonsdata');
      }

      setReservation(data);
      
      // Check if reservation has expired
      if (new Date() > new Date(data.expiresAt)) {
        setError('Denne invitasjonen har utløpt');
      }
      
    } catch (err) {
      console.error('Error fetching reservation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToVipps = async () => {
    if (!reservation?.vippsLandingPage) return;
    
    setRedirecting(true);
    
    // Add a small delay for better UX
    setTimeout(() => {
      window.location.href = reservation.vippsLandingPage;
    }, 1000);
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Utløpt';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Laster invitasjon...</span>
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
              Feil
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

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700">Invitasjon ikke funnet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sportsmagasinet
          </h1>
          <p className="text-gray-600">
            Du er invitert til å kjøpe en lisens
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">
              {reservation.clubName}
            </CardTitle>
            <p className="text-blue-100 text-sm">
              Invitert av: {reservation.sellerName}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                100 kr
              </div>
              <p className="text-gray-600 text-sm">
                Årlig lisens
              </p>
            </div>

            {/* Time remaining */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800 font-medium">
                    Tid igjen:
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-yellow-800">
                  {formatTimeRemaining(reservation.expiresAt)}
                </span>
              </div>
            </div>

            {/* What's included */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Dette får du:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Tilgang til {reservation.clubName}
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Årlig medlemskap (365 dager)
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Alle klubbfordeler inkludert
                  </span>
                </div>
              </div>
            </div>

            {/* Payment button */}
            <Button
              onClick={handleVippsPayment}
              disabled={paymentLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
            >
              {paymentLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Oppretter betaling...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.99 6.58c-1.53-.9-3.52-1.4-5.61-1.4-2.09 0-4.08.5-5.61 1.4L2.24 12l8.53 5.42c1.53.9 3.52 1.4 5.61 1.4 2.09 0 4.08-.5 5.61-1.4L24 12l-2.01-5.42z"/>
                  </svg>
                  Betal med Vipps - {reservation.price} kr
                </span>
              )}
            </Button>

            {/* Security info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Sikker betaling via Vipps. Du vil bli omdirigert til Vipps-appen.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Spørsmål? Kontakt selgeren som inviterte deg.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BuyerInvitePage() {
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
      <BuyerInviteContent />
    </Suspense>
  );
}
