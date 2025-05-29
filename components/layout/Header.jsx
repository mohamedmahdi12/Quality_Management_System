"use client";

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import '../../src/i18n';
import Breadcrumb from '@/components/Breadcrumb';

export default function Header() {
  const { user, logout, apiClient } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [activeYear, setActiveYear] = useState(null);
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const getInitials = (username) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };
  
  const getRoleName = (role) => {
    if (!role) return '';
    const roles = {
      'ADMIN': t('Admin'),
      'SUPERVISOR': t('Supervisor'),
      'PROFESSOR': t('Professor'),
      'TA': t('Teaching Assistant')
    };
    return roles[role] || role;
  };

  const fetchActiveYear = async () => {
    try {
      const res = await apiClient('/academic-years/?status=ACTIVE');
      const data = await res.json();
      setActiveYear(data.results?.[0] || null);
    } catch (error) {
      console.error('Error fetching active year:', error);
    }
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    fetchActiveYear();

    // Set up polling to check for active year changes every 3 seconds
    const interval = setInterval(fetchActiveYear, 3000);

    return () => clearInterval(interval);
  }, [apiClient]);

  return (
    <div className="border-b bg-card">
      <header className="h-14 flex items-center px-4 sm:px-6">
        <div className="flex-1"></div>
        
        <div className="flex items-center justify-center space-x-4">
          {activeYear && (
            <div className="flex items-center gap-2 text-primary font-semibold animate-fade-in">
              <Calendar className="w-5 h-5 text-primary mr-1" />
              <span className="hidden sm:inline font-bold tracking-wide">{t('Active Academic Year')}</span>
              <span className="font-mono text-base bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-3 py-1 rounded-lg border border-blue-200/50 shadow-sm backdrop-blur-sm ml-2">
                {activeYear.start_date} - {activeYear.end_date}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-end space-x-4">
          <select
            value={i18n.language}
            onChange={e => i18n.changeLanguage(e.target.value)}
            className="border rounded px-2 py-1 mr-2 focus:outline-none"
            style={{ minWidth: 80 }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('Role')}: {getRoleName(user?.role)}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('Log out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="px-4 sm:px-6">
        <Breadcrumb />
      </div>
    </div>
  );
}
