import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';

export default function DashboardCard({ title, value, icon: Icon, color, isActiveYear }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const [activeYear, setActiveYear] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isActiveYear) {
      setLoading(true);
      apiClient('/academic-years/?status=ACTIVE')
        .then(res => res.json())
        .then(data => setActiveYear(data.results?.[0] || null))
        .finally(() => setLoading(false));
    }
  }, [isActiveYear, apiClient]);

  if (isActiveYear && activeYear) {
    const stats = value?.stats;

    return (
      <div className="relative rounded-2xl overflow-hidden shadow border border-blue-200 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-100 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 transition-transform duration-200 hover:scale-[1.02] animate-fade-in max-w-4xl ">
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <span className="flex items-center gap-1 bg-blue-500/90 text-white px-2.5 py-1 rounded font-bold text-xs shadow ring-2 ring-blue-300 dark:ring-blue-700">
            <svg className="w-4 h-4 text-blue-200 animate-spin" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-3.09 1.636.588-3.43L5 10.364l3.455-.502L10 6.5l1.545 3.362L15 10.364l-2.498 2.842.588 3.43z"/></svg>
            {t('ACTIVE')}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-4 gap-1">
          <Icon className="h-7 w-7 text-blue-600 dark:text-blue-300 drop-shadow-lg" />
          <h3 className="text-base font-bold text-blue-900 dark:text-white tracking-wide mb-1 drop-shadow">{t('Active Academic Year')}</h3>
          <div className="font-mono text-sm bg-white/80 dark:bg-blue-950/70 text-blue-900 dark:text-white px-4 py-1.5 rounded border border-blue-200 dark:border-blue-700 shadow-inner font-bold tracking-wider">
            {loading ? <LoadingSpinner size="sm" /> : activeYear ? `${activeYear.start_date} - ${activeYear.end_date}` : t('No active year')}
          </div>
          {stats && !stats.error && (
            <div className="mt-4 pt-4 border-t border-gray-300/50 w-full space-y-2">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-white mb-2 drop-shadow">{t('Completion Statistics')}</h4>
              <div className="flex justify-between text-xs font-medium text-blue-800 dark:text-blue-200">
                <span>{t('Standards Completed')}:</span>
                <span>{stats.n_of_completed_standards} / {stats.n_of_standards}</span>
              </div>
              <Progress
                value={stats.n_of_standards > 0 ? (stats.n_of_completed_standards / stats.n_of_standards) * 100 : 0}
                className="w-full h-2 bg-gray-200 [&>div]:bg-green-500"
              />
              <div className="flex justify-between text-xs font-medium text-green-800 dark:text-green-200 mt-2">
                <span>{t('Courses Completed')}:</span>
                <span>{stats.n_of_completed_courses} / {stats.n_of_courses}</span>
              </div>
              <Progress
                value={stats.n_of_courses > 0 ? (stats.n_of_completed_courses / stats.n_of_courses) * 100 : 0}
                className="w-full h-2 bg-gray-200 [&>div]:bg-green-500"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  if (isActiveYear) {
    const academicYearData = value?.academicYearData;
    const stats = value?.stats;

    return (
      <div className="relative rounded-2xl overflow-hidden shadow border border-blue-200 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-100 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 transition-transform duration-200 hover:scale-[1.02] animate-fade-in max-w-4xl ">
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <span className="flex items-center gap-1 bg-blue-500/90 text-white px-2.5 py-1 rounded font-bold text-xs shadow ring-2 ring-blue-300 dark:ring-blue-700">
            <svg className="w-4 h-4 text-blue-200 animate-spin" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-3.09 1.636.588-3.43L5 10.364l3.455-.502L10 6.5l1.545 3.362L15 10.364l-2.498 2.842.588 3.43z"/></svg>
            {t('ACTIVE')}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-4 gap-1">
          <Icon className="h-7 w-7 text-blue-600 dark:text-blue-300 drop-shadow-lg" />
          <h3 className="text-base font-bold text-blue-900 dark:text-white tracking-wide mb-1 drop-shadow">{t('Active Academic Year')}</h3>
          <div className="font-mono text-sm bg-white/80 dark:bg-blue-950/70 text-blue-900 dark:text-white px-4 py-1.5 rounded border border-blue-200 dark:border-blue-700 shadow-inner font-bold tracking-wider">
            {academicYearData ? `${academicYearData.start_date} - ${academicYearData.end_date}` : t('Loading...')}
          </div>
          {stats && !stats.error && (
            <div className="mt-4 pt-4 border-t border-gray-300/50 w-full space-y-2">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-white mb-2 drop-shadow">{t('Completion Statistics')}</h4>
              <div className="flex justify-between text-xs font-medium text-blue-800 dark:text-blue-200">
                <span>{t('Standards Completed')}:</span>
                <span>{stats.n_of_completed_standards} / {stats.n_of_standards}</span>
              </div>
              <Progress
                value={stats.n_of_standards > 0 ? (stats.n_of_completed_standards / stats.n_of_standards) * 100 : 0}
                className="w-full h-2 bg-gray-200 [&>div]:bg-green-500"
              />
              <div className="flex justify-between text-xs font-medium text-green-800 dark:text-green-200 mt-2">
                <span>{t('Courses Completed')}:</span>
                <span>{stats.n_of_completed_courses} / {stats.n_of_courses}</span>
              </div>
              <Progress
                value={stats.n_of_courses > 0 ? (stats.n_of_completed_courses / stats.n_of_courses) * 100 : 0}
                className="w-full h-2 bg-gray-200 [&>div]:bg-green-500"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div
      className={
        `bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 
        rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden 
        transition-transform duration-200 hover:scale-[1.03] hover:shadow-2xl cursor-pointer`
      }
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2 flex-1">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-wide mb-1">
              {title}
            </h3>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-1 bg-gradient-to-tr from-blue-400 via-emerald-400 to-purple-400 shadow-lg">
              <span className="text-3xl font-extrabold text-white drop-shadow-lg select-none">{value}</span>
            </div>
            <div className="w-10 mx-auto border-b-2 border-gray-200 dark:border-gray-700 opacity-60 rounded-full" />
          </div>
          <div className={`rounded-full p-3 shadow-md ${color} bg-opacity-90 flex items-center justify-center ml-2`}>
            <Icon className="h-6 w-6 text-white opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}