'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { plansApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmAction } from '@/components/dashboard/confirm-action';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/dashboard/page-states';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatCurrency, formatDate, formatNumber, getValue } from '@/lib/utils';

type Row = Record<string, unknown>;

const emptyPlan = {
  name: '',
  code: '',
  description: '',
  billingType: 'monthly',
  monthlyPrice: 0,
  yearlyPrice: 0,
  teacherLimit: 1,
  studentLimit: 20,
  serviceLimit: 0,
  batchLimit: 0,
  examLimit: 1,
  features: [''],
  isActive: true,
  sortOrder: 0,
};

function text(value: unknown, fallback = '-') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function planToForm(row?: Row) {
  if (!row) return emptyPlan;
  return {
    name: text(row.name, ''),
    code: text(row.code, ''),
    description: text(row.description, ''),
    billingType: text(row.billingType, 'monthly'),
    monthlyPrice: Number(row.monthlyPrice ?? row.priceMonthly ?? 0),
    yearlyPrice: Number(row.yearlyPrice ?? row.priceYearly ?? 0),
    teacherLimit: Number(getValue(row, 'limits.teachersLimit') || 0),
    studentLimit: Number(getValue(row, 'limits.studentsLimit') || 0),
    serviceLimit: Number(getValue(row, 'limits.servicesLimit') || 0),
    batchLimit: Number(getValue(row, 'limits.batchesLimit') || 0),
    examLimit: Number(getValue(row, 'limits.examSlotsPerMonth') || 0),
    features: Array.isArray(row.features) && row.features.length ? row.features.map(String) : [''],
    isActive: row.isActive !== false,
    sortOrder: Number(row.sortOrder || 0),
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-semibold"><span>{label}</span>{children}</label>;
}

function PlanForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Row;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (body: typeof emptyPlan) => void;
}) {
  const [form, setForm] = useState(planToForm(initial));
  const number = (key: keyof typeof emptyPlan, value: string) => setForm((current) => ({ ...current, [key]: Number(value || 0) }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-black/75" onClick={onCancel} />
      <form className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl" onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit(form); }}>
        <div className="mb-5">
          <h2 className="text-lg font-black">{initial ? 'Edit plan' : 'Create plan'}</h2>
          <p className="text-sm text-muted-foreground">Edits apply to new assignments. Running subscriptions keep their saved snapshot.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required /></Field>
          <Field label="Code"><Input value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))} required /></Field>
          <Field label="Billing type">
            <Select value={form.billingType} onChange={(event) => setForm((value) => ({ ...value, billingType: event.target.value }))}>
              {['free', 'monthly', 'yearly', 'custom'].map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field label="Sort order"><Input type="number" value={form.sortOrder} onChange={(event) => number('sortOrder', event.target.value)} /></Field>
          <Field label="Monthly price"><Input type="number" min="0" value={form.monthlyPrice} onChange={(event) => number('monthlyPrice', event.target.value)} /></Field>
          <Field label="Yearly price"><Input type="number" min="0" value={form.yearlyPrice} onChange={(event) => number('yearlyPrice', event.target.value)} /></Field>
          <Field label="Teacher limit"><Input type="number" min="0" value={form.teacherLimit} onChange={(event) => number('teacherLimit', event.target.value)} /></Field>
          <Field label="Student limit"><Input type="number" min="0" value={form.studentLimit} onChange={(event) => number('studentLimit', event.target.value)} /></Field>
          <Field label="Service limit"><Input type="number" min="0" value={form.serviceLimit} onChange={(event) => number('serviceLimit', event.target.value)} /></Field>
          <Field label="Batch limit"><Input type="number" min="0" value={form.batchLimit} onChange={(event) => number('batchLimit', event.target.value)} /></Field>
          <Field label="Exam limit"><Input type="number" min="0" value={form.examLimit} onChange={(event) => number('examLimit', event.target.value)} /></Field>
          <label className="flex items-center gap-2 pt-8 text-sm font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />
            Active for new purchases
          </label>
          <label className="space-y-2 text-sm font-semibold md:col-span-2">
            <span>Description</span>
            <textarea className="min-h-24 w-full rounded-md border border-input bg-black px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          </label>
          <div className="space-y-3 md:col-span-2">
            <p className="text-sm font-semibold">Features</p>
            {form.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input value={feature} onChange={(event) => setForm((value) => ({ ...value, features: value.features.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} />
                <Button type="button" variant="outline" onClick={() => setForm((value) => ({ ...value, features: value.features.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((value) => ({ ...value, features: [...value.features, ''] }))}>Add feature</Button>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save plan'}</Button>
        </div>
      </form>
    </div>
  );
}

export function PlansView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Row | null | undefined>();
  const params = useMemo(() => ({ page, limit, search: search || undefined, status: status || undefined }), [page, limit, search, status]);
  const query = useQuery({ queryKey: ['plans', params], queryFn: () => plansApi.list(params), refetchInterval: 60_000 });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  };
  const save = useMutation({
    mutationFn: (body: typeof emptyPlan & { _id?: string }) => body._id ? plansApi.update(body._id, body) : plansApi.create(body),
    onSuccess: () => { toast.success('Plan saved'); setEditing(undefined); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const action = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'activate' | 'deactivate' | 'delete' }) => plansApi[type](id),
    onSuccess: () => { toast.success('Plan updated'); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const items = query.data?.items ?? [];
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Plans</CardTitle>
            <CardDescription>Create, edit, activate, deactivate, and safely soft-delete subscription plans.</CardDescription>
          </div>
          <Button onClick={() => setEditing(null)}>Create plan</Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input placeholder="Search plans..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </Select>
          <Select value={String(limit)} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
            {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value} / page</option>)}
          </Select>
        </CardContent>
      </Card>
      {query.isLoading ? <TableSkeleton /> : null}
      {query.isError ? <ErrorState message={query.error.message} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError && !items.length ? <EmptyState /> : null}
      {items.length ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader><TableRow>{['Plan', 'Code', 'Billing', 'Monthly', 'Yearly', 'Limits', 'Status', 'Updated', 'Actions'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {items.map((row) => {
                  const id = text(row._id, '');
                  return (
                    <TableRow key={id}>
                      <TableCell><span className="font-semibold">{text(row.name)}</span><p className="max-w-xs truncate text-xs text-muted-foreground">{text(row.description, '')}</p></TableCell>
                      <TableCell>{text(row.code)}</TableCell>
                      <TableCell>{text(row.billingType)}</TableCell>
                      <TableCell>{formatCurrency(row.priceMonthly)}</TableCell>
                      <TableCell>{formatCurrency(row.priceYearly)}</TableCell>
                      <TableCell>{formatNumber(getValue(row, 'limits.teachersLimit'))} teachers / {formatNumber(getValue(row, 'limits.studentsLimit'))} students</TableCell>
                      <TableCell><StatusBadge value={row.deletedAt ? 'deleted' : row.isActive === false ? 'inactive' : 'active'} /></TableCell>
                      <TableCell>{formatDate(row.updatedAt as string)}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(row)}>Edit</Button>
                        {row.isActive === false ? <ConfirmAction title="Activate plan" description="Make this plan available for new purchases." confirmLabel="Activate" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'activate' })}>Activate</ConfirmAction> : <ConfirmAction title="Deactivate plan" description="Existing subscribers keep their saved snapshot until their subscription ends." confirmLabel="Deactivate" variant="destructive" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'deactivate' })}>Deactivate</ConfirmAction>}
                        <ConfirmAction title="Delete plan" description="This soft-deletes the plan for new purchases. Active subscriptions keep their current plan snapshot." confirmLabel="Delete" variant="destructive" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'delete' })}>Delete</ConfirmAction>
                      </div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            <span>Page {query.data?.page ?? page} of {query.data?.totalPages ?? 1} - {formatNumber(query.data?.total ?? 0)} total</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Previous</Button>
              <Button variant="outline" disabled={page >= (query.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </>
      ) : null}
      {editing !== undefined ? <PlanForm initial={editing || undefined} pending={save.isPending} onCancel={() => setEditing(undefined)} onSubmit={(body) => save.mutate({ ...body, _id: text(editing?._id, '') || undefined })} /> : null}
    </div>
  );
}
