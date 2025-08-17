'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trophy, Users, TrendingUp, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

// Mock articles data - in production, these would come from Firebase
const mockArticles = [
  {
    id: '1',
    title: 'Haaland scorer hattrick i Champions League',
    titleSv: 'Haaland gör hattrick i Champions League',
    excerpt: 'Manchester City-spissen fortsetter målformen med tre scoringer mot Bayern München.',
    excerptSv: 'Manchester City-anfallaren fortsätter målformen med tre mål mot Bayern München.',
    category: 'Fotball',
    author: 'Erik Hansen',
    publishedAt: new Date('2024-01-14'),
    featuredImage: 'https://via.placeholder.com/600x400',
    isPremium: true,
  },
  {
    id: '2',
    title: 'Norge dominerer i alpint VM',
    titleSv: 'Norge dominerar i alpina VM',
    excerpt: 'Tre norske utøvere på pallen i storslalåm. En historisk dag for norsk alpinsport.',
    excerptSv: 'Tre norska åkare på pallen i storslalom. En historisk dag för norsk alpin sport.',
    category: 'Alpint',
    author: 'Maria Olsen',
    publishedAt: new Date('2024-01-13'),
    featuredImage: 'https://via.placeholder.com/600x400',
    isPremium: true,
  },
  {
    id: '3',
    title: 'Vålerenga vinner seriegull i håndball',
    titleSv: 'Vålerenga vinner serieguld i handboll',
    excerpt: 'Oslo-laget sikrer sitt første seriegull på fem år etter seier over Vipers.',
    excerptSv: 'Oslo-laget säkrar sitt första serieguld på fem år efter seger över Vipers.',
    category: 'Håndball',
    author: 'Thomas Berg',
    publishedAt: new Date('2024-01-12'),
    featuredImage: 'https://via.placeholder.com/600x400',
    isPremium: false,
  },
];

const features = [
  {
    icon: Trophy,
    title: 'Eksklusive artikler',
    titleSv: 'Exklusiva artiklar',
    description: 'Få tilgang til dybdeanalyser og eksklusive intervjuer med Nordens største sportsstjerner.',
    descriptionSv: 'Få tillgång till djupanalyser och exklusiva intervjuer med Nordens största sportstjärnor.',
  },
  {
    icon: Users,
    title: 'Støtt din klubb',
    titleSv: 'Stöd din klubb',
    description: 'Når du abonnerer gjennom din klubb, bidrar du direkte til klubbens økonomi.',
    descriptionSv: 'När du prenumererar genom din klubb bidrar du direkt till klubbens ekonomi.',
  },
  {
    icon: TrendingUp,
    title: 'Alltid oppdatert',
    titleSv: 'Alltid uppdaterad',
    description: 'Følg med på siste nytt fra alle store sportsbegivenheter i Norge og Sverige.',
    descriptionSv: 'Följ med på senaste nytt från alla stora sportevenemang i Norge och Sverige.',
  },
];

export default function Home() {
  const { language, t } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {language === 'nb' 
                ? 'Din komplette kilde for sport'
                : 'Din kompletta källa för sport'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              {language === 'nb'
                ? 'Les eksklusive artikler, analyser og nyheter fra Norges og Sveriges sportsverden'
                : 'Läs exklusiva artiklar, analyser och nyheter från Norges och Sveriges sportsvärld'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  {t('nav.login')}
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-primary-600">
                {language === 'nb' ? 'Kontakt din klubb' : 'Kontakta din klubb'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === 'nb' ? 'Hvorfor velge Sportsmagasinet?' : 'Varför välja Sportsmagasinet?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <CardTitle className="text-xl">
                      {language === 'nb' ? feature.title : feature.titleSv}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary-600">
                      {language === 'nb' ? feature.description : feature.descriptionSv}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles Preview Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              {language === 'nb' ? 'Siste artikler' : 'Senaste artiklarna'}
            </h2>
            <Link href="/articles">
              <Button variant="ghost" className="group">
                {language === 'nb' ? 'Se alle' : 'Se alla'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-secondary-200">
                  {article.isPremium && (
                    <div className="absolute top-2 right-2 bg-accent-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium
                    </div>
                  )}
                  <Image
                    src={article.featuredImage}
                    alt={language === 'nb' ? article.title : article.titleSv}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-primary-600 font-semibold">
                      {article.category}
                    </span>
                    <span className="text-xs text-secondary-500">
                      {article.publishedAt.toLocaleDateString(language === 'nb' ? 'nb-NO' : 'sv-SE')}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {language === 'nb' ? article.title : article.titleSv}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600 line-clamp-3">
                    {language === 'nb' ? article.excerpt : article.excerptSv}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-secondary-500">
                      {article.author}
                    </span>
                    <Link href={article.isPremium ? '/login' : `/articles/${article.id}`}>
                      <Button variant="ghost" size="sm" className="group">
                        {language === 'nb' ? 'Les mer' : 'Läs mer'}
                        <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'nb' 
              ? 'Bli en del av Sportsmagasinet'
              : 'Bli en del av Sportsmagasinet'}
          </h2>
          <p className="text-xl mb-8 text-white/90">
            {language === 'nb'
              ? 'Kontakt din lokale klubb for å få tilgang til vårt eksklusive innhold'
              : 'Kontakta din lokala klubb för att få tillgång till vårt exklusiva innehåll'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              {language === 'nb' ? 'For klubber' : 'För klubbar'}
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-primary-600">
              {language === 'nb' ? 'For agenter' : 'För agenter'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
