'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, Globe, User, LogOut, LayoutDashboard, Settings, UserCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include' // Include cookies for authentication
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // User not logged in or session expired
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null); // Clear user state immediately
      setIsUserOpen(false); // Close dropdown
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.articles'), href: '/articles' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const getRoleDashboard = (role) => {
    const roleMap = {
      'platform_admin': '/dashboard/admin',
      'agent': '/dashboard/agent',
      'club_admin': '/dashboard/club',
      'seller': '/dashboard/seller',
      'subscriber': '/dashboard/subscriber'
    };
    return roleMap[role] || '/';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'platform_admin': language === 'no' ? 'Platform Admin' : 'Plattformadministrator',
      'agent': language === 'no' ? 'Agent' : 'Agent',
      'club_admin': language === 'no' ? 'Klubbadmin' : 'Klubbadmin',
      'seller': language === 'no' ? 'Selger' : 'Säljare',
      'subscriber': language === 'no' ? 'Abonnent' : 'Prenumerant'
    };
    return labels[role] || role;
  };

  return (
    <nav className={cn(
      'fixed top-0 w-full z-50 transition-all duration-200',
      scrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/icons/sportsmagasinet.png"
                alt="Sportsmagasinet"
                width={150}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-secondary-700 hover:text-primary-600'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1 text-secondary-700 hover:text-primary-600 transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {language === 'nb' ? 'NO' : 'SE'}
                </span>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  isLangOpen && 'rotate-180'
                )} />
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 animate-slide-down">
                  <button
                    onClick={() => {
                      changeLanguage('nb');
                      setIsLangOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-secondary-50',
                      language === 'nb' && 'bg-primary-50 text-primary-600'
                    )}
                  >
                    🇳🇴 Norsk
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('sv');
                      setIsLangOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-secondary-50',
                      language === 'sv' && 'bg-primary-50 text-primary-600'
                    )}
                  >
                    🇸🇪 Svenska
                  </button>
                </div>
              )}
            </div>

            {/* User menu / Login */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserOpen(!isUserOpen)}
                  className="flex items-center space-x-3 px-2 py-2 rounded-full hover:bg-gray-100 transition-colors group"
                >
                  {/* Profile Avatar */}
                  <div className="relative">
                    {user.profileImageUrl ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-md">
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  
                  {/* User Name - Hidden on mobile */}
                  <span className="hidden md:block font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                    {user.firstName || user.email?.split('@')[0] || 'Bruker'}
                  </span>
                  
                  {/* Dropdown Arrow */}
                  <ChevronDown className={cn(
                    'h-4 w-4 text-gray-500 transition-all duration-200',
                    isUserOpen && 'rotate-180 text-gray-700'
                  )} />
                </button>
                
                {isUserOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-slide-down z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                            <img 
                              src={user.profileImageUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                            {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email?.split('@')[0] || 'Bruker'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <p className="text-xs font-medium text-blue-600 mt-0.5">{getRoleLabel(user.role)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href={getRoleDashboard(user.role)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setIsUserOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-gray-400" />
                        <span>{language === 'nb' ? 'Dashboard' : 'Kontrollpanel'}</span>
                      </Link>
                      
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setIsUserOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span>{language === 'nb' ? 'Min Profil' : 'Min profil'}</span>
                      </Link>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    {/* Logout */}
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{language === 'nb' ? 'Logg ut' : 'Logga ut'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary-700 hover:text-primary-600 hover:bg-secondary-100"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-secondary-200 animate-slide-down">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium',
                pathname === item.href
                  ? 'bg-red-600 text-white'
                  : 'text-gray-900 hover:bg-gray-100'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {user && (
            <Link
              href={getRoleDashboard(user.role)}
              className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              {getRoleLabel(user.role)}
            </Link>
          )}
          {user && (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {t('nav.logout')}
            </button>
          )}
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-base font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
