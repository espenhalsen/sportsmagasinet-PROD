'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: t('nav.about'), href: '/about' },
      { name: t('nav.contact'), href: '/contact' },
      { name: t('footer.privacy'), href: '/privacy' },
      { name: t('footer.terms'), href: '/terms' },
    ],
    resources: [
      { name: t('nav.articles'), href: '/articles' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Support', href: '/support' },
      { name: t('footer.cookies'), href: '/cookies' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/sportsmagasinet' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/sportsmagasinet' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/sportsmagasinet' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <Image
              src="/icons/sportsmagasinet.png"
              alt="Sportsmagasinet"
              width={150}
              height={40}
              className="h-10 w-auto filter brightness-0 invert"
            />
            <p className="text-gray-400 text-sm">
              Din komplette kilde for sportsnyheter og analyser. 
              Tilgjengelig for klubber og deres medlemmer.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-400 hover:text-white transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Selskap</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ressurser</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-secondary-400" />
                <a
                  href="mailto:post@sportsmag247.com"
                  className="text-secondary-300 hover:text-white transition-colors text-sm"
                >
                  post@sportsmag247.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-secondary-400" />
                <a
                  href="tel:+4721000000"
                  className="text-secondary-300 hover:text-white transition-colors text-sm"
                >
                  +47 960 43 937
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-secondary-400 mt-0.5" />
                <span className="text-secondary-300 text-sm">
                  Brønnøysund, Norge<br />
                  Göteborg, Sverige
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-secondary-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm">
              © {currentYear} Sportsmagasinet. {t('footer.rights')}.
            </p>
            <p className="text-secondary-400 text-sm mt-2 md:mt-0">
            Rock Media AS - Org.nr. 928 127 931
            
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
