"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

export default function UsersPage() {
  const { apiClient, user } = useAuth();
  const { t } = useTranslation();

  const ROLES = [
    { value: "ADMIN", label: t('Admin') },
    { value: "TA", label: t('Teaching Assistant') },
    { value: "PROFESSOR", label: t('Professor') },
    { value: "SUPERVISOR", label: t('Supervisor') },
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", role: ROLES[0].value, password: "", first_name: "", last_name: "" });

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/users/");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    setForm(
      user
        ? { username: user.username, email: user.email, role: user.role, password: "", first_name: user.first_name || "", last_name: user.last_name || "" }
        : { username: "", email: "", role: ROLES[0].value, password: "", first_name: "", last_name: "" }
    );
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setForm({ username: "", email: "", role: ROLES[0].value, password: "", first_name: "", last_name: "" });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingUser) {
        // Only send password if not empty
        const editData = { ...form };
        if (!editData.password) {
          delete editData.password;
        }
        response = await apiClient(`/users/${editingUser.id}/`, {
          method: "PATCH",
          body: JSON.stringify(editData),
        });
      } else {
        response = await apiClient("/users/", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = errorData.detail || "Failed to save user";
        if (typeof errorData === "object" && !errorData.detail) {
          errorMsg = Object.values(errorData).flat().join(' ');
        }
        throw new Error(errorMsg);
      }
      toast.success(editingUser ? "User updated" : "User created");
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await apiClient(`/users/${id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div>{t('Loading users...')}</div>;
  if (error) return <div className="text-red-500">{t(error)}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('Users')}</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>{t('Add User')}</Button>
        )}
      </div>
      {users.length === 0 ? (
        <div>{t('No users found.')}</div>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div><strong>{u.username}</strong></div>
                <div>{t('First Name')}: {u.first_name}</div>
                <div>{t('Last Name')}: {u.last_name}</div>
                <div>{t('Role')}: {t(u.role)}</div>
                <div>{t('Email')}: {u.email}</div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog(u)}>{t('Edit')}</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>{t('Delete')}</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? t('Edit User') : t('Add User')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="username" placeholder={t('Username')} value={form.username} onChange={handleChange} required />
            <Input name="first_name" placeholder={t('First Name')} value={form.first_name} onChange={handleChange} required />
            <Input name="last_name" placeholder={t('Last Name')} value={form.last_name} onChange={handleChange} required />
            <Input name="email" placeholder={t('Email')} value={form.email} onChange={handleChange} required />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <Input
              name="password"
              type="password"
              placeholder={editingUser ? t('New Password (leave blank to keep current)') : t('Password')}
              value={form.password}
              onChange={handleChange}
              required={!editingUser}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>{t('Cancel')}</Button>
              <Button type="submit">{editingUser ? t('Update') : t('Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 