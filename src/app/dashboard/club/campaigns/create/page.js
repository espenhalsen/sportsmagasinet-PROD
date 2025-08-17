'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, Save, ArrowLeft, Users, Calendar,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetLicenses: 10,
    startDate: '',
    endDate: '',
    selectedSellers: [],
  });

  // Translations
  const translations = {
    nb: {
      title: 'Opprett ny kampanje',
      subtitle: 'Sett opp lisenskvoter for selgere',
      campaignInfo: 'Kampanjeinformasjon',
      campaignName: 'Kampanjenavn',
      campaignNamePlaceholder: 'F.eks. "Vinter 2024 Salgsmål"',
      description: 'Beskrivelse',
      descriptionPlaceholder: 'Beskriv kampanjens mål og formål...',
      targetLicenses: 'Totalt salgsmål (lisenser)',
      targetHelp: 'Antall lisenser som skal selges i denne kampanjen',
      startDate: 'Startdato',
      endDate: 'Sluttdato',
      selectSellers: 'Velg selgere',
      selectSellersHelp: 'Velg hvilke selgere som skal delta i kampanjen',
      noSellers: 'Ingen selgere tilgjengelig',
      allSellers: 'Velg alle',
      none: 'Ingen valgt',
      createCampaign: 'Opprett kampanje',
      creating: 'Oppretter...',
      cancel: 'Avbryt',
      requiredField: 'Dette feltet er påkrevd',
      invalidDate: 'Sluttdato må være etter startdato',
      noSellersSelected: 'Velg minst én selger',
      successTitle: 'Kampanje opprettet!',
      successMessage: 'Kampanjen har blitt opprettet og selgerne vil få beskjed.',
      backToCampaigns: 'Tilbake til kampanjer',
      backToDashboard: 'Tilbake til dashboard',
    },
    sv: {
      title: 'Skapa ny kampanj',
      subtitle: 'Ställ in licenskvoter för säljare',
      campaignInfo: 'Kampanjinformation',
      campaignName: 'Kampanjnamn',
      campaignNamePlaceholder: 'T.ex. "Vinter 2024 Försäljningsmål"',
      description: 'Beskrivning',
      descriptionPlaceholder: 'Beskriv kampanjens mål och syfte...',
      targetLicenses: 'Totalt försäljningsmål (licenser)',
      targetHelp: 'Antal licenser som ska säljas i denna kampanj',
      startDate: 'Startdatum',
      endDate: 'Slutdatum',
      selectSellers: 'Välj säljare',
      selectSellersHelp: 'Välj vilka säljare som ska delta i kampanjen',
      noSellers: 'Inga säljare tillgängliga',
      allSellers: 'Välj alla',
      none: 'Ingen vald',
      createCampaign: 'Skapa kampanj',
      creating: 'Skapar...',
      cancel: 'Avbryt',
      requiredField: 'Detta fält är obligatoriskt',
      invalidDate: 'Slutdatum måste vara efter startdatum',
      noSellersSelected: 'Välj minst en säljare',
      successTitle: 'Kampanj skapad!',
      successMessage: 'Kampanjen har skapats och säljarna kommer att meddelas.',
      backToCampaigns: 'Tillbaka till kampanjer',
      backToDashboard: 'Tillbaka till dashboard',
    }
  };

  const texts = translations[language] || translations.nb;

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await fetch('/api/dashboard/club/sellers', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'selectedSellers') {
      const sellerId = value;
      setFormData(prev => ({
        ...prev,
        selectedSellers: checked 
          ? [...prev.selectedSellers, sellerId]
          : prev.selectedSellers.filter(id => id !== sellerId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSelectAll = () => {
    const allSelected = formData.selectedSellers.length === sellers.length;
    setFormData(prev => ({
      ...prev,
      selectedSellers: allSelected ? [] : sellers.map(s => s.uid)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(`${texts.requiredField}: ${texts.campaignName}`);
      return false;
    }

    if (!formData.startDate) {
      setError(`${texts.requiredField}: ${texts.startDate}`);
      return false;
    }

    if (!formData.endDate) {
      setError(`${texts.requiredField}: ${texts.endDate}`);
      return false;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError(texts.invalidDate);
      return false;
    }

    if (formData.selectedSellers.length === 0) {
      setError(texts.noSellersSelected);
      return false;
    }

    if (formData.targetLicenses < 1) {
      setError('Salgsmål må være minst 1');
      return false;
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
      const response = await fetch('/api/dashboard/club/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
                {texts.successMessage}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push('/dashboard/club/campaigns')}
                >
                  {texts.backToCampaigns}
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
            onClick={() => router.push('/dashboard/club/campaigns')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {texts.backToCampaigns}
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
          {/* Campaign Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                {texts.campaignInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.campaignName} *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={texts.campaignNamePlaceholder}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.description}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={texts.descriptionPlaceholder}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.targetLicenses} *
                    </label>
                    <Input
                      type="number"
                      name="targetLicenses"
                      value={formData.targetLicenses}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {texts.targetHelp}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.startDate} *
                    </label>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.endDate} *
                    </label>
                    <Input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Selection */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {texts.selectSellers}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={sellers.length === 0}
                >
                  {formData.selectedSellers.length === sellers.length ? texts.none : texts.allSellers}
                </Button>
              </div>
              <p className="text-sm text-gray-600">{texts.selectSellersHelp}</p>
            </CardHeader>
            <CardContent>
              {sellers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{texts.noSellers}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sellers.map((seller) => (
                    <label
                      key={seller.uid}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        name="selectedSellers"
                        value={seller.uid}
                        checked={formData.selectedSellers.includes(seller.uid)}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {seller.firstName} {seller.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{seller.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/club/campaigns')}
              disabled={loading}
            >
              {texts.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading || sellers.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {texts.creating}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {texts.createCampaign}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
