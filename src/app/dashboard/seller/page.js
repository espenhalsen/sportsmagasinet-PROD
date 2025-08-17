'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, DollarSign, TrendingUp, Award, Send, Target, Package,
  Calendar, ChevronRight, Eye, UserPlus, Activity, Trophy, Plus, ShoppingCart,
  BarChart3, QrCode
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRCodeSaleModal from '@/components/seller/QRCodeSaleModal';
import { formatCurrency } from '@/utils/packages';

export default function SellerDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [clubInfo, setClubInfo] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    monthSales: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    conversionRate: 0,
    activeLicenses: 0,
    packageInfo: null
  });
  const [sales, setSales] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Translations
  const translations = {
    nb: {
      title: 'Selger Dashboard',
      welcome: 'Velkommen tilbake',
      overview: 'Oversikt',
      mySales: 'Mine salg',
      campaigns: 'Kampanjer',
      sellLicense: 'Selg lisens',
      performance: 'Ytelse',
      totalSales: 'Totalt antall salg',
      monthSales: 'Salg denne måneden',
      totalRevenue: 'Total fortjeneste',
      monthRevenue: 'Fortjeneste denne måneden',
      activeLicenses: 'Aktive lisenser',
      availableLicenses: 'Tilgjengelige lisenser',
      licensesRemaining: 'Lisenser igjen å selge',
      clubInfo: 'Klubbinformasjon',
      clubName: 'Klubbnavn',
      totalLicenses: 'Totalt lisenser',
      soldLicenses: 'Solgte lisenser',
      licenseUsage: 'Lisensbruk',
      customerEmail: 'Kunde e-post',
      customerName: 'Kundens navn',
      salePrice: 'Salgspris',
      saleDate: 'Salgsdato',
      profit: 'Fortjeneste',
      actions: 'Handlinger',
      view: 'Vis',
      noSales: 'Ingen salg ennå',
      recordFirst: 'Registrer ditt første salg for å komme i gang',
      thisMonth: 'Denne måneden',
      lastMonth: 'Forrige måned',
      thisYear: 'Dette året',
      customerEmailLabel: 'Kunde e-postadresse',
      customerNameLabel: 'Kundens navn (valgfri)',
      salePriceLabel: 'Salgspris (NOK)',
      notesLabel: 'Notater (valgfri)',
      recordSale: 'Registrer salg',
      cancel: 'Avbryt',
      recording: 'Registrerer...',
      saleRecorded: 'Salg registrert!',
      packageInfo: 'Pakkeinformasjon',
      retailPrice: 'Anbefalt pris',
      profitPerSale: 'Fortjeneste per salg',
      clubDebtPerLicense: 'Klubbens gjeld per lisens',
      tips: 'Tips for suksess',
      tip1: 'Bruk anbefalt pris for best fortjeneste',
      tip2: 'Følg opp potensielle kunder regelmessig',
      tip3: 'Del fordeler med Sportsmagasinet',
      campaignTarget: 'Kampanjemål',
      campaignProgress: 'Fremgang',
      daysLeft: 'dager igjen',
      noCampaigns: 'Ingen aktive kampanjer',
      campaignCompleted: 'Kampanje fullført',
      targetReached: 'Mål nådd!',
      campaignName: 'Kampanjenavn',
      targetLicenses: 'Målsetting',
      soldLicenses: 'Solgt',
      endDate: 'Sluttdato',
      status: 'Status',
    },
    sv: {
      title: 'Säljare Dashboard',
      welcome: 'Välkommen tillbaka',
      overview: 'Översikt',
      mySubscribers: 'Mina prenumeranter',
      performance: 'Prestanda',
      totalSales: 'Total försäljning',
      monthSales: 'Försäljning denna månad',
      totalCommission: 'Total provision',
      monthCommission: 'Provision denna månad',
      conversionRate: 'Konverteringsgrad',
      activeSubscribers: 'Aktiva prenumeranter',
      pendingInvites: 'Väntande inbjudningar',
      ranking: 'Din ranking',
      inviteSubscriber: 'Bjud in prenumerant',
      viewAll: 'Se alla',
      subscriberName: 'Prenumerant',
      status: 'Status',
      joinedDate: 'Registrerad',
      expiryDate: 'Utgår',
      active: 'Aktiv',
      pending: 'Väntar',
      expired: 'Utgången',
      actions: 'Åtgärder',
      view: 'Visa',
      renew: 'Förnya',
      noSubscribers: 'Inga prenumeranter ännu',
      inviteFirst: 'Bjud in din första prenumerant för att komma igång',
      thisMonth: 'Denna månad',
      lastMonth: 'Förra månaden',
      thisYear: 'Detta år',
      recentActivity: 'Senaste aktivitet',
      newSubscriber: 'Ny prenumerant',
      renewedSubscription: 'Förnyad prenumeration',
      inviteSent: 'Inbjudan skickad',
      targetReached: 'Mål uppnått',
      topPerformer: 'Du är bland topp 10 säljare!',
      salesTarget: 'Försäljningsmål',
      targetProgress: 'av målet uppnått',
      daysLeft: 'dagar kvar',
      tips: 'Tips för framgång',
      tip1: 'Följ upp väntande inbjudningar',
      tip2: 'Kontakta medlemmar som snart utgår',
      tip3: 'Dela fördelar med Sportsmagasinet',
      campaigns: 'Kampanjer',
      campaignTarget: 'Kampanjmål',
      campaignProgress: 'Framsteg',
      daysLeft: 'dagar kvar',
      noCampaigns: 'Inga aktiva kampanjer',
      campaignCompleted: 'Kampanj slutförd',
      targetReached: 'Mål nått!',
      campaignName: 'Kampanjnamn',
      targetLicenses: 'Målsättning',
      soldLicenses: 'Sålt',
      endDate: 'Slutdatum',
      status: 'Status',
    }
  };

  const texts = translations[language] || translations.nb;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await fetch('/api/users/me');
      if (!userResponse.ok) {
        router.push('/login');
        return;
      }
      const user = await userResponse.json();
      setUserData(user);

      // Check if user is seller
      if (user.role !== 'seller') {
        router.push('/');
        return;
      }

      // Fetch sales data
      const salesResponse = await fetch('/api/dashboard/seller/sales');
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setSales(salesData.sales || []);
        setStats(prev => ({
          ...prev,
          totalSales: salesData.stats?.total.sales || 0,
          totalRevenue: salesData.stats?.total.profit || 0,
          monthSales: salesData.stats?.currentMonth.sales || 0,
          monthRevenue: salesData.stats?.currentMonth.profit || 0
        }));
      }

      // Fetch club info and available licenses
      const clubResponse = await fetch('/api/dashboard/seller/club-info');
      if (clubResponse.ok) {
        const clubData = await clubResponse.json();
        setClubInfo(clubData);
        setStats(prev => ({
          ...prev,
          packageInfo: clubData.package,
          activeLicenses: clubData.licenses?.sold || 0
        }));
      }

      // Fetch campaign assignments
      const campaignsResponse = await fetch('/api/dashboard/seller/campaigns');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      language === 'sv' ? 'sv-SE' : 'nb-NO',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  // Removed old form handling code - now using QR code modal

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {texts.welcome}, {userData?.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">{texts.title}</p>
            </div>
            <Button onClick={() => setShowQRCodeModal(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              {texts.sellLicense}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.overview}
            </button>
            <button
              onClick={() => setSelectedTab('campaigns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.campaigns}
            </button>
            <button
              onClick={() => setSelectedTab('sales')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.mySales}
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Club & License Info Card */}
            {clubInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Club Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{texts.clubInfo}</CardTitle>
                    <CardDescription>{clubInfo.club.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pakke:</span>
                        <span className="font-medium">{clubInfo.package?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          clubInfo.club.packageStatus === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {clubInfo.club.packageStatus === 'active' ? 'Aktiv' : 'Venter'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* License Availability */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle>Tilgjengelige lisenser</CardTitle>
                    <CardDescription>
                      {clubInfo.licenses.available} av {clubInfo.licenses.total} lisenser igjen å selge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Solgt</span>
                          <span>{clubInfo.licenses.sold} / {clubInfo.licenses.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              clubInfo.licenses.percentage >= 90 
                                ? 'bg-red-500' 
                                : clubInfo.licenses.percentage >= 75 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${clubInfo.licenses.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-sm font-semibold">
                            {clubInfo.licenses.percentage}% brukt
                          </span>
                        </div>
                      </div>

                      {/* Available Licenses Alert */}
                      {clubInfo.licenses.available <= 10 && clubInfo.licenses.available > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm text-yellow-800">
                              Bare {clubInfo.licenses.available} lisenser igjen!
                            </span>
                          </div>
                        </div>
                      )}

                      {clubInfo.licenses.available === 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm text-red-800">
                              Alle lisenser er solgt! Kontakt klubbadmin for flere.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Package Info Card */}
            {stats.packageInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{texts.packageInfo}</CardTitle>
                  <CardDescription>{stats.packageInfo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">{texts.retailPrice}</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(stats.packageInfo.retailPrice)}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">{texts.profitPerSale}</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(stats.packageInfo.profitPerLicense)}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-600">{texts.clubDebtPerLicense}</span>
                      </div>
                      <p className="text-lg font-bold text-red-700">
                        {formatCurrency(stats.packageInfo.debtPerLicense)}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Tilgjengelig</span>
                      </div>
                      <p className="text-lg font-bold text-purple-700">
                        {clubInfo?.licenses.available || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.monthSales}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.monthSales}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Total: {stats.totalSales}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.monthRevenue)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.monthRevenue}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Total: {formatCurrency(stats.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeLicenses}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.activeLicenses}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalSales > 0 ? formatCurrency(stats.totalRevenue / stats.totalSales) : formatCurrency(0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Snitt fortjeneste</p>
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>{texts.tips}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Target className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.tip1}</span>
                  </li>
                  <li className="flex items-start">
                    <Activity className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.tip2}</span>
                  </li>
                  <li className="flex items-start">
                    <Trophy className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.tip3}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Campaigns Tab */}
        {selectedTab === 'campaigns' && (
          <div className="space-y-6">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {campaign.progress >= 100 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            {texts.targetReached}
                          </span>
                        ) : campaign.daysRemaining <= 0 ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                            {texts.campaignCompleted}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {campaign.daysRemaining} {texts.daysLeft}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{texts.campaignProgress}</span>
                          <span>{campaign.soldLicenses} / {campaign.targetLicenses} lisenser</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              campaign.progress >= 100 
                                ? 'bg-green-500' 
                                : campaign.progress >= 75 
                                  ? 'bg-blue-500' 
                                  : campaign.progress >= 50 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-lg font-semibold">
                            {Math.round(campaign.progress)}%
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-700">
                            {campaign.targetLicenses}
                          </div>
                          <div className="text-xs text-blue-600">{texts.campaignTarget}</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-700">
                            {campaign.soldLicenses}
                          </div>
                          <div className="text-xs text-green-600">{texts.soldLicenses}</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-xl font-bold text-orange-700">
                            {Math.max(0, campaign.targetLicenses - campaign.soldLicenses)}
                          </div>
                          <div className="text-xs text-orange-600">Gjenstående</div>
                        </div>
                      </div>

                      {/* Campaign Period */}
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
                        <span>
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </span>
                        {campaign.progress >= 100 && (
                          <span className="flex items-center text-green-600">
                            <Trophy className="h-4 w-4 mr-1" />
                            {texts.targetReached}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {texts.noCampaigns}
                  </h3>
                  <p className="text-gray-600">
                    Du er ikke tildelt noen aktive salgskampanjer for øyeblikket.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {selectedTab === 'sales' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{texts.mySales}</CardTitle>
                <CardDescription>
                  {sales.length} {texts.totalSales.toLowerCase()}
                </CardDescription>
              </div>
              <Button onClick={() => setShowQRCodeModal(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                {texts.sellLicense}
              </Button>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.customerEmail}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.customerName}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.salePrice}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.profit}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.saleDate}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">
                          {texts.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {sale.customerEmail}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700">
                              {sale.customerName || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(sale.salePrice)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-green-600">
                              +{formatCurrency(sale.profit)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">{texts.noSales}</p>
                  <Button onClick={() => setShowQRCodeModal(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    {texts.recordFirst}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        
        {/* QR Code Sale Modal */}
        <QRCodeSaleModal 
          isOpen={showQRCodeModal}
          onClose={() => setShowQRCodeModal(false)}
          clubInfo={clubInfo}
        />  
      </div>
    </div>
  );
}
