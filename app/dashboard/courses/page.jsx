"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';
import { Plus, Search, BookOpen, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/shared/Pagination';
import EmptyState from '@/components/shared/EmptyState';
import CourseForm from '@/components/forms/CourseForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAcademicYear } from '../../../src/contexts/AcademicYearContext';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

export default function Courses() {
  const { apiClient, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [activeYear, setActiveYear] = useState(null);
  
  const isAdmin = user?.role === 'ADMIN';
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const yearFromUrl = searchParams.get('year');
  
  const { selectedYear, setSelectedYear } = useAcademicYear();
  
  const isArabic = i18n.language === 'ar';
  
  const academicYearId = useSearchParams().get('year');
  const [academicYearTitle, setAcademicYearTitle] = useState('');
  useEffect(() => {
    async function fetchYear() {
      try {
        const res = await apiClient(`/academic-years/${academicYearId}/`);
        if (res.ok) {
          const data = await res.json();
          setAcademicYearTitle(`${data.start_date} - ${data.end_date}`);
        }
      } catch {}
    }
    if (academicYearId) fetchYear();
  }, [academicYearId, apiClient]);
  
  const fetchCourses = async () => {
    try {
      setLoading(true);
      if (page < 1) {
        setPage(1);
        return;
      }
      let url = `/courses/?page=${page}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (levelFilter) url += `&level=${levelFilter}`;
      if (semesterFilter) url += `&semester=${semesterFilter}`;
      if (yearFromUrl) url += `&academic_year=${yearFromUrl}`;
      const response = await apiClient(url);
      if (!response.ok) {
        if (response.status === 404) {
          setPage(1);
          toast.error('Page not found. Returning to first page.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const calculatedTotalPages = Math.ceil(data.count / 10);
      if (page > calculatedTotalPages && calculatedTotalPages > 0) {
        setPage(calculatedTotalPages);
        toast.error('Page number exceeded total pages. Returning to last page.');
        return;
      }
      setCourses(data.results);
      setTotalPages(calculatedTotalPages);
    } catch (error) {
      toast.error(error.message || 'Failed to load courses');
      setCourses([]);
      if (page !== 1) {
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient('/academic-years/?status=ACTIVE');
      const data = await response.json();
      setAcademicYears(data.results);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };
  
  useEffect(() => {
    fetchCourses();
    fetchAcademicYears();
    if (yearFromUrl && yearFromUrl !== selectedYear) {
      setSelectedYear(yearFromUrl);
    }
    // عند أول تحميل للصفحة فقط
    const yearParam = searchParams.get('year');
    setYearFilter(yearParam || '');
    apiClient('/academic-years/?status=ACTIVE')
      .then(res => res.json())
      .then(data => setActiveYear(data.results?.[0] || null));
    // eslint-disable-next-line
  }, [page, searchQuery, yearFilter, levelFilter, semesterFilter, searchParams]);
  
  const handleCreateCourse = async (formData) => {
    if (yearFromUrl) {
      formData.academic_year = yearFromUrl;
    }
    try {
      const response = await apiClient('/courses/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create course');
      }
      
      toast.success('Course created successfully');
      setDialogOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error(error.message || 'Failed to create course');
    }
  };
  
  const handleUpdateCourse = async (formData) => {
    if (yearFromUrl) {
      formData.academic_year = yearFromUrl;
    }
    try {
      const response = await apiClient(`/courses/${editingCourse.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update course');
      }
      
      toast.success('Course updated successfully');
      setDialogOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(error.message || 'Failed to update course');
    }
  };
  
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm(t('Are you sure you want to delete this course?'))) {
      try {
        await deleteCourse(courseId);
        toast.success(t('Course deleted successfully'));
        fetchCourses();
      } catch (error) {
        toast.error(t('Failed to delete course'));
      }
    }
  };
  
  const handleEdit = (course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
  };

  const resetFilters = () => {
    setYearFilter('');
    setLevelFilter('');
    setSemesterFilter('');
    setSearchQuery('');
  };

  const getCreditHoursLabel = (hours) => {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };
  
  // واجهة اختيار المستوى والتخصص والفصل
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // تحديث الفلاتر عند الاختيار
  useEffect(() => {
    setLevelFilter(selectedLevel);
    setSemesterFilter(selectedSemester);
    if (selectedLevel === '3' || selectedLevel === '4') {
      setLevelFilter(selectedLevel);
      setSemesterFilter(selectedSemester);
      setSearchQuery('');
      if (selectedDepartment) {
        // لو عندك فلترة department في الـ API أضفها هنا
        // مثال: setDepartmentFilter(selectedDepartment)
      }
    } else {
      setSelectedDepartment('');
    }
  }, [selectedLevel, selectedDepartment, selectedSemester]);

  // قائمة الأقسام الثابتة بناءً على الـ API
  const departments = [
    { code: 'AI', name: t('Artificial Intelligence') },
    { code: 'CS', name: t('Computer Science') },
    { code: 'NT', name: t('Network') },
    { code: 'IS', name: t('Information Systems') },
  ];

  // فلترة الكورسات حسب الاختيارات
  const coursesFiltered = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    if ((selectedLevel === '3' || selectedLevel === '4') && (!selectedDepartment || !selectedSemester)) return [];
    if ((selectedLevel === '1' || selectedLevel === '2') && !selectedSemester) return [];
    return courses.filter(course => {
      if (selectedLevel && String(course.level) !== String(selectedLevel)) return false;
      if ((selectedLevel === '3' || selectedLevel === '4') && selectedDepartment && course.department !== selectedDepartment) return false;
      if (selectedSemester && String(course.semester) !== String(selectedSemester)) return false;
      return true;
    });
  }, [courses, selectedLevel, selectedDepartment, selectedSemester]);
  
  const handleYearChange = (yearId) => {
    setYearFilter(yearId);
    const params = new URLSearchParams(window.location.search);
    if (yearId) {
      params.set('year', yearId);
    } else {
      params.delete('year');
    }
    router.replace(`?${params.toString()}`, undefined, { shallow: true });
  };
  
  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className={isArabic ? 'text-right' : ''} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t('Courses')}</h1>
            <p className="text-muted-foreground">
              {t('Manage academic courses offered by your institution')}
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCourse(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('Add Course')}
                </Button>
              </DialogTrigger>
              <DialogContent className="md:max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? t('Edit Course') : t('Add New Course')}
                  </DialogTitle>
                </DialogHeader>
                
                <CourseForm 
                  initialData={editingCourse}
                  onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
                  onCancel={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block mb-1 font-medium">{t('Level')}</label>
            <select className="border rounded px-3 py-2" value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedDepartment(''); setSelectedSemester(''); }}>
              <option value="">{t('Select Level')}</option>
              <option value="1">{t('Level 1')}</option>
              <option value="2">{t('Level 2')}</option>
              <option value="3">{t('Level 3')}</option>
              <option value="4">{t('Level 4')}</option>
            </select>
          </div>
          {(selectedLevel === '3' || selectedLevel === '4') && (
            <div>
              <label className="block mb-1 font-medium">{t('Department')}</label>
              <select className="border rounded px-3 py-2" value={selectedDepartment} onChange={e => { setSelectedDepartment(e.target.value); setSelectedSemester(''); }}>
                <option value="">{t('Select Department')}</option>
                {departments.map(dep => (
                  <option key={dep.code} value={dep.code}>{dep.name}</option>
                ))}
              </select>
            </div>
          )}
          {((selectedLevel && (selectedLevel === '1' || selectedLevel === '2')) || ((selectedLevel === '3' || selectedLevel === '4') && selectedDepartment)) && (
            <div>
              <label className="block mb-1 font-medium">{t('Semester')}</label>
              <select className="border rounded px-3 py-2" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="">{t('Select Semester')}</option>
                <option value="1">{t('Semester 1')}</option>
                <option value="2">{t('Semester 2')}</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search courses by title or code')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {t('Filter')}
                  {(yearFilter || levelFilter || semesterFilter) && (
                    <Badge variant="secondary" className="ml-2 px-1">
                      {(yearFilter ? 1 : 0) + (levelFilter ? 1 : 0) + (semesterFilter ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{t('Academic Year')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleYearChange('')}>
                    {t('All Years')}
                  </DropdownMenuItem>
                  {academicYears.map(year => (
                    <DropdownMenuItem 
                      key={year.id} 
                      onClick={() => handleYearChange(year.id)}
                    >
                      {format(new Date(year.start_date), 'yyyy')}-{format(new Date(year.end_date), 'yyyy')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>{t('Level')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setLevelFilter('')}>
                    {t('All Levels')}
                  </DropdownMenuItem>
                  {[1, 2, 3, 4].map(level => (
                    <DropdownMenuItem 
                      key={level} 
                      onClick={() => setLevelFilter(level)}
                    >
                      {t('Level')} {level}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>{t('Semester')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setSemesterFilter('')}>
                    {t('All Semesters')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSemesterFilter(1)}>
                    {t('Semester')} 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSemesterFilter(2)}>
                    {t('Semester')} 2
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-center"
                  onClick={resetFilters}
                >
                  {t('Reset Filters')}
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : coursesFiltered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('No courses found')}
            description={t('No courses match your filters.')}
            action={
              isAdmin && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('Add Course')}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesFiltered.map((course) => (
              <Card key={course.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
                <CardHeader className="pb-3 ">
                  <div className="flex justify-between items-start ">
                    <div>
                      <CardTitle className="course-title-clamp ">{course.title}</CardTitle>
                      <CardDescription>
                        {t('Code:')} {course.code}
                      </CardDescription>
                    </div>
                    <Badge className="px-2 py-1 ">
                      {t('Level')} {course.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('Semester:')}</span> {course.semester}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('Credits:')}</span> {getCreditHoursLabel(course.credit_hours)}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-1.5">{t('Professor')}</h4>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>
                            {(course.professor?.username || "??").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {course.professor?.username || t('No Professor')}
                        </span>
                      </div>
                    </div>
                    <div className="w-full mt-4">
                      <div className="flex justify-between text-sm font-medium mb-1 text-gray-700">
                        <span>{t('Course Files Progress')}</span>
                        <span>
                          {course.n_of_course_files_uploaded} / {course.n_of_course_files}
                          {course.n_of_course_files > 0 && course.n_of_course_files_uploaded === course.n_of_course_files && (
                            <span className="ml-1 text-green-600">({t('Completed')})</span>
                          )}
                        </span>
                      </div>
                      <Progress
                        value={course.n_of_course_files > 0 ? (course.n_of_course_files_uploaded / course.n_of_course_files) * 100 : 0}
                        className="w-full bg-gray-200 h-2.5 [&>div]:bg-green-500"
                      />
                    </div>
                  </div>
                </CardContent>
                {user?.role === 'ADMIN' && (
                  <CardFooter className="bg-muted/50 px-6 py-3">
                    <div className="flex justify-between w-full">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleEdit(course); }}>
                        {t('Edit')}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={e => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                      >
                        {t('Delete')}
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}