'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Building2, CheckCircle2, ClipboardList, CreditCard, GraduationCap, Layers3, Users } from 'lucide-react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/dashboard/page-states';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatDate, formatNumber } from '@/lib/utils';

type Row = Record<string, unknown>;

function metricIcon(label: string) {
  if (label.includes('organization')) return Building2;
  if (label.includes('teacher')) return Users;
  if (label.includes('student')) return GraduationCap;
  if (label.includes('service')) return Layers3;
  if (label.includes('payment')) return CreditCard;
  if (label.includes('verification')) return CheckCircle2;
  return ClipboardList;
}

function titleize(value: string) {
  return value.replaceAll(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function RecentList({ title, items, type }: { title: string; items: Row[]; type: 'org' | 'user' | 'exam' | 'submission' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Latest platform activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No recent data.</p> : null}
        {items.map((item) => (
          <div key={String(item._id)} className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {String(item.name ?? item.title ?? (item.student as Row | undefined)?.name ?? 'Item')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {type === 'submission'
                  ? `${String((item.examSlot as Row | undefined)?.title ?? 'Exam')} - ${formatDate(item.submittedAt as string)}`
                  : `${String(item.email ?? (item.organization as Row | undefined)?.name ?? '')} ${formatDate(item.createdAt as string)}`}
              </p>
            </div>
            {type === 'org' ? <StatusBadge value={String(item.verificationStatus ?? 'unverified')} /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const query = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30_000,
  });
  const data = query.data ?? {};
  const counts = (data.counts as Record<string, unknown> | undefined) ?? {};
  const recentOrganizations = (data.recentOrganizations as Row[] | undefined) ?? [];
  const recentUsers = (data.recentUsers as Row[] | undefined) ?? [];
  const recentExams = (data.recentExams as Row[] | undefined) ?? [];
  const recentSubmissions = (data.recentSubmissions as Row[] | undefined) ?? [];
  const pendingActions = (data.pendingActions as Row[] | undefined) ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(counts).map(([key, value]) => {
          const Icon = metricIcon(key.toLowerCase());
          return (
            <Card key={key}>
              <CardContent className="flex items-center justify-between gap-4 pt-5">
                <div>
                  <p className="text-sm text-muted-foreground">{titleize(key)}</p>
                  <p className="mt-2 text-3xl font-black">{formatNumber(value)}</p>
                </div>
                <div className="rounded-lg bg-white p-3 text-black">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pending actions</CardTitle>
            <CardDescription>Items that need Super Admin review.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {pendingActions.map((item) => (
              <Link key={String(item.label)} href={String(item.label).includes('Payment') ? '/payments' : '/verification'} className="group rounded-md border border-border bg-muted/20 p-4 transition hover:bg-muted">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{String(item.label)}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <p className="mt-3 text-3xl font-black">{formatNumber(item.count)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <RecentList title="Recent organizations" items={recentOrganizations} type="org" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <RecentList title="Recent users" items={recentUsers} type="user" />
        <RecentList title="Recent exams" items={recentExams} type="exam" />
        <RecentList title="Recent submissions" items={recentSubmissions} type="submission" />
      </div>
    </div>
  );
}
