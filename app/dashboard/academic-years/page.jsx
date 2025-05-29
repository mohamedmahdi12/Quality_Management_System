"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';
import { Plus, Search, Calendar, CalendarDays, Star, Download, BarChart2, FileText, Users, Filter } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/shared/Pagination';
import EmptyState from '@/components/shared/EmptyState';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AcademicYears() {
  const { apiClient, user } = useAuth();
  const { t } = useTranslation();
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [addMode, setAddMode] = useState('empty');
  const [allYears, setAllYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [formErrors, setFormErrors] = useState({});
  const [activeYear, setActiveYear] = useState(null);
  const [creating, setCreating] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [exporting, setExporting] = useState(false);
  
  const isAdmin = user?.role === 'ADMIN';
  
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      
      let url = `/academic-years/?page=${page}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await apiClient(url);
      const data = await response.json();
      
      setAcademicYears(data.results);
      setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 items per page

      // جلب السنة النشطة بعد كل تحديث
      const activeRes = await apiClient('/academic-years/?status=ACTIVE');
      const activeData = await activeRes.json();
      setActiveYear(activeData.results?.[0] || null);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error(t('Failed to load academic years'));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStatistics = async (yearId) => {
    try {
      const response = await apiClient(`/academic-years/${yearId}/statistics/`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(prevStats => ({
        ...prevStats,
        [yearId]: data,
      }));
    } catch (error) {
      console.error(`Error fetching statistics for ${yearId}:`, error);
      setStatistics(prevStats => ({
        ...prevStats,
        [yearId]: { error: true }, // Mark as error or load failed
      }));
    }
  };
  
  useEffect(() => {
    fetchAcademicYears();
  }, [page, searchQuery, statusFilter]);
  
  useEffect(() => {
    if (dialogOpen) {
      apiClient('/academic-years/?page_size=1000').then(res => res.json()).then(data => setAllYears(data.results || []));
      setAddMode('empty');
      setSelectedYear('');
      setFormErrors({});
      if (!editingYear) {
        setStartDate('');
        setEndDate('');
        setStatus('ACTIVE');
      }
    }
  }, [dialogOpen]);
  
  useEffect(() => {
    if (academicYears.length > 0) {
      academicYears.forEach(year => {
        if (!statistics[year.id]) {
          fetchStatistics(year.id);
        }
      });
    }
  }, [academicYears, apiClient, statistics]);
  
  const handleAddOrEditYear = async (e) => {
    e.preventDefault();
    // Prevent multiple active years
    if (status === 'ACTIVE' && activeYear && (!editingYear || editingYear.status !== 'ACTIVE')) {
      toast.error(t('There is already an active academic year. Please archive it first.'));
      return;
    }
    if (!validateForm()) return;
    setCreating(true);
    const body = {
      status,
      start_date: startDate,
      end_date: endDate,
    };
    if (addMode === 'copy' && selectedYear && !editingYear) {
      body.copy_from_year = selectedYear;
    }
    try {
      let res;
      if (editingYear) {
        // تعديل سنة أكاديمية
        res = await apiClient(`/academic-years/${editingYear.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        // إضافة سنة أكاديمية جديدة
        res = await apiClient('/academic-years/create_new_year/', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('Failed to save academic year'));
      }
      toast.success(editingYear ? t('Academic year updated successfully') : t('Academic year created successfully'));
      setDialogOpen(false);
      setEditingYear(null);
      fetchAcademicYears();
    } catch (error) {
      toast.error(error.message || t('Failed to save academic year'));
    } finally {
      setCreating(false);
    }
  };
  
  const handleStatusToggle = async (year) => {
    try {
      const newStatus = year.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      const response = await apiClient(`/academic-years/${year.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      let errorMsg = '';
      if (!response.ok) {
        const errorData = await response.json();
        errorMsg = errorData.detail || 'Failed to update status';
        throw new Error(errorMsg);
      }

      toast.success(`Academic year ${newStatus.toLowerCase()}`);
      fetchAcademicYears();
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes('active academic year')) {
        toast.error('There is already an active academic year. Please archive it first.');
      } else {
        toast.error(error.message || 'Failed to update status');
      }
    }
  };
  
  const handleEdit = (year) => {
    setEditingYear(year);
    setStartDate(year.start_date ? year.start_date.slice(0, 10) : '');
    setEndDate(year.end_date ? year.end_date.slice(0, 10) : '');
    setStatus(year.status);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingYear(null);
  };
  
  const validateForm = () => {
    const errors = {};
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) errors.endDate = 'End date must be after start date';
    if (addMode === 'copy' && !selectedYear) errors.selectedYear = 'Please select a year to copy from';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleDeleteYear = async (year) => {
    if (!window.confirm(t('Are you sure you want to delete the academic year') + ' ' + year.start_date + ' - ' + year.end_date + ' ' + t('and all its data?'))) {
      return;
    }
    try {
      const response = await apiClient(`/academic-years/${year.id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('Failed to delete academic year'));
      }
      toast.success(t('Academic year deleted successfully'));
      fetchAcademicYears();
    } catch (error) {
      toast.error(error.message || t('Failed to delete academic year'));
    }
  };
  
  const handleExportYear = async (yearId) => {
    setExporting(true);
    try {
      const response = await apiClient(`/academic-years/${yearId}/export/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academic-year-${yearId}-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('Export completed successfully'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('Failed to export data'));
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div className="space-y-6 dark:bg-gray-900 dark:text-gray-100 p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{t('Academic Years')}</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {t('Manage your institution\'s academic years and track their progress')}
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingYear(null)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Add Academic Year')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingYear ? t('Edit Academic Year') : t('Add New Academic Year')}</DialogTitle>
                <DialogDescription>
                  {t('Choose the type of the new academic year: Empty or Copy from a previous year (structure only, without uploaded files)')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrEditYear} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={addMode === 'empty'} onChange={() => setAddMode('empty')} />
                    {t('Empty Year')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={addMode === 'copy'} onChange={() => setAddMode('copy')} />
                    {t('Copy from Previous Year')}
                  </label>
                </div>
                {addMode === 'copy' && (
                  <div>
                    <Label htmlFor="copy_from_year">{t('Select Previous Year')}</Label>
                    <select
                      id="copy_from_year"
                      className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      required
                    >
                      <option value="">Select a year</option>
                      {allYears.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.start_date} - {y.end_date}
                        </option>
                      ))}
                    </select>
                    {formErrors.selectedYear && <p className="text-sm text-destructive dark:text-red-400">{formErrors.selectedYear}</p>}
                  </div>
                )}
                <div>
                  <Label htmlFor="start_date">{t('Start Date')}</Label>
                  <input
                    id="start_date"
                    type="date"
                    className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                  {formErrors.startDate && <p className="text-sm text-destructive dark:text-red-400">{formErrors.startDate}</p>}
                </div>
                <div>
                  <Label htmlFor="end_date">{t('End Date')}</Label>
                  <input
                    id="end_date"
                    type="date"
                    className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                  {formErrors.endDate && <p className="text-sm text-destructive dark:text-red-400">{formErrors.endDate}</p>}
                </div>
                <div>
                  <Label htmlFor="status">{t('Status')}</Label>
                  <select
                    id="status"
                    className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">{t('Active')}</option>
                    <option value="ARCHIVED">{t('Archived')}</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingYear(null); }}>
                    {t('Cancel')}
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? t(editingYear ? 'Saving...' : 'Creating...') : t(editingYear ? 'Save' : 'Create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search academic years...')}
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
                {statusFilter ? t('Filtered') : t('Filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <DropdownMenuLabel>{t('Status')}</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setStatusFilter('')} className="dark:hover:bg-gray-700">
                  {t('All')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')} className="dark:hover:bg-gray-700">
                  {t('Active')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ARCHIVED')} className="dark:hover:bg-gray-700">
                  {t('Archived')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center dark:hover:bg-gray-700 dark:hover:text-gray-100"
                onClick={() => setStatusFilter('')}
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
      ) : academicYears.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t('No academic years found')}
          description={t('No academic years match your search criteria.')}
          action={
            isAdmin && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Add Academic Year')}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {academicYears.map((year) => (
            <Card
              key={year.id}
              className={`overflow-hidden cursor-pointer hover:shadow-lg transition ${
                activeYear && year.id === activeYear.id
                  ? 'border-4 border-primary shadow-xl scale-105'
                  : 'border-2 border-gray-200'
              } bg-white dark:bg-gray-900 group`}
              onClick={(e) => {
                // Navigate to the details page when the card body is clicked
                // Clicks on buttons are stopped by e.stopPropagation() on the buttons themselves
                window.location.href = `/dashboard/academic-years/${year.id}`;
              }}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {format(new Date(year.start_date), 'yyyy')}-{format(new Date(year.end_date), 'yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {t('Created on')} {format(new Date(year.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                {activeYear && year.id === activeYear.id && (
                  <div className="flex items-center gap-1">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-lg font-bold text-xs ml-1">
                      {t('ACTIVE')}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">{t('Start')}:</span>
                    {format(new Date(year.start_date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">{t('End')}:</span>
                    {format(new Date(year.end_date), 'MMM d, yyyy')}
                  </div>
                  
                  {/* Statistics Section */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('Standards Progress')}</span>
                      <span className="font-medium">
                        {statistics[year.id]?.n_of_completed_standards || 0} / {statistics[year.id]?.n_of_standards || 0}
                      </span>
                    </div>
                    <Progress 
                      value={statistics[year.id]?.n_of_standards > 0 ? ((statistics[year.id]?.n_of_completed_standards || 0) / statistics[year.id]?.n_of_standards) * 100 : 0} 
                      className="h-2 dark:bg-gray-700"
                    />
                    
                    {/* <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {statistics[year.id]?.n_of_completed_courses || 0} / {statistics[year.id]?.n_of_courses || 0}
                      </span>
                    </div> */}

                    {/* Courses Progress Section */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('Courses Progress')}</span>
                        <span className="font-medium">
                          {statistics[year.id]?.n_of_completed_courses || 0} / {statistics[year.id]?.n_of_courses || 0}
                        </span>
                      </div>
                      <Progress
                        value={statistics[year.id]?.n_of_courses > 0 ? ((statistics[year.id]?.n_of_completed_courses || 0) / statistics[year.id]?.n_of_courses) * 100 : 0}
                        className="h-2 dark:bg-gray-700"
                      />
                    </div>

                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 px-6 py-3 flex gap-2 dark:bg-gray-800">
                <Button
                  variant="secondary"
                  size="sm"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  onClick={e => {
                    e.stopPropagation();
                    window.location.href = `/dashboard/academic-years/${year.id}`;
                  }}
                >
                  {t('View Details')}
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleEdit(year);
                      }}
                    >
                      {t('Edit')}
                    </Button>
                    {year.status === 'ACTIVE' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleStatusToggle(year);
                        }}
                      >
                        {t('Archive')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleStatusToggle(year);
                        }}
                        disabled={!!activeYear && activeYear.id !== year.id}
                      >
                        {t('Activate')}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteYear(year);
                      }}
                    >
                      {t('Delete')}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="dark:bg-gray-900 dark:text-gray-100"
        />
      )}
    </div>
  );
}