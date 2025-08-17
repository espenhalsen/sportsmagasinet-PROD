'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, CreditCard, BookOpen, Trophy, Star, Clock,
  ChevronRight, Download, Share2, Bell, Settings, Lock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function SubscriberDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Translations
  const translations = {
    nb: {
      title: 'Min Side',
      welcome: 'Velkommen tilbake',
      mySubscription: 'Mitt abonnement',
      readingHistory: 'Lesehistorikk',
      savedArticles: 'Lagrede artikler',
      recommendations: 'Anbefalte for deg',
      status: 'Status',
      active: 'Aktiv',
      expired: 'Utløpt',
      pending: 'Venter på betaling',
      expiresOn: 'Utløper',
      subscribedThrough: 'Abonnert gjennom',
      manageSubscription: 'Administrer abonnement',
      renewSubscription: 'Forny abonnement',
      downloadInvoice: 'Last ned faktura',
      articlesRead: 'Artikler lest',
      thisMonth: 'Denne måneden',
      totalRead: 'Totalt lest',
      readingTime: 'Lesetid',
      favoriteCategory: 'Favoritt kategori',
      continueReading: 'Fortsett å lese',
      readMore: 'Les mer',
      shareArticle: 'Del artikkel',
      saveArticle: 'Lagre artikkel',
      removeFromSaved: 'Fjern fra lagrede',
      noHistory: 'Ingen lesehistorikk ennå',
      noSaved: 'Ingen lagrede artikler',
      startReading: 'Start å lese nå',
      browseArticles: 'Bla gjennom artikler',
      subscriptionBenefits: 'Dine fordeler',
      unlimitedAccess: 'Ubegrenset tilgang til alle artikler',
      exclusiveContent: 'Eksklusivt innhold og analyser',
      adFree: 'Reklamefri opplevelse',
      offlineReading: 'Last ned artikler for offline lesing',
      notifications: 'Varsler',
      emailNotifications: 'E-postvarsler for nye artikler',
      smsNotifications: 'SMS-varsler for viktige nyheter',
      preferences: 'Preferanser',
      editProfile: 'Rediger profil',
      changePassword: 'Endre passord',
      notificationSettings: 'Varslingsinnstillinger',
      minutes: 'minutter',
      hours: 'timer',
    },
    sv: {
      title: 'Min Sida',
      welcome: 'Välkommen tillbaka',
      mySubscription: 'Min prenumeration',
      readingHistory: 'Läshistorik',
      savedArticles: 'Sparade artiklar',
      recommendations: 'Rekommenderat för dig',
      status: 'Status',
      active: 'Aktiv',
      expired: 'Utgången',
      pending: 'Väntar på betalning',
      expiresOn: 'Utgår',
      subscribedThrough: 'Prenumererar genom',
      manageSubscription: 'Hantera prenumeration',
      renewSubscription: 'Förnya prenumeration',
      downloadInvoice: 'Ladda ner faktura',
      articlesRead: 'Artiklar lästa',
      thisMonth: 'Denna månad',
      totalRead: 'Totalt läst',
      readingTime: 'Lästid',
      favoriteCategory: 'Favoritkategori',
      continueReading: 'Fortsätt läsa',
      readMore: 'Läs mer',
      shareArticle: 'Dela artikel',
      saveArticle: 'Spara artikel',
      removeFromSaved: 'Ta bort från sparade',
      noHistory: 'Ingen läshistorik ännu',
      noSaved: 'Inga sparade artiklar',
      startReading: 'Börja läsa nu',
      browseArticles: 'Bläddra bland artiklar',
      subscriptionBenefits: 'Dina fördelar',
      unlimitedAccess: 'Obegränsad tillgång till alla artiklar',
      exclusiveContent: 'Exklusivt innehåll och analyser',
      adFree: 'Reklamfri upplevelse',
      offlineReading: 'Ladda ner artiklar för offline-läsning',
      notifications: 'Aviseringar',
      emailNotifications: 'E-postaviseringar för nya artiklar',
      smsNotifications: 'SMS-aviseringar för viktiga nyheter',
      preferences: 'Preferenser',
      editProfile: 'Redigera profil',
      changePassword: 'Ändra lösenord',
      notificationSettings: 'Aviseringsinställningar',
      minutes: 'minuter',
      hours: 'timmar',
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

      // Check if user is subscriber
      if (user.role !== 'subscriber') {
        router.push('/');
        return;
      }

      // Fetch subscription details
      const subResponse = await fetch('/api/dashboard/subscriber/subscription');
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Fetch reading history
      const historyResponse = await fetch('/api/dashboard/subscriber/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setReadingHistory(historyData);
      }

      // Fetch saved articles
      const savedResponse = await fetch('/api/dashboard/subscriber/saved');
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSavedArticles(savedData);
      }

      // Fetch recommendations
      const recommendResponse = await fetch('/api/dashboard/subscriber/recommendations');
      if (recommendResponse.ok) {
        const recommendData = await recommendResponse.json();
        setRecommendations(recommendData);
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
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(subscription.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenew = () => {
    router.push('/subscribe/renew');
  };

  const handleArticleClick = (articleId) => {
    router.push(`/articles/${articleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

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

        {/* Subscription Status Alert */}
        {isExpiringSoon && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="text-yellow-800">
                  Ditt abonnement utløper om {daysUntilExpiry} dager
                </span>
              </div>
              <Button size="sm" onClick={handleRenew}>
                {texts.renewSubscription}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reading Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold">{readingHistory.monthCount || 0}</div>
                  <p className="text-xs text-gray-600">{texts.thisMonth}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-xl font-bold">{readingHistory.totalCount || 0}</div>
                  <p className="text-xs text-gray-600">{texts.totalRead}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-xl font-bold">
                    {readingHistory.totalTime || 0}
                  </div>
                  <p className="text-xs text-gray-600">{texts.hours}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold">
                    {readingHistory.favoriteCategory || 'Fotball'}
                  </div>
                  <p className="text-xs text-gray-600">{texts.favoriteCategory}</p>
                </CardContent>
              </Card>
            </div>

            {/* Continue Reading */}
            {readingHistory.recent && readingHistory.recent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{texts.continueReading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {readingHistory.recent.slice(0, 3).map((article) => (
                      <div 
                        key={article.id}
                        className="flex items-start space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <img 
                          src={article.image || 'https://via.placeholder.com/100x100'} 
                          alt={article.title}
                          className="w-20 h-20 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 hover:text-blue-600">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {article.readingProgress}% lest
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>{texts.recommendations}</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.slice(0, 4).map((article) => (
                      <div 
                        key={article.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg overflow-hidden border"
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <img 
                          src={article.image || 'https://via.placeholder.com/400x200'} 
                          alt={article.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-4">
                          <span className="text-xs text-blue-600 font-medium">
                            {article.category}
                          </span>
                          <h4 className="font-medium text-gray-900 mt-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{texts.startReading}</p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push('/articles')}
                    >
                      {texts.browseArticles}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle>{texts.mySubscription}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{texts.status}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscription?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : subscription?.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription?.status === 'active' ? texts.active : 
                     subscription?.status === 'expired' ? texts.expired : texts.pending}
                  </span>
                </div>

                {subscription?.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600">{texts.expiresOn}</p>
                    <p className="font-medium">{formatDate(subscription.expiryDate)}</p>
                  </div>
                )}

                {subscription?.clubName && (
                  <div>
                    <p className="text-sm text-gray-600">{texts.subscribedThrough}</p>
                    <p className="font-medium">{subscription.clubName}</p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  {subscription?.status === 'expired' ? (
                    <Button 
                      className="w-full"
                      onClick={handleRenew}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {texts.renewSubscription}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/account/subscription')}
                    >
                      {texts.manageSubscription}
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {texts.downloadInvoice}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{texts.subscriptionBenefits}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Lock className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.unlimitedAccess}</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.exclusiveContent}</span>
                  </li>
                  <li className="flex items-start">
                    <BookOpen className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.adFree}</span>
                  </li>
                  <li className="flex items-start">
                    <Download className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{texts.offlineReading}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{texts.preferences}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/account/profile')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {texts.editProfile}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/account/password')}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {texts.changePassword}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/account/notifications')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {texts.notificationSettings}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
