"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { toast } from 'sonner';
import { 
  BarChart3, Users, CalendarDays, BookOpen, 
  ClipboardList, FileText, Share2, ActivitySquare, Star 
} from 'lucide-react';
import RecentActivity from '@/components/dashboard/RecentActivity';
import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickActions from '@/components/dashboard/QuickActions';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user, apiClient } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    academicYears: 0,
    courses: 0,
    standards: 0,
    users: 0,
    requests: 0,
    attachments: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState(null);
  const [activeYearStats, setActiveYearStats] = useState(null);

  useEffect(() => {
    // Fetch initial stats and the active academic year once on mount
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch counts for different entities
        const [
          academicYearsRes,
          coursesRes,
          standardsRes,
          usersRes,
          requestsRes,
          attachmentsRes,
          activeYearRes
        ] = await Promise.all([
          apiClient('/academic-years/'),
          apiClient('/courses/'),
          apiClient('/standards/'),
          user?.role === 'ADMIN' ? apiClient('/users/') : Promise.resolve({ json: async () => ({ count: 0 }) }),
          apiClient('/requests/'),
          apiClient('/attachments/'),
          apiClient('/academic-years/?status=ACTIVE')
        ]);

        const academicYearsData = await academicYearsRes.json();
        const coursesData = await coursesRes.json();
        const standardsData = await standardsRes.json();
        const usersData = await usersRes.json();
        const requestsData = await requestsRes.json();
        const attachmentsData = await attachmentsRes.json();
        const activeYearData = await activeYearRes.json();

        setStats({
          academicYears: academicYearsData.count || 0,
          courses: coursesData.count || 0,
          standards: standardsData.count || 0,
          users: usersData.count || 0,
          requests: requestsData.count || 0,
          attachments: attachmentsData.count || 0
        });

        setActiveYear(activeYearData.results?.[0] || null);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // This effect runs whenever activeYear changes to fetch its statistics
  }, [apiClient]); // Dependencies adjusted to avoid loop

  useEffect(() => {
    const fetchActiveYearStats = async (yearId) => {
      try {
        // setLoading(true); // Maybe set a separate loading state for just stats if needed
        const response = await apiClient(`/academic-years/${yearId}/statistics/`);
        if (!response.ok) throw new Error('Failed to fetch active year statistics');
        const data = await response.json();
        setActiveYearStats(data);
      } catch (error) {
        console.error(`Error fetching active year statistics for ${yearId}:`, error);
        setActiveYearStats({ error: true }); // Mark as error or load failed
      } finally {
        // setLoading(false); // Match loading state if set above
      }
    };

    if (activeYear) {
      fetchActiveYearStats(activeYear.id);
    } else {
      setActiveYearStats(null); // Clear stats if no active year
    }

  }, [activeYear, apiClient]); // This effect depends on activeYear

  let cards = [];
  if (activeYear) {
    cards = [
      {
        title: t('Active Academic Year'),
        // Pass both the activeYear data and its stats within value
        value: { academicYearData: activeYear, stats: activeYearStats },
        icon: Star,
        color: 'bg-primary',
        isActiveYear: true
      }
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('Dashboard')}</h1>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(cards.length > 0 ? cards.length : 3)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <DashboardCard 
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              isActiveYear={card.isActiveYear}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsGrid loading={loading} />
        
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity loading={loading} />
          <QuickActions role={user?.role} />
        </div>
      </div>
    </div>
  );
}