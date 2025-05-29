"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';
import { Plus, Search, ClipboardList, Filter, Calendar } from 'lucide-react';
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
import StandardForm from '@/components/forms/StandardForm';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAcademicYear } from '../../../src/contexts/AcademicYearContext';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Standards() {
  const { apiClient, user } = useAuth();
  const { t } = useTranslation();
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeYear, setActiveYear] = useState(null);
  const [academicYearTitle, setAcademicYearTitle] = useState('');
  
  const isAdmin = user?.role === 'ADMIN';
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get('year');
  
  const noAcademicYearSelected = !yearFromUrl;
  
  const { selectedYear, setSelectedYear } = useAcademicYear();
  
  const fetchStandards = async () => {
    try {
      setLoading(true);
      
      let url = `/standards/?page=${page}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (yearFromUrl) url += `&academic_year=${yearFromUrl}`;
      
      const response = await apiClient(url);
      const data = await response.json();
      
      setStandards(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Error fetching standards:', error);
      toast.error('Failed to load standards');
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
  
  useEffect(() => {
    // Redirect to active academic year if no year in URL
    if (!yearFromUrl) {
      apiClient('/academic-years/?status=ACTIVE')
        .then(res => res.json())
        .then(data => {
          const active = data.results?.[0];
          if (active) {
            router.replace(`/dashboard/standards?year=${active.id}`);
          }
        });
    }
    fetchStandards();
    fetchAcademicYears();
    // عند أول تحميل للصفحة فقط
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'ACADEMIC' || tabParam === 'PRAGMATIC')) {
      setActiveTab(tabParam);
    }
    setYearFilter(yearFromUrl || '');
    apiClient('/academic-years/?status=ACTIVE')
      .then(res => res.json())
      .then(data => setActiveYear(data.results?.[0] || null));
    if (yearFromUrl && yearFromUrl !== selectedYear) {
      setSelectedYear(yearFromUrl);
    }
    async function fetchYear() {
      try {
        const res = await apiClient(`/academic-years/${yearFromUrl}/`);
        if (res.ok) {
          const data = await res.json();
          setAcademicYearTitle(`${data.start_date} - ${data.end_date}`);
        }
      } catch {}
    }
    if (yearFromUrl) fetchYear();
    // eslint-disable-next-line
  }, [page, searchQuery, typeFilter, yearFilter, searchParams]);
  
  // تحديث progress bar تلقائيًا عند أي تغيير في المرفقات أو العناصر
  useEffect(() => {
    const handleRefresh = (e) => {
      if (!e.key || e.key === 'refreshStandards') {
        fetchStandards();
      }
    };
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('refreshStandards', handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('refreshStandards', handleRefresh);
    };
  }, []);
  
  const handleCreateStandard = async (formData) => {
    if (yearFromUrl) {
      formData.academic_year = yearFromUrl;
    }
    try {
      const response = await apiClient('/standards/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create standard');
      }
      
      toast.success('Standard created successfully');
      setDialogOpen(false);
      fetchStandards();
    } catch (error) {
      console.error('Error creating standard:', error);
      toast.error(error.message || 'Failed to create standard');
    }
  };
  
  const handleUpdateStandard = async (formData) => {
    if (yearFromUrl) {
      formData.academic_year = yearFromUrl;
    }
    try {
      const response = await apiClient(`/standards/${editingStandard.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update standard');
      }
      
      toast.success('Standard updated successfully');
      setDialogOpen(false);
      setEditingStandard(null);
      fetchStandards();
    } catch (error) {
      console.error('Error updating standard:', error);
      toast.error(error.message || 'Failed to update standard');
    }
  };
  
  const handleDeleteStandard = async (id) => {
    if (!confirm(t('Are you sure you want to delete this standard?'))) {
      return;
    }
    
    try {
      let url = `/standards/${id}/`;
      if (yearFromUrl) url += `?academic_year=${yearFromUrl}`;
      const response = await apiClient(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(t('Failed to delete standard'));
      }
      
      toast.success(t('Standard deleted successfully'));
      fetchStandards();
    } catch (error) {
      console.error('Error deleting standard:', error);
      toast.error(error.message || t('Failed to delete standard'));
    }
  };
  
  const handleEdit = (standard) => {
    setEditingStandard(standard);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStandard(null);
  };

  const resetFilters = () => {
    setTypeFilter('');
    setYearFilter('');
    setSearchQuery('');
  };
  
  const filteredStandards = activeTab === "ALL"
    ? standards
    : standards.filter(s => s.type === activeTab);
  const sortedStandards = [...filteredStandards].sort((a, b) => a.id - b.id);
  
  return (
    <div className="space-y-6 dark:bg-gray-900 dark:text-gray-100 p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{t('Standards')}</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {t('Manage quality standards for academic and pragmatic assessment')}
          </p>
        </div>
        
        {!noAcademicYearSelected && isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingStandard(null)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Add Standard')}
              </Button>
            </DialogTrigger>
            <DialogContent className="md:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStandard ? t('Edit Standard') : t('Add New Standard')}
                </DialogTitle>
              </DialogHeader>
              <StandardForm 
                initialData={editingStandard}
                onSubmit={editingStandard ? handleUpdateStandard : handleCreateStandard}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search standards by title...')}
            className="pl-8 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                {((typeFilter || yearFilter) ? t('{{count}} Filter(s)', { count: (typeFilter ? 1 : 0) + (yearFilter ? 1 : 0) }) : t('Filter'))}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <DropdownMenuLabel>{t('Standard Type')}</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTypeFilter('')} className="dark:hover:bg-gray-700">
                  {t('All Types')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('ACADEMIC')} className="dark:hover:bg-gray-700">
                  {t('Institutional Accreditation Standards')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('PRAGMATIC')} className="dark:hover:bg-gray-700">
                  {t('Program Accreditation Standards')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>{t('Academic Year')}</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleYearChange('')} className="dark:hover:bg-gray-700">
                  {t('All Years')}
                </DropdownMenuItem>
                {academicYears.map(year => (
                  <DropdownMenuItem 
                    key={year.id} 
                    onClick={() => handleYearChange(year.id)}
                    className="dark:hover:bg-gray-700"
                  >
                    {format(new Date(year.start_date), 'yyyy')}-{format(new Date(year.end_date), 'yyyy')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center dark:hover:bg-gray-700 dark:hover:text-gray-100"
                onClick={resetFilters}
              >
                {t('Reset Filters')}
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4 dark:text-gray-100">
        <button
          className={`px-4 py-2 rounded ${activeTab === "ALL" ? "bg-black text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"}`}
          onClick={() => setActiveTab("ALL")}
        >
          {t('All')}
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "ACADEMIC" ? "bg-black text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"}`}
          onClick={() => setActiveTab("ACADEMIC")}
        >
          {t('Institutional Accreditation Standards')}
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "PRAGMATIC" ? "bg-black text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"}`}
          onClick={() => setActiveTab("PRAGMATIC")}
        >
          {t('Program Accreditation Standards')}
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !Array.isArray(sortedStandards) || sortedStandards.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t('No standards found')}
          description={t('No standards match your search criteria.')}
          action={
            isAdmin && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Add Standard')}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStandards.map((standard, idx) => (
            <Card key={standard.id} className={`overflow-hidden cursor-pointer hover:shadow-2xl transition ${activeYear && yearFromUrl === activeYear.id ? 'border-4 border-primary shadow-xl scale-105' : 'border-2 border-gray-200 dark:border-gray-700'} bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800`} onClick={() => router.push(`/dashboard/standards/${standard.id}/indicators?year=${yearFromUrl}`)}>
              <div className="flex flex-col items-center p-6 pb-3">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold shadow mb-3">
                  {idx + 1}
                </div>
                <CardTitle className="text-center w-full font-bold text-lg mb-2 card-title-clamp">{standard.title}</CardTitle>
                <Badge
                  className={
                    standard.type === 'PRAGMATIC'
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white border-0 shadow mb-2'
                      : standard.type === 'ACADEMIC'
                        ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 text-white border-0 shadow mb-2'
                        : 'mb-2'
                  }
                  variant={standard.type === 'ACADEMIC' ? 'default' : 'secondary'}
                >
                  {standard.type === 'ACADEMIC' ? t('Institutional Accreditation Standards') : t('Program Accreditation Standards')}
                </Badge>
                <CardDescription className="mb-2 text-center dark:text-gray-400">
                  {t('Created on')} {format(new Date(standard.created_at), 'MMM d, yyyy')}
                </CardDescription>
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-1 dark:text-gray-300">{t('Assigned Users')}</h4>
                  <div className="flex justify-center -space-x-2 overflow-hidden mb-2">
                      {standard.assigned_to.length > 0 ? (
                        <>
                          {standard.assigned_to.slice(0, 5).map((user) => (
                            <Avatar key={user.id} className="border-2 border-background dark:border-gray-900">
                              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              <AvatarImage src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} />
                            </Avatar>
                          ))}
                          {standard.assigned_to.length > 5 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium dark:bg-gray-600 dark:text-gray-300">
                              +{standard.assigned_to.length - 5}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground dark:text-gray-400">{t('No users assigned')}</span>
                      )}
                    </div>
                  </div>
                <div className="w-full mt-4">
                  <div className="flex justify-between text-sm font-medium mb-1 text-gray-700">
                    <span>{t('Attachments Progress')}</span>
                    <span>
                      {standard.n_of_attachments_uploaded} / {standard.n_of_attachments}
                      {standard.n_of_attachments > 0 && standard.n_of_attachments_uploaded === standard.n_of_attachments && (
                        <span className="ml-1 text-green-600">({t('Completed')})</span>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={standard.n_of_attachments > 0 ? (standard.n_of_attachments_uploaded / standard.n_of_attachments) * 100 : 0}
                    className="w-full bg-gray-700 h-2.5 [&>div]:bg-green-500"
                  />
                </div>
              {(isAdmin || (standard.assigned_to.some(u => u.id === user?.id) && user?.role !== 'TA')) && (
                  <div className="flex justify-between w-full mt-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleEdit(standard); }}>
                      {t('Edit')}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={e => { e.stopPropagation(); handleDeleteStandard(standard.id); }}
                    >
                      {t('Delete')}
                    </Button>
                  </div>
              )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination removed as requested */}
    </div>
  );
}