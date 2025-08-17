'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, Plus, Users, Calendar, Award, 
  Edit, Trash2, Eye, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function CampaignsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Translations
  const translations = {
    nb: {
      title: 'Salgskampanjer',
      subtitle: 'Administrer lisenskvoter for selgere',
      createNew: 'Opprett ny kampanje',
      activeCampaigns: 'Aktive kampanjer',
      completedCampaigns: 'Fullførte kampanjer',
      noCampaigns: 'Ingen kampanjer opprettet enda',
      campaignName: 'Kampanjenavn',
      targetLicenses: 'Målsetting',
      soldLicenses: 'Solgt',
      participants: 'Deltakere',
      startDate: 'Startdato',
      endDate: 'Sluttdato',
      status: 'Status',
      active: 'Aktiv',
      completed: 'Fullført',
      actions: 'Handlinger',
      view: 'Vis',
      edit: 'Rediger',
      delete: 'Slett',
      backToDashboard: 'Tilbake til dashboard',
    },
    sv: {
      title: 'Försäljningskampanjer',
      subtitle: 'Administrera licenskvoter för säljare',
      createNew: 'Skapa ny kampanj',
      activeCampaigns: 'Aktiva kampanjer',
      completedCampaigns: 'Slutförda kampanjer',
      noCampaigns: 'Inga kampanjer skapade ännu',
      campaignName: 'Kampanjnamn',
      targetLicenses: 'Målsättning',
      soldLicenses: 'Sålt',
      participants: 'Deltagare',
      startDate: 'Startdatum',
      endDate: 'Slutdatum',
      status: 'Status',
      active: 'Aktiv',
      completed: 'Slutförd',
      actions: 'Åtgärder',
      view: 'Visa',
      edit: 'Redigera',
      delete: 'Ta bort',
      backToDashboard: 'Tillbaka till dashboard',
    }
  };

  const texts = translations[language] || translations.nb;

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/club/campaigns', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (sold, target) => {
    return target > 0 ? Math.min((sold / target) * 100, 100) : 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'nb' ? 'nb-NO' : 'sv-SE');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
              <p className="text-gray-600 mt-1">{texts.subtitle}</p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/club/campaigns/create')}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {texts.createNew}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {texts.noCampaigns}
              </h3>
              <Button
                onClick={() => router.push('/dashboard/club/campaigns/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                {texts.createNew}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Campaigns */}
            {campaigns.filter(c => c.status === 'active').length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {texts.activeCampaigns}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {campaigns.filter(c => c.status === 'active').map((campaign) => (
                    <Card key={campaign.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {texts.active}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>{texts.soldLicenses}: {campaign.soldLicenses}</span>
                              <span>{texts.targetLicenses}: {campaign.targetLicenses}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ 
                                  width: `${getProgressPercentage(campaign.soldLicenses, campaign.targetLicenses)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                              <div className="text-lg font-semibold">{campaign.participants}</div>
                              <div className="text-xs text-gray-600">{texts.participants}</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <Award className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                              <div className="text-lg font-semibold">
                                {Math.round(getProgressPercentage(campaign.soldLicenses, campaign.targetLicenses))}%
                              </div>
                              <div className="text-xs text-gray-600">Fullført</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/club/campaigns/${campaign.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {texts.view}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/club/campaigns/${campaign.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {texts.edit}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Campaigns */}
            {campaigns.filter(c => c.status === 'completed').length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {texts.completedCampaigns}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {campaigns.filter(c => c.status === 'completed').map((campaign) => (
                    <Card key={campaign.id} className="border-l-4 border-l-gray-400 opacity-75">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                            {texts.completed}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Final Results */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">{campaign.soldLicenses}</div>
                              <div className="text-xs text-gray-600">{texts.soldLicenses}</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{campaign.targetLicenses}</div>
                              <div className="text-xs text-gray-600">{texts.targetLicenses}</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{campaign.participants}</div>
                              <div className="text-xs text-gray-600">{texts.participants}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/club/campaigns/${campaign.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {texts.view}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
