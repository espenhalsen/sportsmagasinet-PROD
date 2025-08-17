'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, TrendingUp, Package, DollarSign, Plus, Send, 
  Building, Calendar, ChevronRight, Eye, Edit, Download,
  Wallet, Clock, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function AgentDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalClubs: 0,
    activeLicenses: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [commissionData, setCommissionData] = useState({
    summary: {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
      currentMonthEarnings: 0,
    },
    commissions: [],
  });
  const [clubs, setClubs] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Translations
  const translations = {
    nb: {
      title: 'Agent Dashboard',
      welcome: 'Velkommen tilbake',
      overview: 'Oversikt',
      clubs: 'Mine klubber',
      licenses: 'Lisenser',
      revenue: 'Inntekter',
      growth: 'Vekst',
      thisMonth: 'Denne måneden',
      lastMonth: 'Forrige måned',
      thisYear: 'Dette året',
      totalClubs: 'Totalt antall klubber',
      activeLicenses: 'Aktive lisenser',
      totalRevenue: 'Total inntekt',
      monthlyGrowth: 'Månedlig vekst',
      commissions: 'Provisjoner',
      totalEarned: 'Totalt opptjent',
      totalPaid: 'Totalt utbetalt',
      totalPending: 'Venter utbetaling',
      currentMonth: 'Denne måneden',
      commissionsTab: 'Provisjoner',
      amount: 'Beløp',
      earnedDate: 'Opptjent dato',
      paidDate: 'Utbetalt dato',
      clubCommission: 'Klubb provisjon',
      licenseCommission: 'Lisens provisjon',
      inviteClub: 'Inviter ny klubb',
      viewAll: 'Se alle',
      clubName: 'Klubbnavn',
      licenses: 'Lisenser',
      revenue: 'Inntekt',
      status: 'Status',
      active: 'Aktiv',
      pending: 'Venter',
      actions: 'Handlinger',
      view: 'Vis',
      edit: 'Rediger',
      sendInvite: 'Send invitasjon',
      downloadReport: 'Last ned rapport',
      noClubs: 'Ingen klubber registrert ennå',
      inviteFirstClub: 'Inviter din første klubb for å komme i gang',
    },
    sv: {
      title: 'Agent Dashboard',
      welcome: 'Välkommen tillbaka',
      overview: 'Översikt',
      clubs: 'Mina klubbar',
      licenses: 'Licenser',
      revenue: 'Intäkter',
      growth: 'Tillväxt',
      thisMonth: 'Denna månad',
      lastMonth: 'Förra månaden',
      thisYear: 'Detta år',
      totalClubs: 'Totalt antal klubbar',
      activeLicenses: 'Aktiva licenser',
      totalRevenue: 'Total intäkt',
      monthlyGrowth: 'Månatlig tillväxt',
      commissions: 'Provisioner',
      totalEarned: 'Totalt intjänat',
      totalPaid: 'Totalt utbetalt',
      totalPending: 'Väntar utbetalning',
      currentMonth: 'Denna månad',
      commissionsTab: 'Provisioner',
      amount: 'Belopp',
      earnedDate: 'Intjänat datum',
      paidDate: 'Utbetalt datum',
      clubCommission: 'Klubb provision',
      licenseCommission: 'Licens provision',
      inviteClub: 'Bjud in ny klubb',
      viewAll: 'Se alla',
      clubName: 'Klubbnamn',
      licenses: 'Licenser',
      revenue: 'Intäkt',
      status: 'Status',
      active: 'Aktiv',
      pending: 'Väntar',
      actions: 'Åtgärder',
      view: 'Visa',
      edit: 'Redigera',
      sendInvite: 'Skicka inbjudan',
      downloadReport: 'Ladda ner rapport',
      noClubs: 'Inga klubbar registrerade ännu',
      inviteFirstClub: 'Bjud in din första klubb för att komma igång',
    }
  };

  const texts = translations[language] || translations.nb;

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

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

      // Check if user is agent
      if (user.role !== 'agent') {
        router.push('/');
        return;
      }

      // Fetch agent stats
      const statsResponse = await fetch(`/api/dashboard/agent/stats?period=${selectedPeriod}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch clubs
      const clubsResponse = await fetch('/api/dashboard/agent/clubs');
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        console.log('Clubs API response:', clubsData);
        setClubs(clubsData.clubs || []);
      } else {
        console.error('Failed to fetch clubs:', clubsResponse.status);
      }

      // Fetch commissions
      const commissionsResponse = await fetch('/api/dashboard/agent/commissions?limit=10');
      if (commissionsResponse.ok) {
        const commissionData = await commissionsResponse.json();
        setCommissionData(commissionData);
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

  const handleInviteClub = () => {
    router.push('/dashboard/agent/invite');
  };

  const handleViewClub = (clubId) => {
    router.push(`/dashboard/agent/clubs/${clubId}`);
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
          <p className="text-gray-600 mt-1">{texts.title}</p>
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
              onClick={() => setSelectedTab('clubs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'clubs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.clubs}
            </button>
            <button
              onClick={() => setSelectedTab('commissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'commissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {texts.commissionsTab}
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Agent Balance Card - Prominent */}
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Din saldo</h2>
                      <div className="text-4xl font-bold mb-2">
                        {formatCurrency(commissionData.summary.totalEarned - commissionData.summary.totalPaid)}
                      </div>
                      <div className="flex space-x-6 text-sm opacity-90">
                        <div>
                          <span className="block">Opptjent totalt</span>
                          <span className="font-semibold">{formatCurrency(commissionData.summary.totalEarned)}</span>
                        </div>
                        <div>
                          <span className="block">Utbetalt</span>
                          <span className="font-semibold">{formatCurrency(commissionData.summary.totalPaid)}</span>
                        </div>
                        <div>
                          <span className="block">Venter utbetaling</span>
                          <span className="font-semibold">{formatCurrency(commissionData.summary.totalPending)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="h-10 w-10" />
                      </div>
                      <Button 
                        variant="outline" 
                        className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
                      >
                        Be om utbetaling
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Selector */}
            <div className="mb-6 flex space-x-2">
              <Button
                variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                {texts.thisMonth}
              </Button>
              <Button
                variant={selectedPeriod === 'lastMonth' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('lastMonth')}
              >
                {texts.lastMonth}
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('year')}
              >
                {texts.thisYear}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">{texts.clubs}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalClubs}</div>
              <p className="text-sm text-gray-600 mt-1">{texts.totalClubs}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">{texts.licenses}</span>
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
                <span className="text-sm text-gray-500">{texts.revenue}</span>
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
                <span className="text-sm text-gray-500">{texts.growth}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}%
              </div>
              <p className="text-sm text-gray-600 mt-1">{texts.monthlyGrowth}</p>
            </CardContent>
          </Card>
        </div>

            {/* Commission Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-500">{texts.totalEarned}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(commissionData.summary.totalEarned)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalEarned}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-500">{texts.totalPaid}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(commissionData.summary.totalPaid)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalPaid}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="text-sm text-gray-500">{texts.totalPending}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(commissionData.summary.totalPending)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.totalPending}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-500">{texts.currentMonth}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(commissionData.summary.currentMonthEarnings)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{texts.currentMonth}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Clubs Tab */}
        {selectedTab === 'clubs' && (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{texts.clubs}</CardTitle>
              <CardDescription>
                {clubs.length} {texts.totalClubs.toLowerCase()}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleInviteClub}>
                <Plus className="h-4 w-4 mr-2" />
                {texts.inviteClub}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {texts.downloadReport}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {clubs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {texts.clubName}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {texts.licenses}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Provisjon
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {texts.status}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {texts.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((club) => (
                      <tr key={club.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{club.name}</div>
                            <div className="text-sm text-gray-500">{club.city}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900">{club.activeLicenses}</div>
                          <div className="text-sm text-gray-500">av {club.totalLicenses}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-green-600">
                              +{formatCurrency((club.totalLicenses || 0) * 1)} / mnd
                            </div>
                            <div className="text-xs text-gray-500">
                              Din provisjon
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            club.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {club.status === 'active' ? texts.active : texts.pending}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewClub(club.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {texts.view}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{texts.noClubs}</p>
                <Button onClick={handleInviteClub}>
                  <Send className="h-4 w-4 mr-2" />
                  {texts.inviteFirstClub}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Commissions Tab */}
        {selectedTab === 'commissions' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{texts.commissionsTab}</CardTitle>
                  <CardDescription>
                    {texts.totalEarned}: {formatCurrency(commissionData.summary.totalEarned)}
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {texts.downloadReport}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {commissionData.commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.clubName}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.amount}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.status}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          {texts.earnedDate}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionData.commissions.map((commission) => (
                        <tr key={commission.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-sm font-medium">
                                {commission.type === 'monthly_license' ? texts.licenseCommission : texts.clubCommission}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {commission.clubName || 'Klubb'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commission.licenses} lisenser
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(commission.amount)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              commission.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : commission.status === 'earned'
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {commission.status === 'paid' 
                                ? texts.totalPaid
                                : commission.status === 'earned'
                                ? 'Opptjent'
                                : texts.pending}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {commission.createdAt ? new Date(commission.createdAt).toLocaleDateString(
                              language === 'sv' ? 'sv-SE' : 'nb-NO',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Ingen provisjoner ennå</p>
                  <Button onClick={handleInviteClub}>
                    <Plus className="h-4 w-4 mr-2" />
                    {texts.inviteClub}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
