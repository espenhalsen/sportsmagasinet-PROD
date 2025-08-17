import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sportsmagasinet - Din komplette sportskilde",
  description: "Norges og Sveriges ledende sportsmagasin. Les de siste nyhetsene, analyser og eksklusive artikler om alle typer sport.",
  keywords: "sport, fotball, håndball, ishockey, skiing, nyheter, magasin, abonnement",
  authors: [{ name: "Sportsmagasinet" }],
  openGraph: {
    title: "Sportsmagasinet",
    description: "Din komplette kilde for sportsnyheter og analyser",
    url: "https://sportsmag247.com",
    siteName: "Sportsmagasinet",
    locale: "nb_NO",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nb">
      <body className={inter.className}>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
