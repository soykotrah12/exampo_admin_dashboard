'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminProfileApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/dashboard/page-states';

type Profile = {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const profileQuery = useQuery({
    queryKey: ['admin-profile'],
    queryFn: adminProfileApi.me,
    refetchInterval: 60_000,
  });

  const profile = (profileQuery.data || session?.user || {}) as Profile;

  useEffect(() => {
    if (!editing) {
      setProfileForm({ name: profile.name || '', email: profile.email || '' });
    }
  }, [editing, profile.name, profile.email]);

  const profileMutation = useMutation({
    mutationFn: adminProfileApi.updateProfile,
    onSuccess: async (updated) => {
      queryClient.setQueryData(['admin-profile'], updated);
      await update?.({ name: (updated as Profile).name, email: (updated as Profile).email });
      setEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: adminProfileApi.changePassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    },
    onError: (error) => toast.error(error.message),
  });

  const submitProfile = (event: FormEvent) => {
    event.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    if (!passwordForm.currentPassword) return toast.error('Current password is required');
    if (passwordForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match');
    return passwordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-52 xl:col-span-2" />
      </div>
    );
  }

  if (profileQuery.isError) return <ErrorState message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Admin profile</CardTitle>
          <CardDescription>Current authenticated super admin session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} src={profile.avatarUrl} className="h-12 w-12" />
            <div>
              <p className="font-black">{profile.name || 'Super Admin'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{profile.role || session?.role}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)}>Edit Admin Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Session and platform access controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update the password used for this super admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-3" onSubmit={submitPassword}>
            <Field label="Current password">
              <Input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, currentPassword: event.target.value }))} />
            </Field>
            <Field label="New password">
              <Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, newPassword: event.target.value }))} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, confirmPassword: event.target.value }))} />
            </Field>
            <div className="lg:col-span-3">
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Saving...' : 'Change password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close dialog" className="absolute inset-0 bg-black/75" onClick={() => setEditing(false)} />
          <form className="relative w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-2xl" onSubmit={submitProfile}>
            <div>
              <h2 className="text-lg font-black">Edit Admin Profile</h2>
              <p className="text-sm text-muted-foreground">Update the name and email shown across the dashboard.</p>
            </div>
            <Field label="Name">
              <Input value={profileForm.name} onChange={(event) => setProfileForm((value) => ({ ...value, name: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={profileForm.email} onChange={(event) => setProfileForm((value) => ({ ...value, email: event.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={profileMutation.isPending}>{profileMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
