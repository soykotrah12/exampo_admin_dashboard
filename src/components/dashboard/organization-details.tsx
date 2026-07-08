'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { organizationsApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatDate, formatNumber } from '@/lib/utils';

type Row = Record<string, unknown>;

function list(name: string, items: Row[] = []) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{formatNumber(items.length)} records loaded for this organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No records yet.</p> : null}
        {items.slice(0, 20).map((item) => (
          <div key={String(item._id)} className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3 text-sm">
            <span className="font-semibold">{String(item.name ?? item.title ?? (item.student as Row | undefined)?.name ?? 'Record')}</span>
            <span className="text-muted-foreground">{formatDate(item.createdAt as string)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OrganizationDetails({ id }: { id: string }) {
  const [tab, setTab] = useState('overview');
  const query = useQuery({ queryKey: ['organization-details', id], queryFn: () => organizationsApi.details(id) });
  const data = (query.data ?? {}) as Row;
  const counts = (data.counts as Row | undefined) ?? {};

  if (query.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={String(data.name ?? 'Organization')} src={String(data.logoUrl ?? data.avatarUrl ?? '')} className="h-14 w-14" />
            <div>
              <h2 className="text-2xl font-black">{String(data.name ?? 'Organization')}</h2>
              <p className="text-sm text-muted-foreground">{String(data.email ?? '')} - {String(data.organizationCode ?? '')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={String(data.verificationStatus ?? 'unverified')} />
            <StatusBadge value={data.isActive === false ? 'suspended' : 'active'} />
          </div>
        </CardContent>
      </Card>

      <Tabs tabs={['overview', 'teachers', 'students', 'services', 'batches', 'exams', 'submissions', 'rankings', 'subscription', 'verification', 'settings']} value={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(counts).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-5">
                <p className="text-sm capitalize text-muted-foreground">{key}</p>
                <p className="mt-2 text-3xl font-black">{formatNumber(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {tab === 'teachers' ? list('Teachers', data.teachers as Row[]) : null}
      {tab === 'students' ? list('Students', data.students as Row[]) : null}
      {tab === 'services' ? list('Services', data.services as Row[]) : null}
      {tab === 'batches' ? list('Batches', data.batches as Row[]) : null}
      {tab === 'exams' ? list('Exams', data.exams as Row[]) : null}
      {tab === 'submissions' ? list('Submissions', data.submissions as Row[]) : null}
      {tab === 'rankings' ? list('Rankings', []) : null}
      {tab === 'subscription' ? (
        <Card><CardContent className="space-y-2 pt-5"><p>Plan: {String((data.plan as Row | undefined)?.name ?? 'Free')}</p><p>Status: {String(data.subscriptionStatus ?? 'free')}</p></CardContent></Card>
      ) : null}
      {tab === 'verification' ? (
        <Card><CardContent className="space-y-2 pt-5"><p>Status: {String(data.verificationStatus ?? 'unverified')}</p><p>Document: {String(data.verificationDocumentUrl ?? 'Not uploaded')}</p></CardContent></Card>
      ) : null}
      {tab === 'settings' ? (
        <Card><CardContent className="pt-5 text-sm text-muted-foreground">Use the Organizations page actions to suspend or activate this organization.</CardContent></Card>
      ) : null}
    </div>
  );
}
