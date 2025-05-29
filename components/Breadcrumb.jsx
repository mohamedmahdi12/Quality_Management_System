import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useTranslation } from 'react-i18next';

// Helper: تحقق إذا كان النص UUID
function isUUID(str) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

// Helper: جلب اسم الكيان المناسب بناءً على نوعه مع دعم الكاش في localStorage
async function fetchLabelForSegment({ segment, prevSegment, apiClient }) {
  const cacheKey = `entityLabel:${prevSegment}:${segment}`;
  // جرب الكاش من localStorage أولاً
  if (typeof window !== 'undefined') {
    const cachedLabel = localStorage.getItem(cacheKey);
    if (cachedLabel) return cachedLabel;
  }
  try {
    let label = null;
    if (prevSegment === 'standards' && isUUID(segment)) {
      const res = await apiClient(`/standards/${segment}/`);
      if (res.ok) {
        const data = await res.json();
        label = data.title || data.name || null;
      }
    }
    if (prevSegment === 'courses' && isUUID(segment)) {
      const res = await apiClient(`/courses/${segment}/`);
      if (res.ok) {
        const data = await res.json();
        label = data.title || data.name || null;
      }
    }
    if ((prevSegment === 'indicators' || prevSegment === 'pointers') && isUUID(segment)) {
      const res = await apiClient(`/indicators/${segment}/`);
      if (res.ok) {
        const data = await res.json();
        label = data.title || data.name || null;
      }
    }
    if (prevSegment === 'academic-years' && isUUID(segment)) {
      const res = await apiClient(`/academic-years/${segment}/`);
      if (res.ok) {
        const data = await res.json();
        if (data.start_date && data.end_date) {
          label = `${data.start_date} - ${data.end_date}`;
        } else {
          label = data.title || data.name || null;
        }
      }
    }
    // خزّن في الكاش إذا وجد اسم
    if (label && typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, label);
    }
    return label;
  } catch {}
  return null;
}

// قاموس الترجمة للعناصر الثابتة
const staticLabels = {
  dashboard: {
    en: 'Dashboard',
    ar: 'الرئيسية',
  },
  'academic-years': {
    en: 'Academic Years',
    ar: 'السنوات الأكاديمية',
  },
  standards: {
    en: 'Standards',
    ar: 'المعايير',
  },
  courses: {
    en: 'Courses',
    ar: 'المقررات',
  },
  indicators: {
    en: 'Indicators',
    ar: 'المؤشرات',
  },
  users: {
    en: 'Users',
    ar: 'المستخدمون',
  },
  structure: {
    en: 'Structure',
    ar: 'الهيكل',
  },
  requests: {
    en: 'Requests',
    ar: 'الطلبات',
  },
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get('year');
  const { apiClient } = useAuth();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [labelsCache, setLabelsCache] = useState({});

  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const items = [];
    let currentPath = '';
    // Dashboard
    items.push({ label: staticLabels.dashboard[lang], href: '/dashboard' });

    // --- إضافة صفحة تفاصيل السنة الأكاديمية في الـ breadcrumb ---
    let academicYearId = null;
    let academicYearsIndex = pathSegments.findIndex(seg => seg === 'academic-years');
    if (academicYearsIndex !== -1 && isUUID(pathSegments[academicYearsIndex + 1])) {
      academicYearId = pathSegments[academicYearsIndex + 1];
    } else if (yearFromUrl && isUUID(yearFromUrl)) {
      academicYearId = yearFromUrl;
    }
    // Academic Years
    items.push({ label: staticLabels['academic-years'][lang], href: '/dashboard/academic-years' });
    let academicYearLabel = null;
    if (academicYearId) {
      if (labelsCache[academicYearId]) {
        academicYearLabel = labelsCache[academicYearId];
      } else {
        // جرب الكاش من localStorage أولاً
        let cacheKey = `entityLabel:academic-years:${academicYearId}`;
        let cachedLabel = null;
        if (typeof window !== 'undefined') {
          cachedLabel = localStorage.getItem(cacheKey);
        }
        if (cachedLabel) {
          academicYearLabel = cachedLabel;
        } else {
          (async () => {
            const res = await apiClient(`/academic-years/${academicYearId}/`);
            if (res.ok) {
              const data = await res.json();
              let label = (data.start_date && data.end_date) ? `${data.start_date} - ${data.end_date}` : (data.title || data.name || null);
              setLabelsCache(prev => ({ ...prev, [academicYearId]: label }));
              if (label && typeof window !== 'undefined') {
                localStorage.setItem(cacheKey, label);
              }
              setBreadcrumbs(prev => prev.map(b => b.href === `/dashboard/academic-years/${academicYearId}` ? { ...b, label } : b));
            }
          })();
          academicYearLabel = null;
        }
      }
      items.push({ label: academicYearLabel, href: `/dashboard/academic-years/${academicYearId}` });
    }
    // --- نهاية إضافة صفحة تفاصيل السنة الأكاديمية ---

    // أكمل باقي الـ breadcrumb كالمعتاد
    let prevSegment = '';
    let afterAcademicYear = !!academicYearId;
    let foundStandard = false;
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      if (segment === 'dashboard' || segment === 'academic-years' || (academicYearId && segment === academicYearId)) {
        prevSegment = segment;
        continue;
      }
      // ترجمة العناصر الثابتة
      let label = staticLabels[segment]?.[lang] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (isUUID(segment)) {
        if (labelsCache[segment]) {
          label = labelsCache[segment];
        } else {
          // جرب الكاش من localStorage أولاً
          let cacheKey = `entityLabel:${prevSegment}:${segment}`;
          let cachedLabel = null;
          if (typeof window !== 'undefined') {
            cachedLabel = localStorage.getItem(cacheKey);
          }
          if (cachedLabel) {
            label = cachedLabel;
            setLabelsCache(prev => ({ ...prev, [segment]: cachedLabel }));
          } else {
            label = '...';
            (async () => {
              const fetchedLabel = await fetchLabelForSegment({ segment, prevSegment, apiClient });
              if (fetchedLabel) {
                setLabelsCache(prev => ({ ...prev, [segment]: fetchedLabel }));
                setBreadcrumbs(prev => prev.map(b => b.href === currentPath ? { ...b, label: fetchedLabel } : b));
              }
            })();
          }
        }
      }
      let href = currentPath;
      if (academicYearId && afterAcademicYear) {
        href = `${currentPath}?year=${academicYearId}`;
      }
      items.push({ label, href });
      // إذا كان هذا هو معيار (standard) أوقف هنا
      if (prevSegment === 'standards' && isUUID(segment)) {
        foundStandard = true;
        break;
      }
      prevSegment = segment;
      afterAcademicYear = afterAcademicYear || (segment === academicYearId);
    }
    setBreadcrumbs(items);
    // eslint-disable-next-line
  }, [pathname, yearFromUrl, i18n.language]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="text-sm my-4" aria-label="breadcrumb">
      <ol className="flex flex-wrap gap-1 items-center">
        {breadcrumbs.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href && idx < breadcrumbs.length - 1 ? (
              <Link 
                href={item.href} 
                className="text-blue-600 hover:underline"
              >
                {item.label || '...'}
              </Link>
            ) : (
              <span className="text-gray-500">{item.label || '...'}</span>
            )}
            {idx < breadcrumbs.length - 1 && (
              <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 