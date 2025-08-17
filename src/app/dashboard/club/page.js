'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Package, DollarSign, TrendingUp, Plus, Send, 
  UserPlus, Calendar, ChevronRight, Eye, Edit, Download,
  CreditCard, Award, Activity, AlertCircle, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getLicensePackageById, formatPackagePrice } from '@/utils/packages';

export default function ClubDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeLicenses: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    totalSellers: 0,
    pendingInvites: 0,
  });
  const [financeData, setFinanceData] = useState({
    summary: {
      currentBalance: 0,
      totalDebt: 0,
      totalIncome: 0,
      currentMonthDebt: 0,
      currentMonthIncome: 0,
      totalLicensesSold: 0,
      licensesRemaining: 0,
      packageInfo: null,
    },
    transactions: [],
  });
  const [members, setMembers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Translations
  const translations = {
    nb: {
      title: 'Klubbadministrasjon',
      welcome: 'Velkommen tilbake',
      overview: 'Oversikt',
      members: 'Medlemmer',
      sellers: 'Selgere',
      licenses: 'Lisenser',
      revenue: 'Inntekter',
      totalMembers: 'Totalt medlemmer',
      activeLicenses: 'Aktive lisenser',
      totalRevenue: 'Total inntekt',
      monthlyGrowth: 'Månedlig vekst',
      totalSellers: 'Aktive selgere',
      pendingInvites: 'Ventende invitasjoner',
      inviteSeller: 'Inviter selger',
      inviteMember: 'Inviter medlem',
      buyLicenses: 'Kjøp lisenser',
      viewAll: 'Se alle',
      memberName: 'Medlemsnavn',
      email: 'E-post',
      phone: 'Telefon',
      status: 'Status',
      joinedDate: 'Registrert',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      pending: 'Venter',
      actions: 'Handlinger',
      view: 'Vis',
      edit: 'Rediger',
      remove: 'Fjern',
      sellerName: 'Selgernavn',
      totalSales: 'Totalt salg',
      commission: 'Provisjon',
      performance: 'Ytelse',
      noMembers: 'Ingen medlemmer registrert ennå',
      noSellers: 'Ingen selgere registrert ennå',
      inviteFirstMember: 'Inviter ditt første medlem',
      inviteFirstSeller: 'Inviter din første selger',
      downloadReport: 'Last ned rapport',
      manageCampaigns: 'Administrer kampanjer',
      campaignDescription: 'Opprett og følg opp salgskampanjer',
      licensePackages: 'Lisens-pakker',
      availableLicenses: 'Tilgjengelige lisenser',
      usedLicenses: 'Brukte lisenser',
      expiringLicenses: 'Utløpende lisenser',
      renewLicenses: 'Forny lisenser',
      activatePackage: 'Aktiver pakke',
      packagePendingActivation: 'Pakke venter på aktivering',
      packageActivated: 'Pakke aktivert!',
      // Financial translations
      finances: 'Økonomi',
      currentBalance: 'Nåværende saldo',
      totalDebt: 'Total gjeld',
      totalIncome: 'Total inntekt',
      monthlyDebt: 'Månedlig gjeld',
      monthlyIncome: 'Månedlig inntekt',
      licensesSold: 'Lisenser solgt',
      licensesRemaining: 'Lisenser igjen',
      profitPerLicense: 'Fortjeneste per lisens',
      debtPerLicense: 'Gjeld per lisens',
      transactions: 'Transaksjoner',
      viewFinances: 'Se økonomi',
      // Package status translations
      packageStatus: 'Pakkestatus',
      assignedPackage: 'Tildelt pakke',
      pendingPayment: 'Venter på betaling',
      paymentFailed: 'Betalingsfeil',
      packageActive: 'Pakke aktiv',
      payNow: 'Betal nå',
      payPackage: 'Betal for pakke',
      packageDetails: 'Pakkedetaljer',
      monthlyPrice: 'Månedlig pris',
      totalLicensesIncluded: 'Totalt antall lisenser',
      selectedByAgent: 'Valgt av agent',
      agentCommission: 'Agent provisjon',
      perMonth: 'per måned',
      activatePackage: 'Aktiver pakke',
    },
    sv: {
      title: 'Klubbadministration',
      welcome: 'Välkommen tillbaka',
      overview: 'Översikt',
      members: 'Medlemmar',
      sellers: 'Säljare',
      licenses: 'Licenser',
      revenue: 'Intäkter',
      totalMembers: 'Totalt medlemmar',
      activeLicenses: 'Aktiva licenser',
      totalRevenue: 'Total intäkt',
      monthlyGrowth: 'Månatlig tillväxt',
      totalSellers: 'Aktiva säljare',
      pendingInvites: 'Väntande inbjudningar',
      inviteSeller: 'Bjud in säljare',
      inviteMember: 'Bjud in medlem',
      buyLicenses: 'Köp licenser',
      viewAll: 'Se alla',
      memberName: 'Medlemsnamn',
      email: 'E-post',
      phone: 'Telefon',
      status: 'Status',
      joinedDate: 'Registrerad',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      pending: 'Väntar',
      actions: 'Åtgärder',
      view: 'Visa',
      edit: 'Redigera',
      remove: 'Ta bort',
      sellerName: 'Säljarnamn',
      totalSales: 'Totalt försäljning',
      commission: 'Provision',
      performance: 'Prestanda',
      noMembers: 'Inga medlemmar registrerade ännu',
      noSellers: 'Inga säljare registrerade ännu',
      inviteFirstMember: 'Bjud in din första medlem',
      inviteFirstSeller: 'Bjud in din första säljare',
      downloadReport: 'Ladda ner rapport',
      manageCampaigns: 'Administrera kampanjer',
      campaignDescription: 'Skapa och följa upp försäljningskampanjer',
      licensePackages: 'Licenspaket',
      availableLicenses: 'Tillgängliga licenser',
      usedLicenses: 'Använda licenser',
      expiringLicenses: 'Utgående licenser',
      renewLicenses: 'Förnya licenser',
      // Financial translations
      finances: 'Ekonomi',
      currentBalance: 'Nuvarande saldo',
      totalDebt: 'Total skuld',
      totalIncome: 'Total inkomst',
      monthlyDebt: 'Månatlig skuld',
      monthlyIncome: 'Månatlig inkomst',
      licensesSold: 'Licenser sålda',
      licensesRemaining: 'Licenser kvar',
      profitPerLicense: 'Vinst per licens',
      debtPerLicense: 'Skuld per licens',
      transactions: 'Transaktioner',
      viewFinances: 'Se ekonomi',
      // Package status translations
      packageStatus: 'Paketstatus',
      assignedPackage: 'Tilldelat paket',
      pendingPayment: 'Väntar på betalning',
      paymentFailed: 'Betalningsfel',
      packageActive: 'Paket aktivt',
      payNow: 'Betala nu',
      payPackage: 'Betala för paket',
      packageDetails: 'Paketdetaljer',
      monthlyPrice: 'Månatligt pris',
      totalLicensesIncluded: 'Totalt antal licenser',
      selectedByAgent: 'Valt av agent',
      agentCommission: 'Agent provision',
      perMonth: 'per månad',
      activatePackage: 'Aktivera paket',
    }
  };

  const texts = translations[language] || translations.nb;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchUserData = async () => {
    const userResponse = await fetch('/api/users/me', {
      credentials: 'include',
    });
    if (!userResponse.ok) {
      router.push('/login');
      return null;
    }
    const user = await userResponse.json();
    setUserData(user);
    return user;
  };

  const fetchClubData = async () => {
    const clubResponse = await fetch('/api/dashboard/club/info', {
      credentials: 'include',
    });
    if (clubResponse.ok) {
      const club = await clubResponse.json();
      setClubData(club);
      
      // Get package details if club has a package assigned
      if (club.packageId) {
        const packageInfo = getLicensePackageById(club.packageId);
        setPackageData(packageInfo);
      }
      return club;
    } else {
      console.error('Failed to fetch club data:', await clubResponse.text());
    }
  };

  const fetchStats = async () => {
    const statsResponse = await fetch('/api/dashboard/club/stats', {
      credentials: 'include',
    });
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      setStats(statsData);
    } else {
      console.error('Failed to fetch stats:', await statsResponse.text());
    }
  };

  const fetchFinanceData = async () => {
    const financeResponse = await fetch('/api/dashboard/club/finances', {
      credentials: 'include',
    });
    if (financeResponse.ok) {
      const financeData = await financeResponse.json();
      console.log('Finance API response:', financeData);
      // Merge summary and transactions data
      const mergedData = {
        ...(financeData.summary || financeData),
        transactions: financeData.transactions || []
      };
      setFinanceData(mergedData);
    } else {
      console.error('Failed to fetch finance data:', await financeResponse.text());
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data first
      const user = await fetchUserData();
      if (!user) return;

      // Check if user is club admin
      if (user.role !== 'club_admin') {
        router.push('/');
        return;
      }

      // Fetch all other data in parallel
      await Promise.all([
        fetchClubData(),
        fetchStats(),
        fetchFinanceData(),
      ]);

      // Fetch members
      const membersResponse = await fetch('/api/dashboard/club/members', {
        credentials: 'include',
      });
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      } else {
        console.error('Failed to fetch members:', await membersResponse.text());
      }

      // Fetch sellers
      const sellersResponse = await fetch('/api/dashboard/club/sellers', {
        credentials: 'include',
      });
      if (sellersResponse.ok) {
        const sellersData = await sellersResponse.json();
        setSellers(sellersData.sellers || []);
      } else {
        console.error('Failed to fetch sellers:', await sellersResponse.text());
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'sv' ? 'sv-SE' : 'nb-NO', {
      style: 'currency',
      currency: language === 'sv' ? 'SEK' : 'NOK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      language === 'sv' ? 'sv-SE' : 'nb-NO',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const handleInviteSeller = () => {
    router.push('/dashboard/club/invite-seller');
  };

  const handleInviteMember = () => {
    router.push('/dashboard/club/invite-member');
  };

  const handleBuyLicenses = () => {
    router.push('/dashboard/club/buy-licenses');
  };

  const handleManageCampaigns = () => {
    router.push('/dashboard/club/campaigns');
  };

  const handleActivatePackage = async () => {
    if (!packageData || !clubData) return;
    
    try {
      setPaymentLoading(true);
      
      // Activate package instantly with debt
      const response = await fetch('/api/dashboard/club/activate-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate package');
      }
      
      const result = await response.json();
      
      // Refresh data
      await Promise.all([
        fetchUserData(),
        fetchClubData(),
        fetchStats(),
        fetchFinanceData(),
      ]);
      
      alert('Pakke aktivert! Du kan nå invitere selgere og tildele lisenser.');
      
    } catch (error) {
      console.error('Error activating package:', error);
      alert(`Feil ved aktivering av pakke: ${error.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPackage = async () => {
    if (!packageData || !clubData) return;
    
    try {
      setPaymentLoading(true);
      
      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageData.id,
          clubId: clubData.id,
          returnUrl: window.location.origin + '/dashboard/club?payment=success',
          cancelUrl: window.location.origin + '/dashboard/club?payment=cancelled',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Det oppstod en feil under opprettelse av betalingssesjon');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPackageStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPackageStatusText = (status) => {
    switch (status) {
      case 'pending_payment':
        return texts.pendingPayment;
      case 'payment_failed':
        return texts.paymentFailed;
      case 'active':
        return texts.packageActive;
      default:
        return status;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            {texts.welcome}, {userData?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {texts.title} - {clubData?.name}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
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
              onClick={() => setSelectedTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.members}
            </button>
            <button
              onClick={() => setSelectedTab('sellers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'sellers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.sellers}
            </button>
            <button
              onClick={() => setSelectedTab('licenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'licenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.licenses}
            </button>
            <button
              onClick={() => setSelectedTab('finances')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'finances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.finances}
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Package Activation Banner */}
            {packageData && clubData?.packageStatus === 'pending_payment' && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg mb-8 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Aktiver din {packageData.name} pakke</h2>
                      <p className="text-orange-100 mb-2">
                        {packageData.licenses} lisenser • {formatCurrency(packageData.monthlyDebt)} månedlig gjeld
                      </p>
                      <p className="text-sm text-orange-100">
                        Klikk "Aktiver pakke" for å starte umiddelbart med lisenser og selgere
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Button
                      size="lg"
                      onClick={handleActivatePackage}
                      disabled={paymentLoading}
                      className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600 mr-2"></div>
                          Aktiverer...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {texts.activatePackage}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-orange-100 text-right">
                      Ingen betaling nødvendig<br />
                      Start med gjeld som betales av salg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Club Balance Card - Prominent */}
            {clubData?.packageStatus === 'active' && financeData && (
              <div className="mb-8">
                <Card className={`${financeData.currentBalance >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-pink-600'} text-white`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Klubb saldo</h2>
                        <div className="text-4xl font-bold mb-2">
                          {formatCurrency(financeData.currentBalance)}
                        </div>
                        <div className="flex space-x-6 text-sm opacity-90">
                          <div>
                            <span className="block">Total inntekt</span>
                            <span className="font-semibold">{formatCurrency(financeData.totalIncome)}</span>
                          </div>
                          <div>
                            <span className="block">Total gjeld</span>
                            <span className="font-semibold">{formatCurrency(financeData.totalDebt)}</span>
                          </div>
                          <div>
                            <span className="block">Lisenser solgt</span>
                            <span className="font-semibold">{financeData.totalLicensesSold}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                          {financeData.currentBalance >= 0 ? (
                            <TrendingUp className="h-10 w-10" />
                          ) : (
                            <AlertTriangle className="h-10 w-10" />
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
                        >
                          {financeData.currentBalance >= 0 ? 'Se rapport' : 'Betalingsplan'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Package Status Card */}
            {packageData && (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPackageStatusIcon(clubData?.packageStatus)}
                      <div>
                        <CardTitle className="text-lg">{texts.assignedPackage}</CardTitle>
                        <CardDescription>{getPackageStatusText(clubData?.packageStatus)}</CardDescription>
                      </div>
                    </div>
                    {clubData?.packageStatus === 'pending_payment' && (
                      <Button 
                        onClick={handlePayPackage}
                        disabled={paymentLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {paymentLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        {texts.payNow}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{texts.packageDetails}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.packageDetails}:</span>
                          <span className="font-medium">{packageData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.totalLicensesIncluded}:</span>
                          <span className="font-medium">{packageData.licenses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.monthlyPrice}:</span>
                          <span className="font-medium">{formatCurrency(packageData.monthlyPrice)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{texts.selectedByAgent}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.agentCommission}:</span>
                          <span className="font-medium">{formatCurrency(packageData.licenses * 1)} {texts.perMonth}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          1 NOK {texts.perMonth} per lisens
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                      <div className="space-y-2">
                        {clubData?.packageStatus === 'pending_payment' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-orange-500 mr-2" />
                                <span className="text-sm font-medium text-orange-800">{texts.packagePendingActivation}</span>
                              </div>
                            </div>
                            <p className="text-xs text-orange-600 mb-3">
                              Aktiver pakken for å starte med lisenser og selgere
                            </p>
                            <Button
                              size="sm"
                              onClick={handleActivatePackage}
                              disabled={paymentLoading}
                              className="w-full"
                            >
                              {paymentLoading ? 'Aktiverer...' : texts.activatePackage}
                            </Button>
                          </div>
                        )}
                        
                        {clubData?.packageStatus === 'active' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm font-medium text-green-800">{texts.packageActive}</span>
                            </div>
                            <p className="text-xs text-green-600">
                              Du kan nå invitere selgere og tildele lisenser
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalMembers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeLicenses}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.activeLicenses}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalRevenue}</p>
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
                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.monthlyGrowth}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSellers}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalSellers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Send className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.pendingInvites}</div>
                  <p className="text-sm text-gray-600 mt-1">{texts.pendingInvites}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                className="h-20 text-left justify-start"
                onClick={handleBuyLicenses}
              >
                <CreditCard className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">{texts.buyLicenses}</div>
                  <div className="text-sm opacity-80">{texts.licensePackages}</div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="h-20 text-left justify-start"
                onClick={handleManageCampaigns}
              >
                <Calendar className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">{texts.manageCampaigns}</div>
                  <div className="text-sm text-gray-500">{texts.campaignDescription}</div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="h-20 text-left justify-start"
                onClick={handleInviteSeller}
              >
                <UserPlus className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">{texts.inviteSeller}</div>
                  <div className="text-sm text-gray-500">{stats.totalSellers} {texts.active.toLowerCase()}</div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="h-20 text-left justify-start"
                onClick={handleInviteMember}
              >
                <Send className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">{texts.inviteMember}</div>
                  <div className="text-sm text-gray-500">{stats.totalMembers} {texts.members.toLowerCase()}</div>
                </div>
              </Button>
            </div>
          </>
        )}

        {/* Members Tab */}
        {selectedTab === 'members' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{texts.members}</CardTitle>
                <CardDescription>{stats.totalMembers} {texts.totalMembers.toLowerCase()}</CardDescription>
              </div>
              <Button onClick={handleInviteMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                {texts.inviteMember}
              </Button>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.memberName}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.email}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.status}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.joinedDate}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">
                          {texts.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {member.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.subscriptionStatus === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {member.subscriptionStatus === 'active' ? texts.active : texts.pending}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDate(member.createdAt)}
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
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">{texts.noMembers}</p>
                  <Button onClick={handleInviteMember}>
                    <Send className="h-4 w-4 mr-2" />
                    {texts.inviteFirstMember}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sellers Tab */}
        {selectedTab === 'sellers' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{texts.sellers}</CardTitle>
                <CardDescription>{stats.totalSellers} {texts.totalSellers.toLowerCase()}</CardDescription>
              </div>
              <Button onClick={handleInviteSeller}>
                <UserPlus className="h-4 w-4 mr-2" />
                {texts.inviteSeller}
              </Button>
            </CardHeader>
            <CardContent>
              {sellers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.sellerName}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.totalSales}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.commission}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.performance}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">
                          {texts.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map((seller) => (
                        <tr key={seller.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {seller.firstName} {seller.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{seller.email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {seller.totalSales}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {formatCurrency(seller.totalCommission)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-gray-600">
                                {seller.conversionRate}%
                              </span>
                            </div>
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
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">{texts.noSellers}</p>
                  <Button onClick={handleInviteSeller}>
                    <Send className="h-4 w-4 mr-2" />
                    {texts.inviteFirstSeller}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Licenses Tab */}
        {selectedTab === 'licenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="h-8 w-8 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {clubData?.availableLicenses || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{texts.availableLicenses}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.activeLicenses}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{texts.usedLicenses}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.expiringLicenses || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{texts.expiringLicenses}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{texts.licensePackages}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleBuyLicenses}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {texts.buyLicenses}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  {texts.renewLicenses}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finances Tab */}
        {selectedTab === 'finances' && financeData && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className={`${(financeData.currentBalance || 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      (financeData.currentBalance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign className={`h-6 w-6 ${
                        (financeData.currentBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    (financeData.currentBalance || 0) >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {formatCurrency(financeData.currentBalance || 0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.currentBalance}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    -{formatCurrency(financeData.totalDebt || 0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalDebt}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financeData.totalIncome || 0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalIncome}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {financeData.totalLicensesSold || 0}/{financeData.packageInfo?.licenses || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.licensesSold}</p>
                </CardContent>
              </Card>
            </div>

            {/* Package Financial Info */}
            {financeData.packageInfo && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Pakkeinformasjon</CardTitle>
                  <CardDescription>{financeData.packageInfo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Månedlig gjeld</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.debtPerLicense}:</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(financeData.packageInfo?.debtPerLicense || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total månedlig:</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(financeData.packageInfo?.monthlyDebt || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Fortjeneste per salg</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{texts.profitPerLicense}:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(financeData.packageInfo?.profitPerLicense || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salgsverdi:</span>
                          <span className="font-medium">
                            {formatCurrency(financeData.packageInfo?.retailPrice || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <Package className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-blue-800">
                              {financeData.licensesRemaining || 0} lisenser igjen
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">
                            {financeData.totalLicensesSold || 0} av {financeData.packageInfo?.licenses || 0} solgt
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>{texts.transactions}</CardTitle>
                <CardDescription>Siste finansielle transaksjoner</CardDescription>
              </CardHeader>
              <CardContent>
                {financeData.transactions && financeData.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {financeData.transactions.map((transaction, index) => (
                      <div key={transaction.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            transaction.type === 'monthly_debt' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {transaction.type === 'monthly_debt' 
                              ? <TrendingUp className="h-5 w-5 rotate-180" />
                              : <DollarSign className="h-5 w-5" />
                            }
                          </div>
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'monthly_debt' ? 'Månedlig gjeld' : 'Lisensalg'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('nb-NO')}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right ${
                          transaction.type === 'monthly_debt' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          <div className="font-medium">
                            {transaction.type === 'monthly_debt' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          {transaction.description && (
                            <div className="text-sm text-gray-500">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Ingen transaksjoner ennå</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
