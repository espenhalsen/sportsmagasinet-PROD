'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Copy, 
  X, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Smartphone,
  RefreshCw
} from 'lucide-react';

export default function QRCodeSaleModal({ isOpen, onClose, clubInfo }) {
  const [step, setStep] = useState('starting'); // starting, showing_qr, completed, cancelled, error
  const [saleData, setSaleData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const canvasRef = useRef(null);
  const pollInterval = useRef(null);

  const cleanupSale = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    setStep('starting');
    setSaleData(null);
    setQrCodeUrl('');
    setTimeRemaining('');
    setError('');
  };

  useEffect(() => {
    if (isOpen) {
      startSale();
    } else {
      cleanupSale();
    }

    return () => cleanupSale();
  }, [isOpen]);

  useEffect(() => {
    if (saleData && step === 'showing_qr') {
      // Generate QR code
      generateQRCode();
      
      // Start polling for payment status
      startPolling();
      
      // Start countdown timer
      startTimer();
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [saleData, step]);

  if (!isOpen) return null;

  const startSale = async () => {
    setStep('starting');
    setError('');
    
    try {
      const response = await fetch('/api/sales/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start sale');
      }

      const data = await response.json();
      setSaleData(data);
      setStep('showing_qr');
      
    } catch (err) {
      console.error('Error starting sale:', err);
      setError(err.message);
      setStep('error');
    }
  };

  const generateQRCode = async () => {
    if (!saleData?.qrCodeUrl) return;
    
    try {
      // Simple QR code placeholder - replace with actual QR library
      const simpleQR = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white" stroke="#ccc"/><text x="100" y="100" text-anchor="middle" fill="black" font-size="10">QR Code</text></svg>`)}`;
      setQrCodeUrl(simpleQR);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    
    pollInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/sales/reservation/${saleData.reservationId}`);
        if (response.ok) {
          const reservationData = await response.json();
          
          if (reservationData.status === 'completed') {
            setStep('completed');
            clearInterval(pollInterval.current);
          } else if (reservationData.status === 'cancelled' || reservationData.status === 'expired') {
            setStep('cancelled');
            clearInterval(pollInterval.current);
          }
        }
      } catch (error) {
        console.error('Error polling reservation status:', error);
      }
    }, 3000);
  };

  const startTimer = () => {
    const updateTimer = () => {
      if (!saleData?.expiresAt) return;
      
      const now = new Date();
      const expires = new Date(saleData.expiresAt);
      const diff = expires - now;
      
      if (diff <= 0) {
        setTimeRemaining('Utløpt');
        setStep('cancelled');
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
        }
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  };

  const cancelSale = async () => {
    if (!saleData?.reservationId) return;
    
    try {
      const response = await fetch('/api/sales/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: saleData.reservationId
        }),
      });

      if (response.ok) {
        setStep('cancelled');
      }
    } catch (error) {
      console.error('Error cancelling sale:', error);
    }
  };

  const copyLink = async () => {
    if (!saleData?.qrCodeUrl) return;
    
    setCopying(true);
    try {
      await navigator.clipboard.writeText(saleData.qrCodeUrl);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopying(false);
    }
  };

  const handleClose = () => {
    if (step === 'showing_qr' && saleData?.reservationId) {
      cancelSale();
    }
    cleanupSale();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            {step === 'starting' && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            {step === 'showing_qr' && <Smartphone className="h-5 w-5 mr-2" />}
            {step === 'completed' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
            {step === 'cancelled' && <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />}
            {step === 'error' && <X className="h-5 w-5 text-red-600 mr-2" />}
            
            {step === 'starting' && 'Starter salg...'}
            {step === 'showing_qr' && 'Venter på kjøper'}
            {step === 'completed' && 'Salg fullført!'}
            {step === 'cancelled' && 'Salg avbrutt'}
            {step === 'error' && 'Feil oppstod'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Starting state */}
            {step === 'starting' && (
              <div className="text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Reserverer lisens og oppretter QR-kode...</p>
              </div>
            )}

            {/* QR Code display */}
            {step === 'showing_qr' && saleData && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Salgsinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pris:</span>
                      <span className="font-semibold">100 kr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Klubb:</span>
                      <span className="font-semibold">{saleData.clubName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tid igjen:</span>
                      <span className="font-mono font-semibold text-orange-600">
                        {timeRemaining}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-inner mx-auto w-fit">
                        {qrCodeUrl && (
                          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          La kjøperen skanne QR-koden med telefonen
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyLink}
                        disabled={copying}
                        className="w-full"
                      >
                        {copying ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Kopiert!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Kopier lenke
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Completed state */}
            {step === 'completed' && (
              <div className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Salg fullført!
                </h3>
                <p className="text-gray-600 mb-4">
                  Betalingen er mottatt og lisensen er aktivert.
                </p>
              </div>
            )}

            {/* Cancelled state */}
            {step === 'cancelled' && (
              <div className="text-center p-8">
                <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Salg avbrutt
                </h3>
                <p className="text-gray-600">
                  Salget ble avbrutt eller tid løp ut.
                </p>
              </div>
            )}

            {/* Error state */}
            {step === 'error' && (
              <div className="text-center p-8">
                <X className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Feil oppstod
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={startSale} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prøv igjen
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-4">
              {step === 'showing_qr' && (
                <Button
                  variant="outline"
                  onClick={cancelSale}
                  className="w-full"
                >
                  Avbryt salg
                </Button>
              )}
              
              {(step === 'completed' || step === 'cancelled' || step === 'error') && (
                <Button
                  onClick={handleClose}
                  className="w-full"
                >
                  Lukk
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
