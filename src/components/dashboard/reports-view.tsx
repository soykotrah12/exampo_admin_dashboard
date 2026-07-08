'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/dashboard/page-states';
import { formatCurrency, formatNumber } from '@/lib/utils';

type Row = Record<string, unknown>;

export function ReportsView() {
  const query = useQuery({ queryKey: ['reports'], queryFn: reportsApi.summary, refetchInterval: 60_000 });
  const data = query.data ?? {};
  const growth = (data.growth as Row | undefined) ?? {};
  const topOrganizations = (data.topOrganizations as Row[] | undefined) ?? [];

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Revenue</p><p className="mt-2 text-3xl font-black">{formatCurrency(data.revenue)}</p></CardContent></Card>
        {Object.entries(growth).map(([key, value]) => (
          <Card key={key}><CardContent className="pt-5"><p className="text-sm capitalize text-muted-foreground">{key}</p><p className="mt-2 text-3xl font-black">{formatNumber(value)}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top organizations</CardTitle>
          <CardDescription>Ranked by submission volume.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {topOrganizations.map((item, index) => {
            const organization = item.organization as Row | undefined;
            return (
              <div key={String(item._id ?? index)} className="flex justify-between rounded-md border border-border bg-muted/20 p-3">
                <span className="font-semibold">#{index + 1} {String(organization?.name ?? 'Organization')}</span>
                <span className="text-muted-foreground">{formatNumber(item.submissions)} submissions</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
