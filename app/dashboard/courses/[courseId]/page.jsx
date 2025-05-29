"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { FileText, Pencil, Trash, Plus, X, Upload, Download, Eye } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Tooltip } from '@radix-ui/react-tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// API base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// قائمة عناوين الملفات الثابتة
const COURSE_FILE_TITLES = [
  'Course Specification',
  'Course Report',
  'Course Syllabus',
  'Course Plan',
  'Course Materials',
  'Course Assessment',
  'Course Evaluation',
  'Course Improvement Plan'
];

// أضف الدالة أعلى الكومبوننت
const downloadAttachment = async (attachmentId, filename, token, yearFilter) => {
  try {
    let downloadUrl = `${API_BASE_URL}/course-attachments/${attachmentId}/download/`;
    if (yearFilter) downloadUrl += `?academic_year=${yearFilter}`;
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      alert('Download failed');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Download failed');
  }
};

export default function CourseFilesPage() {
  const { courseId } = useParams();
  const { apiClient, tokens, user } = useAuth();
  const [courseFiles, setCourseFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFileTitle, setSelectedFileTitle] = useState('');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddTitleModal, setShowAddTitleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [addingTitle, setAddingTitle] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [editTitleModal, setEditTitleModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [course, setCourse] = useState(null);
  const { t } = useTranslation();
  const [selectedFileName, setSelectedFileName] = useState('');

  useEffect(() => {
    fetchCourseFiles();
    async function fetchCourse() {
      try {
        let url = `/courses/${courseId}/`;
        if (yearFilter) url += `?academic_year=${yearFilter}`;
        const res = await apiClient(url);
        if (res.ok) {
          const data = await res.json();
          setCourseTitle(data.title);
          setCourse(data);
        }
      } catch (error) {
        setCourseTitle('');
      }
    }
    if (courseId) fetchCourse();
    // eslint-disable-next-line
  }, [courseId, apiClient, yearFilter]);

  useEffect(() => {
    // console.log('courseFiles state:', courseFiles);
  }, [courseFiles]);

  async function fetchCourseFiles() {
    setLoading(true);
    try {
      // Validate courseId format
      if (!courseId || typeof courseId !== 'string' || !courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid course ID format');
      }

      let url = `/course-files/?course=${courseId}`;
      if (yearFilter) url += `&academic_year=${yearFilter}`;

      const res = await apiClient(url);
      
      // If we get a 404 or 400, it means no files exist for this course
      if (res.status === 404 || res.status === 400) {
        setCourseFiles([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const filesWithAttachments = (data.results || []).map(file => ({
        id: file.id,
        title: file.title,
        course: file.course,
        attachments: file.attachments || []
      }));
      setCourseFiles(filesWithAttachments);
    } catch (error) {
      console.error('Error fetching course files:', error);
      if (error.message === 'Invalid course ID format') {
        alert('Invalid course ID. Please check the URL and try again.');
      } else {
      alert('Failed to load course files. Please try again later.');
      }
      setCourseFiles([]);
    } finally {
      setLoading(false);
    }
  }

  function openUploadModal(fileTitle) {
    setSelectedFileTitle(fileTitle);
    setUploadingFile(null);
    setShowUploadModal(true);
  }

  function closeUploadModal() {
    setShowUploadModal(false);
    setSelectedFileTitle('');
    setUploadingFile(null);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadingFile) return;

    setSaving(true);
    try {
      // أولاً، نتأكد من وجود عنوان الملف
      let fileTitle = courseFiles.find(f => f.title.trim().toLowerCase() === selectedFileTitle.trim().toLowerCase());
      let fileId = fileTitle?.id;

      if (!fileId) {
        // إنشاء عنوان ملف جديد إذا لم يكن موجوداً
        const createRes = await apiClient('/course-files/', {
          method: 'POST',
          body: JSON.stringify({
            title: selectedFileTitle,
            course: courseId,
            academic_year: yearFilter
          })
        });

        if (!createRes.ok) {
          throw new Error(`Failed to create file title: ${createRes.status}`);
        }

        const newFile = await createRes.json();
        fileId = newFile.id;
      }

      // رفع الملف
      const formData = new FormData();
      formData.append('file', uploadingFile);
      formData.append('course_file', fileId);
      if (yearFilter) formData.append('academic_year', yearFilter);

      const uploadRes = await apiClient('/course-attachments/', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload file: ${uploadRes.status}`);
      }

      toast.success(t('File uploaded successfully'));
      closeUploadModal();
      fetchCourseFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('Failed to upload file'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAttachment(attachmentId) {
    if (window.confirm(t('Are you sure you want to delete this file?'))) {
      try {
        let url = `/course-attachments/${attachmentId}/`;
        if (yearFilter) url += `?academic_year=${yearFilter}`;
        const res = await apiClient(url, {
          method: 'DELETE'
        });
        
        if (!res.ok) {
          throw new Error(`Failed to delete file: ${res.status}`);
        }
        
        toast.success(t('File deleted successfully'));
        fetchCourseFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error(t('Failed to delete file'));
      }
    }
  }

  async function handleAddTitle(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddingTitle(true);
    try {
      const res = await apiClient('/course-files/', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          course: courseId,
          academic_year: yearFilter
        })
      });
      if (!res.ok) throw new Error('Failed to add new title');
      setShowAddTitleModal(false);
      setNewTitle('');
      fetchCourseFiles();
    } catch (error) {
      alert('Failed to add new title.');
    } finally {
      setAddingTitle(false);
    }
  }

  const handleUpdateCourse = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        code: formData.code,
        level: Number(formData.level),
        semester: Number(formData.semester),
        credit_hours: Number(formData.credit_hours),
        academic_year: formData.academic_year,
        professor_id: formData.professor_id,
        department: formData.department || undefined,
      };
      const res = await apiClient(`/courses/${courseId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update course');
      setEditModalOpen(false);
      fetchCourse();
      fetchCourseFiles();
    } catch (error) {
      alert('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm(t('Are you sure you want to delete this file?'))) {
      try {
        const res = await apiClient(`/course-files/${fileId}/`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete file');
        toast.success(t('File deleted successfully'));
        fetchCourseFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error(t('Failed to delete file'));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center dark:text-gray-100">{courseTitle}</h1>
      {user?.role === 'ADMIN' && (
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={() => setShowAddTitleModal(true)}
        >
          + {t('Add New Title')}
        </button>
      </div>
      )}
      
      {loading ? (
        <div className="text-center py-10 dark:text-gray-300">Loading...</div>
      ) : (
        <Accordion type="multiple" className="bg-white rounded-lg shadow dark:bg-[#23272f] dark:border dark:border-gray-700">
          {courseFiles.map((file) => (
            <AccordionItem key={file.id} value={String(file.id)}>
              <AccordionTrigger className="px-4 py-3 pr-16 hover:bg-gray-50 flex items-center relative dark:hover:bg-[#23272f] dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold dark:text-gray-100">{file.title}</span>
                  </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {user?.role === 'ADMIN' && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="p-1 rounded hover:bg-gray-200 cursor-pointer dark:hover:bg-gray-700"
                    title={t('Edit Title')}
                    onClick={e => {
                      e.stopPropagation();
                      setEditingFile(file);
                      setEditTitle(file.title);
                      setEditTitleModal(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </span>
                  )}
                  {user?.role === 'ADMIN' && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="p-1 rounded hover:bg-gray-200 cursor-pointer dark:hover:bg-gray-700"
                    title={t('Delete Title')}
                    onClick={async e => {
                      e.stopPropagation();
                      if (window.confirm(t('Are you sure you want to delete this title and all its attachments?'))) {
                        try {
                          const res = await apiClient(`/course-files/${file.id}/`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Failed to delete title');
                          fetchCourseFiles();
                        } catch (err) {
                          alert('Failed to delete title.');
                        }
                      }
                    }}
                  >
                    <Trash className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 dark:bg-[#181c2a] dark:text-gray-100">
                <div className="flex justify-end pb-2">
                  {(user?.role === 'ADMIN' || (course?.professor?.id && user?.id === course.professor.id)) && (
                  <button
                    className="ml-4 p-2 rounded-full hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUploadModal(file.title);
                    }}
                    type="button"
                  >
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                  )}
                </div>
                {file.attachments?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 dark:text-gray-300">{t('No files uploaded yet')}</p>
                ) : (
                  <div className="space-y-2">
                    {file.attachments?.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-[#23272f] dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-sm dark:text-gray-200">{attachment.file.split('/').pop()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={() => {
                              const token = tokens?.access;
                              if (!token) {
                                alert('You are not logged in!');
                                return;
                              }
                              downloadAttachment(attachment.id, attachment.file.split('/').pop(), token, yearFilter);
                            }}
                          >
                            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={async () => {
                              const token = tokens?.access;
                              if (!token) {
                                alert('You are not logged in!');
                                return;
                              }
                              let viewUrl = `${API_BASE_URL}/course-attachments/${attachment.id}/download/`;
                              if (yearFilter) viewUrl += `?academic_year=${yearFilter}`;
                              try {
                                const response = await fetch(viewUrl, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  }
                                });
                                if (!response.ok) {
                                  alert('Failed to view file');
                                  return;
                                }
                                const blob = await response.blob();
                                const fileURL = window.URL.createObjectURL(blob);
                                const fileType = attachment.file.split('.').pop().toLowerCase();
                                if ([
                                  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'
                                ].includes(fileType)) {
                                  window.open(fileURL, '_blank');
                                } else {
                                  const proceed = window.confirm('هذا النوع من الملفات قد لا يُعرض مباشرة في المتصفح. هل تريد تحميل الملف؟');
                                  if (proceed) {
                                    window.open(fileURL, '_blank');
                                  }
                                }
                              } catch (err) {
                                alert('Failed to view file');
                              }
                            }}
                            title={t('View')}
                          >
                            <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </button>
                          {(user?.role === 'ADMIN' || (course?.professor?.id && user?.id === course.professor.id)) && (
                          <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Modal for file upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center dark:bg-black/60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative dark:bg-[#23272f] dark:text-gray-100">
            <button className="absolute top-2 right-2 p-1 dark:text-gray-200" onClick={closeUploadModal}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4 dark:text-gray-100">{t('Upload File')}</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium dark:text-gray-200">{t('File Title')}</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-[#181c2a] dark:text-gray-100"
                  value={selectedFileTitle}
                  disabled
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-gray-200">{t('Select File')}</label>
                <div className="flex items-center gap-2">
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      setUploadingFile(e.target.files[0]);
                      setSelectedFileName(e.target.files[0]?.name || '');
                    }}
                    required
                  />
                  <label htmlFor="file-upload" className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100">
                    {t('Choose File')}
                  </label>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedFileName ? selectedFileName : t('No file chosen')}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  onClick={closeUploadModal}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white dark:bg-blue-700"
                  disabled={saving || !uploadingFile}
                >
                  {saving ? t('Uploading...') : t('Upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal لإضافة عنوان جديد */}
      {showAddTitleModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center dark:bg-black/60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative dark:bg-[#23272f] dark:text-gray-100">
            <button className="absolute top-2 right-2 p-1 dark:text-gray-200" onClick={() => setShowAddTitleModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4 dark:text-gray-100">{t('Add New File Title')}</h2>
            <form onSubmit={handleAddTitle} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium dark:text-gray-200">{t('Title')}</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-[#181c2a] dark:text-gray-100"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  onClick={() => setShowAddTitleModal(false)}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white dark:bg-blue-700"
                  disabled={addingTitle}
                >
                  {addingTitle ? t('Adding...') : t('Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing title */}
      {editTitleModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center dark:bg-black/60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative dark:bg-[#23272f] dark:text-gray-100">
            <button className="absolute top-2 right-2 p-1 dark:text-gray-200" onClick={() => setEditTitleModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4 dark:text-gray-100">{t('Edit Title')}</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await apiClient(`/course-files/${editingFile.id}/`, {
                  method: 'PATCH',
                  body: JSON.stringify({ title: editTitle })
                });
                if (!res.ok) throw new Error('Failed to update title');
                setEditTitleModal(false);
                setEditingFile(null);
                setEditTitle('');
                fetchCourseFiles();
              } catch (err) {
                alert('Failed to update title.');
              }
            }} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium dark:text-gray-200">{t('Title')}</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-[#181c2a] dark:text-gray-100"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  onClick={() => setEditTitleModal(false)}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white dark:bg-blue-700"
                >
                  {t('Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 