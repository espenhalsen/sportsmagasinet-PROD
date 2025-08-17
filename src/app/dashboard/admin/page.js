'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp,
  UserPlus,
  FileText,
  Settings,
  ChevronRight,
  Activity,
  DollarSign
} from 'lucide-react';

export default function PlatformAdminDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClubs: 0,
    totalSubscribers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0,
  });

  const text = {
    nb: {
      title: 'Plattformadministering',
      welcome: 'Velkommen tilbake',
      overview: 'Oversikt',
      totalAgents: 'Totalt Agenter',
      totalClubs: 'Totalt Klubber',
      totalSubscribers: 'Totalt Abonnenter',
      totalRevenue: 'Total Omsetning',
      activeSubscriptions: 'Aktive Abonnementer',
      monthlyGrowth: 'Månedlig Vekst',
      quickActions: 'Hurtighandlinger',
      inviteAgent: 'Inviter Ny Agent',
      viewAgents: 'Se Alle Agenter',
      viewClubs: 'Se Alle Klubber',
      viewFinancials: 'Finansiell Oversikt',
      manageArticles: 'Administrer Artikler',
      platformSettings: 'Plattforminnstillinger',
      recentActivity: 'Nylig Aktivitet',
      newAgent: 'Ny agent registrert',
      newClub: 'Ny klubb opprettet',
      payment: 'Betaling mottatt',
      subscription: 'Abonnement fornyet',
      hoursAgo: 'timer siden',
      yesterday: 'i går',
      loading: 'Laster...',
    },
    sv: {
      title: 'Plattformsadministrering',
      welcome: 'Välkommen tillbaka',
      overview: 'Översikt',
      totalAgents: 'Totalt Agenter',
      totalClubs: 'Totalt Klubbar',
      totalSubscribers: 'Totalt Prenumeranter',
      totalRevenue: 'Total Omsättning',
      activeSubscriptions: 'Aktiva Prenumerationer',
      monthlyGrowth: 'Månatlig Tillväxt',
      quickActions: 'Snabbåtgärder',
      inviteAgent: 'Bjud in Ny Agent',
      viewAgents: 'Se Alla Agenter',
      viewClubs: 'Se Alla Klubbar',
      viewFinancials: 'Finansiell Översikt',
      manageArticles: 'Hantera Artiklar',
      platformSettings: 'Plattformsinställningar',
      recentActivity: 'Senaste Aktivitet',
      newAgent: 'Ny agent registrerad',
      newClub: 'Ny klubb skapad',
      payment: 'Betalning mottagen',
      subscription: 'Prenumeration förnyad',
      hoursAgo: 'timmar sedan',
      yesterday: 'igår',
      loading: 'Laddar...',
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        if (data.role !== 'platform_admin') {
          router.push('/dashboard');
          return;
        }
        setUser(data);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // In production, this would fetch from API
    // For now, using mock data
    setStats({
      totalAgents: 12,
      totalClubs: 45,
      totalSubscribers: 3250,
      totalRevenue: 487500,
      activeSubscriptions: 2980,
      monthlyGrowth: 12.5,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-600">
          {t.welcome}, {user?.firstName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalAgents}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              +2 denne måneden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalClubs}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClubs}</div>
            <p className="text-xs text-muted-foreground">
              +5 denne måneden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalSubscribers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% vekst
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              kr {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Månedlig inntekt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeSubscriptions}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              91% fornyelsesrate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.monthlyGrowth}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">
              Sammenlignet med forrige måned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push('/dashboard/admin/invite-agent')}
              className="justify-start"
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t.inviteAgent}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/admin/agents')}
              className="justify-start"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              {t.viewAgents}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/admin/clubs')}
              className="justify-start"
              variant="outline"
            >
              <Building2 className="mr-2 h-4 w-4" />
              {t.viewClubs}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/admin/financials')}
              className="justify-start"
              variant="outline"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t.viewFinancials}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/admin/articles')}
              className="justify-start"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t.manageArticles}
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/admin/settings')}
              className="justify-start"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t.platformSettings}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.newAgent}</p>
                  <p className="text-xs text-gray-500">Anders Olsen - 2 {t.hoursAgo}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Building2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.newClub}</p>
                  <p className="text-xs text-gray-500">Oslo FK - 5 {t.hoursAgo}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.payment}</p>
                  <p className="text-xs text-gray-500">Bergen SK - kr 29,900 - {t.yesterday}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
