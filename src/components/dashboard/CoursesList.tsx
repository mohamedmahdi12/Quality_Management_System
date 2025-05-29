import { useEffect, useState } from 'react';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { fetchCourses } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface Course {
  id: string;
  title: string;
  code: string;
  level: number;
  semester: number;
  credit_hours: number;
  department: string;
}

export function CoursesList() {
  const { selectedYear } = useAcademicYear();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadCourses = async () => {
      if (!selectedYear) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchCourses(selectedYear);
        setCourses(data);
        setError(null);
      } catch (err) {
        setError(t('Failed to load courses'));
        console.error(t('Error loading courses'), err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [selectedYear]);

  if (!selectedYear) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t('Please select an academic year to view courses')}
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">{t('Loading courses...')}</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t('No courses found for the selected academic year')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>{t('Code')}:</strong> {course.code}</p>
              <p><strong>{t('Level')}:</strong> {course.level}</p>
              <p><strong>{t('Semester')}:</strong> {course.semester}</p>
              <p><strong>{t('Credit Hours')}:</strong> {course.credit_hours}</p>
              <p><strong>{t('Department')}:</strong> {course.department}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 