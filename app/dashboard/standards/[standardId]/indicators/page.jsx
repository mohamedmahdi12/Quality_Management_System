"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Upload, X, Download, Share2, Clock, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { MultiSelect } from '@/components/ui/MultiSelect';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

function AttachmentsAccordion({ elementId, assignedTo = [] }) {
  const { apiClient, user, tokens } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileTitles, setFileTitles] = useState([]);
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [uploadingToTitle, setUploadingToTitle] = useState(null);
  const [manualTitles, setManualTitles] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState([]);
  const { t } = useTranslation();
  const [selectedFileName, setSelectedFileName] = useState('');

  const isAdmin = user?.role === "ADMIN";
  const isSupervisorOrTA = user?.role === "SUPERVISOR" || user?.role === "TA";
  const isAssigned = true;
  const hasAccess = assignedTo.some(u => u.id === user.id);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/attachments/?element=${elementId}`);
      if (!response.ok) throw new Error("Failed to fetch attachments");
      const data = await response.json();
      setAttachments(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [apiClient, elementId]);

  // تحديث progress bar تلقائيًا عند أي تغيير في المرفقات أو العناصر
  useEffect(() => {
    const handleRefresh = (e) => {
      if (!e.key || e.key === 'refreshStandards') {
        fetchAttachments();
      }
    };
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('refreshStandards', handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('refreshStandards', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const titlesFromAttachments = Array.from(new Set(attachments.map(a => a.title)));
    const allTitles = Array.from(new Set([...manualTitles, ...titlesFromAttachments]));
    setFileTitles(allTitles.map(title => ({ id: title, title })));
  }, [attachments, manualTitles]);

  const handleAddTitle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUploading(true);
    try {
      const res = await apiClient(`/attachments/`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          element: elementId
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('فشل في إضافة العنوان');
      setNewTitle("");
      setShowAddTitle(false);
      setManualTitles(prev => prev.includes(newTitle) ? prev : [...prev, newTitle]);
      fetchAttachments();
      localStorage.setItem('refreshStandards', Date.now());
      window.dispatchEvent(new Event('refreshStandards'));
    } catch (err) {
      alert('فشل في إضافة العنوان');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFile = async (e, title) => {
    const file = e.target.files[0];
    setUploadError("");
    if (!file) return;
    setUploading(true);
    try {
      let attachment = attachments.find(a => a.title === title && !a.file);
      if (!attachment) {
        if (isAdmin) {
          const res = await apiClient(`/attachments/`, {
            method: 'POST',
            body: JSON.stringify({
              title: title,
              element: elementId
            }),
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) throw new Error(t('Failed to add title'));
          attachment = await res.json();
        } else {
          alert(t('No attachment slot available for upload.'));
          setUploading(false);
          return;
        }
      }
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient(`/attachments/${attachment.id}/upload/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        setUploadError(errData.detail || JSON.stringify(errData));
        setUploading(false);
        return;
      }
      fetchAttachments();
      localStorage.setItem('refreshStandards', Date.now());
      window.dispatchEvent(new Event('refreshStandards'));
      setUploadingToTitle(null);
    } catch (err) {
      setUploadError(t('Failed to upload file'));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async (id, silent = false) => {
    if (!silent && !window.confirm(t('Are you sure you want to delete this attachment?'))) return;
    try {
      const response = await apiClient(`/attachments/${id}/remove/`, { method: "DELETE" });
      if (!response.ok) throw new Error(t('Failed to delete'));
      fetchAttachments();
      localStorage.setItem('refreshStandards', Date.now());
      window.dispatchEvent(new Event('refreshStandards'));
    } catch (err) {
      if (!silent) alert(err.message);
    }
  };

  const handleRemoveTitle = async (title) => {
    const filesForTitle = attachments.filter(a => a.title === title);
    if (filesForTitle.length > 0) {
      if (!window.confirm("This title has files or records. Delete all and the title?")) return;
      for (const att of filesForTitle) {
        await handleRemove(att.id, true);
      }
    }
    setManualTitles(prev => prev.filter(t => t !== title));
    setFileTitles(prev => prev.filter(t => t.title !== title));
  };

  const fetchPendingRequests = async () => {
    if (!user) return;
    try {
      const response = await apiClient(`/requests/?requester=${user.id}&status=PENDING`);
      if (!response.ok) return;
      const data = await response.json();
      setPendingRequests(data.results || []);
    } catch {}
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [attachments, user]);

  const handleRequestAccess = async (attachmentId) => {
    try {
      const res = await apiClient(`/requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ made_on: attachmentId })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Failed to send request');
        return;
      }
      alert('Request sent successfully');
      fetchPendingRequests();
    } catch (err) {
      alert('Failed to send request');
    }
  };

  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  const downloadAttachment = async (attachmentId, filename, token) => {
    try {
      let downloadUrl = `${API_BASE_URL}/attachments/${attachmentId}/download/`;
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

  if (loading) return <LoadingSpinner size="sm" className="mx-auto my-2" />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="dark:text-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {isAdmin && (
          <Button onClick={() => setShowAddTitle(true)} type="button" className="bg-green-500 text-white dark:bg-green-700 dark:hover:bg-green-600 px-3 py-1 rounded">
            + {t('Add Attachment')}
          </Button>
        )}
        {showAddTitle && isAdmin && (
          <form onSubmit={handleAddTitle} className="flex gap-2 mt-2 text-gray-800 dark:text-gray-200">
            <input
              type="text"
              className="border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t('File title')}
              required
            />
            <Button type="submit" className="bg-blue-500 text-white dark:bg-blue-700 dark:hover:bg-blue-600 px-3 py-1 rounded">{t('Add')}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAddTitle(false)} className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">{t('Cancel')}</Button>
          </form>
        )}
      </div>
      {fileTitles.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No attachment titles.</div>
      )}
      <div className="space-y-2">
        {fileTitles.map((titleObj, idx) => {
          const filesForTitle = attachments.filter(a => a.title === titleObj.title && a.file);
          const hasFile = filesForTitle.length > 0;
          const file = hasFile ? filesForTitle[0] : null;
          const attachmentWithoutFile = attachments.find(a => a.title === titleObj.title && !a.file);

          const canManageFile = isAdmin || (isSupervisorOrTA && hasAccess);

          // تحقق إذا كان المستخدم من ضمن shared_with لهذا الملف
          const isSharedWith = file && file.shared_with && Array.isArray(file.shared_with)
            ? file.shared_with.some(u => u.id === user.id)
            : false;
          // منطق عرض زر التحميل: Admin أو (TA/SUPERVISOR وله access) أو من ضمن shared_with
          const canDownload = isAdmin || (isSupervisorOrTA && hasAccess) || isSharedWith;

          return (
            <div key={titleObj.id} className="flex flex-col bg-yellow-100 dark:bg-yellow-900 rounded px-3 py-2 shadow mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block bg-yellow-500 dark:bg-yellow-700 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow mr-2">{idx + 1}</span>
                <span className="font-medium text-base flex-1 truncate text-gray-800 dark:text-gray-200">{titleObj.title}</span>
                {canManageFile && attachmentWithoutFile && (
                  <Button
                    size="icon"
                    className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700"
                    onClick={() => setUploadingToTitle(titleObj.id)}
                    title={t('Upload file for this title')}
                  >
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </Button>
                )}
                {isAdmin && (
                  <Button size="icon" variant="destructive" onClick={() => handleRemoveTitle(titleObj.title)} className="mx-1">
                        <Trash className="w-4 h-4" />
                      </Button>
                )}
              </div>
              <div className="space-y-1">
                {hasFile ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded px-2 py-1">
                    <span className="flex-1 truncate">{file.file?.split('/').pop()}</span>
                    {/* زر التحميل يظهر فقط إذا كان للمستخدم صلاحية */}
                    {canDownload && (
                    <button
                      onClick={() => {
                        const token = tokens?.access;
                        if (!token) {
                          alert('You are not logged in!');
                          return;
                        }
                        downloadAttachment(file.id, file.file?.split('/').pop() || 'file', token);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition dark:bg-blue-800 dark:hover:bg-blue-700"
                      title={t('Download')}
                      type="button"
                    >
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </button>
                    )}
                    {canDownload && (
                      <button
                        onClick={async () => {
                          const token = tokens?.access;
                          if (!token) {
                            alert('You are not logged in!');
                            return;
                          }
                          let viewUrl = `${API_BASE_URL}/attachments/${file.id}/download/`;
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
                            const fileType = file.file?.split('.').pop().toLowerCase();
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
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition dark:bg-green-800 dark:hover:bg-green-700"
                        title={t('View')}
                        type="button"
                      >
                        <Eye className="w-4 h-4 text-green-600 dark:text-green-300" />
                      </button>
                    )}
                    {/* زر طلب الوصول يظهر فقط إذا لم يكن للمستخدم صلاحية تحميل الملف ولا يوجد له طلب معلق */}
                    {!canDownload && file && !pendingRequests.some(r => r.made_on === file.id) && (
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-100 hover:bg-yellow-200 transition dark:bg-yellow-800 dark:hover:bg-yellow-700"
                        title={t('Request Access')}
                        type="button"
                        onClick={() => handleRequestAccess(file.id)}
                      >
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
                      </button>
                    )}
                    {/* إذا كان هناك طلب معلق لهذا الملف، أظهر كلمة Pending/انتظار وزر Cancel */}
                    {!canDownload && file && pendingRequests.some(r => r.made_on === file.id) && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                          {t('Pending')}
                        </span>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 transition dark:bg-red-800 dark:hover:bg-red-700"
                          title={t('Cancel')}
                          type="button"
                          onClick={async () => {
                            // ابحث عن الريكوست المعلق لهذا الملف
                            const req = pendingRequests.find(r => r.made_on === file.id);
                            if (req) {
                              try {
                                const res = await apiClient(`/requests/${req.id}/cancel/`, { method: 'POST' });
                                if (res.ok) fetchPendingRequests();
                              } catch {}
                            }
                          }}
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-300" />
                        </button>
                      </div>
                    )}
                    {canManageFile && (
                    <Button size="icon" variant="destructive" onClick={() => handleRemove(file.id)} className="mx-1">
                      <Trash className="w-4 h-4" />
                    </Button>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">{t('No files uploaded for this title.')}</span>
                )}
              </div>
              {uploadingToTitle === titleObj.id && canManageFile && attachmentWithoutFile && (
                <form
                  onSubmit={e => e.preventDefault()}
                  className="flex gap-2 mt-2"
                >
                  <input
                    id={`file-upload-${titleObj.id}`}
                    type="file"
                    className="hidden"
                    required
                    onChange={e => {
                      handleUploadFile(e, titleObj.title);
                      setSelectedFileName(e.target.files[0]?.name || '');
                    }}
                    aria-label={t('Choose File')}
                  />
                  <label htmlFor={`file-upload-${titleObj.id}`} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-100">
                    {t('Choose File')}
                  </label>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFileName ? selectedFileName : t('No file chosen')}
                  </span>
                  <Button type="button" className="bg-blue-500 text-white dark:bg-blue-700 dark:hover:bg-blue-600 px-3 py-1 rounded" onClick={() => setUploadingToTitle(null)}>{t('Cancel')}</Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ElementsAccordion({ pointerId, assignedTo = [] }) {
  const { apiClient, user } = useAuth();
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CRUD state
  const [openDialog, setOpenDialog] = useState(false);
  const [editElement, setEditElement] = useState(null);
  const [deleteElement, setDeleteElement] = useState(null);
  const [formError, setFormError] = useState("");
  const form = useForm({ defaultValues: { title: "" } });
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const isAdmin = user?.role === "ADMIN";

  // CRUD Handlers
  const handleAddElement = () => {
    setEditElement(null);
    form.reset({ title: "" });
    setFormError("");
    setOpenDialog(true);
  };
  const handleEditElement = (el) => {
    setEditElement(el);
    form.reset({ title: el.title });
    setFormError("");
    setOpenDialog(true);
  };
  const handleDeleteElement = (el) => {
    setDeleteElement(el);
  };

  // API Calls
  const fetchElements = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/elements/?pointer=${pointerId}`);
      if (!response.ok) throw new Error("Failed to fetch elements");
      const data = await response.json();
      setElements(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElements();
    localStorage.setItem('refreshStandards', Date.now());
  }, [apiClient, pointerId]);

  const onSubmit = async (values) => {
    setFormError("");
    try {
      let response;
      if (editElement) {
        response = await apiClient(`/elements/${editElement.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: values.title, pointer: pointerId }),
        });
      } else {
        response = await apiClient(`/elements/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: values.title, pointer: pointerId }),
        });
      }
      if (!response.ok) {
        const errData = await response.json();
        setFormError(errData.detail || JSON.stringify(errData));
        return;
      }
      setOpenDialog(false);
      fetchElements();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteElement) return;
    try {
      const response = await apiClient(`/elements/${deleteElement.id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setDeleteElement(null);
      fetchElements();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner size="sm" className="mx-auto my-2" />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      {(isAdmin) && (
        <>
          <Button
            size="sm"
            className="mb-2"
            onClick={() => {
              setEditElement(null);
              form.reset({ title: "" });
              setFormError("");
              setOpenDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> {t('Add Element')}
          </Button>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editElement ? t('Edit Element') : t('Add Element')}</DialogTitle>
                <DialogDescription>{t('Enter the element title.')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...form.register("title", { required: t("Title is required") })}
                  placeholder={t('Element Title')}
                  autoFocus
                />
                {form.formState.errors.title && (
                  <div className="text-red-500 text-xs">{form.formState.errors.title.message}</div>
                )}
                {formError && <div className="text-red-500 text-xs">{formError}</div>}
                <DialogFooter>
                  <Button type="submit">{editElement ? t('Save') : t('Add')}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">{t('Cancel')}</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
      {elements.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No elements.</div>
      )}
      {elements.length > 0 && (
        <Accordion type="multiple" className="space-y-3 ml-2 dark:text-gray-100">
          {elements.map((el, idx) => (
            <AccordionItem key={el.id} value={String(el.id)} className="border-none shadow rounded-lg bg-gray-100 dark:bg-gray-700">
              <AccordionTrigger className="bg-green-100 dark:bg-green-800 px-3 py-2 rounded flex items-center gap-2 relative hover:no-underline dark:hover:bg-green-700">
                <div className="flex flex-col items-start flex-1 pr-4">
                  <span className="text-base font-medium text-gray-800 dark:text-gray-200 text-left">{`${idx + 1}. ${el.title || el.name || `Element #${el.id}`}`}</span>
                  <div className="w-full mt-1">
                    <div className="flex justify-between text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      <span>{t('Attachments Progress')}</span>
                      <span>
                        {el.n_of_attachments_uploaded} / {el.n_of_attachments}
                        {el.n_of_attachments > 0 && el.n_of_attachments_uploaded === el.n_of_attachments && (
                          <span className="ml-1 text-green-600">({t('Completed')})</span>
                        )}
                      </span>
                    </div>
                    <Progress
                      value={el.n_of_attachments > 0 ? (el.n_of_attachments_uploaded / el.n_of_attachments) * 100 : 0}
                      className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 [&>div]:bg-green-500"
                    />
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-row gap-1 ml-auto pr-4 items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={e => {e.stopPropagation(); handleEditElement(el);}}><Edit className="w-4 h-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="destructive" onClick={e => {e.stopPropagation(); handleDeleteElement(el);}}><Trash className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('Delete Element')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('Are you sure you want to delete this element?')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete}>{t('Delete')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </AccordionTrigger>
              <AccordionContent className="border-t border-gray-200 dark:border-gray-600">
                <Card className="bg-white/80 dark:bg-gray-800/80 p-3 border-0 shadow-none">
                  <div className="mt-2">
                    <span className="font-semibold text-green-700">{t('Attachments')}:</span>
                    <AttachmentsAccordion elementId={el.id} assignedTo={assignedTo} />
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {/* Delete element dialog (for outside accordion) */}
      <AlertDialog open={!!deleteElement} onOpenChange={open => { if (!open) setDeleteElement(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Element')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Are you sure you want to delete this element?')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function IndicatorsPage() {
  const { apiClient, user } = useAuth();
  const params = useParams();
  const standardId = params.standardId;
  const [pointers, setPointers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedTo, setAssignedTo] = useState([]);

  // Modal state
  const [openDialog, setOpenDialog] = useState(false);
  const [editPointer, setEditPointer] = useState(null);
  const [deletePointer, setDeletePointer] = useState(null);
  const [formError, setFormError] = useState("");
  const form = useForm({ defaultValues: { title: "" } });
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const isAdmin = user?.role === "ADMIN";
  const isTA = user?.role === "TA";

  // CRUD Handlers
  const handleAddIndicator = () => {
    setEditPointer(null);
    form.reset({ title: "" });
    setFormError("");
    setOpenDialog(true);
  };
  const handleEditIndicator = (pointer) => {
    setEditPointer(pointer);
    form.reset({ title: pointer.title });
    setFormError("");
    setOpenDialog(true);
  };
  const handleDeleteIndicator = (pointer) => {
    setDeletePointer(pointer);
  };

  // API Calls
  const fetchPointers = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/pointers/?standard=${standardId}`);
      if (!response.ok) throw new Error("Failed to fetch pointers");
      const data = await response.json();
      setPointers(data.results || data);
      // جلب assigned_to للمعيار
      async function fetchStandard() {
        try {
          const res = await apiClient(`/standards/${standardId}/`);
          if (res.ok) {
            const data = await res.json();
            setAssignedTo(data.assigned_to || []);
          }
        } catch {}
      }
      fetchStandard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointers();
    // eslint-disable-next-line
  }, [apiClient, standardId]);

  // تحديث progress bar تلقائيًا عند أي تغيير في المرفقات أو العناصر
  useEffect(() => {
    const handleRefresh = (e) => {
      if (!e.key || e.key === 'refreshStandards') {
        fetchPointers();
      }
    };
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('refreshStandards', handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('refreshStandards', handleRefresh);
    };
  }, []);

  const onSubmit = async (values) => {
    setFormError("");
    try {
      let response;
      if (editPointer) {
        response = await apiClient(`/pointers/${editPointer.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: values.title, standard: standardId }),
        });
      } else {
        response = await apiClient(`/pointers/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: values.title, standard: standardId }),
        });
      }
      if (!response.ok) {
        const errData = await response.json();
        setFormError(errData.detail || JSON.stringify(errData));
        return;
      }
      setOpenDialog(false);
      fetchPointers();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deletePointer) return;
    try {
      const response = await apiClient(`/pointers/${deletePointer.id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setDeletePointer(null);
      fetchPointers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mx-auto mt-10" />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('Indicators')}</h1>
      </div>
      {(isAdmin) && (
        <div className="flex justify-end mb-4">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1" onClick={handleAddIndicator}>
                <Plus className="w-4 h-4" /> {t('Add Indicator')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editPointer ? t('Edit Indicator') : t('Add Indicator')}</DialogTitle>
                <DialogDescription>{t('Enter the indicator title.')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...form.register("title", { required: t("Title is required") })}
                  placeholder={t('Indicator Title')}
                  autoFocus
                />
                {form.formState.errors.title && (
                  <div className="text-red-500 text-xs">{form.formState.errors.title.message}</div>
                )}
                {formError && <div className="text-red-500 text-xs">{formError}</div>}
                <DialogFooter>
                  <Button type="submit">{editPointer ? t('Save') : t('Add')}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">{t('Cancel')}</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {pointers.length === 0 ? (
        <div>No indicators found for this standard.</div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {pointers.map((pointer, idx) => (
            <AccordionItem
              key={pointer.id}
              value={String(pointer.id)}
              className="border-none shadow-lg rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <AccordionTrigger className="!bg-gradient-to-r from-blue-100 via-green-100 to-purple-100 dark:from-blue-900 dark:via-green-900 dark:to-purple-900 px-4 py-3 rounded-lg flex items-center gap-3 relative hover:no-underline dark:hover:bg-gray-700">
                <div className="flex flex-col items-start flex-1 pr-4">
                  <span className="text-base font-semibold text-gray-800 dark:text-gray-200 text-left">{`${idx + 1}. ${pointer.title}`}</span>
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      <span>{t('Attachments Progress')}</span>
                      <span>
                        {pointer.n_of_attachments_uploaded} / {pointer.n_of_attachments}
                        {pointer.n_of_attachments > 0 && pointer.n_of_attachments_uploaded === pointer.n_of_attachments && (
                          <span className="ml-1 text-green-600">({t('Completed')})</span>
                        )}
                      </span>
                    </div>
                    <Progress
                      value={pointer.n_of_attachments > 0 ? (pointer.n_of_attachments_uploaded / pointer.n_of_attachments) * 100 : 0}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-700 [&>div]:bg-green-500"
                    />
                  </div>
                </div>
                {(isAdmin || (assignedTo.some(u => u.id === user?.id) && user?.role !== 'TA')) && (
                  <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditIndicator(pointer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteIndicator(pointer)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </AccordionTrigger>
              <AccordionContent className="border-t p-4 bg-gray-50">
                {/* Render Elements for this pointer */}
                <ElementsAccordion pointerId={pointer.id} assignedTo={assignedTo} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {/* Delete pointer dialog (for outside accordion) */}
      <AlertDialog open={!!deletePointer} onOpenChange={open => { if (!open) setDeletePointer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Indicator')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Are you sure you want to delete this indicator?')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 