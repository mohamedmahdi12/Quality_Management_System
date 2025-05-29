"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, LockKeyhole, Mail, User, Globe, Target, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import i18n from '../../src/i18n';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
      toast.success(t('Login successful!'));
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen w-screen flex flex-col md:flex-row overflow-hidden fixed top-0 left-0 bg-gray-50">
      {/* Left Half: Blue Background with Image and Text */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-blue-600 min-h-[50vh] md:min-h-screen relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-700 opacity-10 pointer-events-none" />
        <div className="text-center text-white space-y-8 z-10 max-w-2xl">
          {/* Logo at top */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-200 mt-8">
              <Image 
                src={require('@/Logo/logo o6u.png')} 
                alt="O6U Logo" 
                width={84} 
                height={84} 
                className="object-contain rounded-full" 
              />
            </div>
          </div>

          {/* Vision & Mission Content */}
          <div className="space-y-6">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-6 h-6 text-blue-200" />
                <h2 className="text-2xl font-bold text-blue-100 mt-2">{t('Vision')}</h2>
              </div>
              <p className="text-lg leading-relaxed text-blue-50">
                {t('The Faculty of Information Systems and Computer Science at October 6 University aspires to be a leading academic institution in the fields of Information Systems, Computer Science, Artificial Intelligence, and Technological Networks at both the local and regional levels.')}
              </p>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flag className="w-6 h-6 text-blue-200" />
                <h2 className="text-2xl font-bold text-blue-100 mt-2">{t('Mission')}</h2>
              </div>
              <p className="text-lg leading-relaxed text-blue-50">
                {t('The Faculty of IS & CS at October 6 University is committed to graduating highly skilled professionals in the fields of IS, CS, AI, and Network . These graduates will be equipped with the competencies needed to work professionally at the local and regional levels, within a framework that upholds professional ethics. The college also strives to provide an educational and research environment, along with community services, that contribute to the advancement of the profession and society.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Half: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-0 bg-white dark:bg-gray-900 min-h-[50vh] md:min-h-screen relative">
        <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white shadow hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700 capitalize">{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="dark:hover:bg-gray-700">
                {i18n.language === 'en' && <span className="mr-2 text-blue-600">✓</span>}
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')} className="dark:hover:bg-gray-700">
                {i18n.language === 'ar' && <span className="mr-2 text-blue-600">✓</span>}
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
        <Card className="shadow-lg border-0 rounded-2xl max-w-md w-full animate-fade-in-up opacity-100 relative z-10 dark:bg-gray-800">
          <CardHeader className="space-y-2 text-center px-6 py-8 flex flex-col items-center justify-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-800 mb-2 shadow mt-2">
              <User className="w-7 h-7 text-blue-600" />
            </span>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">{t('Sign In')}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('Enter your email and password to sign in to your account')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-700 font-medium dark:text-gray-300">{t('Email')}</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('Enter your email')}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-gray-100 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                  />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">{t('Password')}</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder={t('Enter your password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-gray-100 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-10  dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                  />
                  <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Signing In...')}
                  </>
                ) : (
                  t('Sign In')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Footer inside white half */}
        <footer className="mt-6 text-center text-xs text-gray-400 w-full">
          &copy; {new Date().getFullYear()} October 6 University - Quality Assurance Unit
        </footer>
      </div>
    </div>
  );
}