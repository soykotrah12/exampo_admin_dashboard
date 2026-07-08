'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsView() {
  const { data } = useSession();
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Admin profile</CardTitle>
          <CardDescription>Current authenticated super admin session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Name: {data?.user?.name}</p>
          <p>Email: {data?.user?.email}</p>
          <p>Role: {data?.role}</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Platform settings</CardTitle>
          <CardDescription>Future-ready settings area for app-wide controls.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Configuration switches can be added here without changing the layout.</CardContent>
      </Card>
    </div>
  );
}
