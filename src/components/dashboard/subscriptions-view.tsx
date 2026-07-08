'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { plansApi, subscriptionsApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
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

function text(value: unknown, fallback = '-') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function nested(row: Row, path: string, fallback = '-') {
  return text(getValue(row, path), fallback);
}

function orgCell(row: Row) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={text(row.name)} src={text(row.logoUrl ?? row.avatarUrl, '')} />
      <div>
        <p className="font-semibold">{text(row.name)}</p>
        <p className="text-xs text-muted-foreground">{text(row.email, '')}</p>
      </div>
    </div>
  );
}

function Modal({ title, description, children, onClose }: { title: string; description?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl">
        <h2 className="text-lg font-black">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-semibold"><span>{label}</span>{children}</label>;
}

export function SubscriptionsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [dialog, setDialog] = useState<'details' | 'change' | 'extend' | 'refund' | 'note' | null>(null);
  const [changeForm, setChangeForm] = useState({ planId: '', billingCycle: 'monthly', apply: 'now', endDate: '' });
  const [extendForm, setExtendForm] = useState({ days: 30, endDate: '', note: '' });
  const [refundForm, setRefundForm] = useState({ amount: 0, reason: '', note: '' });
  const [note, setNote] = useState('');
  const params = useMemo(() => ({ page, limit, search: search || undefined, status: status || undefined }), [page, limit, search, status]);
  const query = useQuery({ queryKey: ['subscriptions', params], queryFn: () => subscriptionsApi.list(params), refetchInterval: 60_000 });
  const plans = useQuery({ queryKey: ['plans', 'active-options'], queryFn: () => plansApi.list({ status: 'active', limit: 100 }), refetchInterval: 60_000 });
  const details = useQuery({ queryKey: ['subscription-details', selected?._id], queryFn: () => subscriptionsApi.details(text(selected?._id, '')), enabled: Boolean(selected?._id && dialog === 'details') });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };
  const action = useMutation({
    mutationFn: ({ id, type, body }: { id: string; type: 'changePlan' | 'cancel' | 'refund' | 'extend' | 'activate' | 'deactivate' | 'addNote'; body?: unknown }) => {
      if (type === 'activate' || type === 'deactivate') return subscriptionsApi[type](id);
      return subscriptionsApi[type](id, body);
    },
    onSuccess: () => { toast.success('Subscription updated'); setDialog(null); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const items = query.data?.items ?? [];
  const activePlans = plans.data?.items ?? [];
  const open = (row: Row, next: typeof dialog) => {
    setSelected(row);
    setDialog(next);
    setNote(text(row.subscriptionAdminNote, ''));
    setChangeForm({ planId: text(getValue(row, 'plan._id'), ''), billingCycle: text(row.subscriptionBillingCycle, 'monthly'), apply: 'now', endDate: '' });
  };
  const selectedId = text(selected?._id, '');
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Manage organization-specific subscriptions without changing existing plan snapshots for other organizations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input placeholder="Search subscriptions..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['free', 'active', 'trialing', 'pending', 'cancelled', 'expired', 'refunded'].map((value) => <option key={value} value={value}>{value}</option>)}
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
              <TableHeader><TableRow>{['Organization', 'Owner', 'Current plan', 'Snapshot', 'Status', 'Ends', 'Amount', 'Payment', 'Updated', 'Actions'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {items.map((row) => {
                  const id = text(row._id, '');
                  return (
                    <TableRow key={id}>
                      <TableCell>{orgCell(row)}</TableCell>
                      <TableCell>{nested(row, 'owner.email')}</TableCell>
                      <TableCell>{nested(row, 'plan.name', 'Free')}</TableCell>
                      <TableCell><span className="rounded-full border border-border px-2 py-1 text-xs">{nested(row, 'planSnapshot.name', 'No snapshot')}</span></TableCell>
                      <TableCell><StatusBadge value={text(row.subscriptionStatus, 'free')} /></TableCell>
                      <TableCell>{formatDate(row.subscriptionEndDate as string)}</TableCell>
                      <TableCell>{formatCurrency(row.subscriptionAmount ?? getValue(row, 'planSnapshot.price'))}</TableCell>
                      <TableCell>{text(row.subscriptionPaymentStatus, '-')}</TableCell>
                      <TableCell>{formatDate(row.updatedAt as string)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => open(row, 'details')}>Details</Button>
                          <Button size="sm" variant="outline" onClick={() => open(row, 'change')}>Change plan</Button>
                          <Button size="sm" variant="outline" onClick={() => open(row, 'extend')}>Extend</Button>
                          <Button size="sm" variant="outline" onClick={() => open(row, 'note')}>Note</Button>
                          <Button size="sm" variant="outline" onClick={() => open(row, 'refund')}>Refund</Button>
                          {row.subscriptionStatus === 'active' ? (
                            <ConfirmAction title="Deactivate subscription" description="Deactivate this organization subscription." confirmLabel="Deactivate" variant="destructive" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'deactivate' })}>Deactivate</ConfirmAction>
                          ) : (
                            <ConfirmAction title="Activate subscription" description="Reactivate this organization subscription." confirmLabel="Activate" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'activate' })}>Activate</ConfirmAction>
                          )}
                          <ConfirmAction title="Cancel subscription" description="Cancel this subscription immediately. You can still mark a refund separately." confirmLabel="Cancel subscription" variant="destructive" pending={action.isPending} onConfirm={() => action.mutate({ id, type: 'cancel', body: { cancelAtPeriodEnd: false, reason: 'Cancelled by super admin' } })}>Cancel</ConfirmAction>
                        </div>
                      </TableCell>
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

      {dialog === 'details' && selected ? (
        <Modal title="Subscription details" onClose={() => setDialog(null)}>
          {details.isLoading ? <TableSkeleton /> : (
            <div className="grid gap-4 text-sm md:grid-cols-2">
              {[
                ['Organization', text(details.data?.name ?? selected.name)],
                ['Owner', text(getValue((details.data || selected) as Row, 'owner.email'))],
                ['Status', text((details.data || selected).subscriptionStatus)],
                ['Plan snapshot', text(getValue((details.data || selected) as Row, 'planSnapshot.name'), 'No snapshot')],
                ['Teacher limit', formatNumber(getValue((details.data || selected) as Row, 'planSnapshot.teacherLimit'))],
                ['Student limit', formatNumber(getValue((details.data || selected) as Row, 'planSnapshot.studentLimit'))],
                ['Started', formatDate((details.data || selected).subscriptionStartDate as string)],
                ['Ends', formatDate((details.data || selected).subscriptionEndDate as string)],
                ['Payment', text((details.data || selected).subscriptionPaymentStatus)],
                ['Admin note', text((details.data || selected).subscriptionAdminNote)],
              ].map(([label, value]) => <div key={label} className="rounded-md border border-border p-3"><p className="text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>)}
            </div>
          )}
        </Modal>
      ) : null}

      {dialog === 'change' && selected ? (
        <Modal title="Change plan" description="Apply now copies the selected plan into this organization snapshot." onClose={() => setDialog(null)}>
          <form className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); action.mutate({ id: selectedId, type: 'changePlan', body: changeForm }); }}>
            <Field label="Plan"><Select value={changeForm.planId} onChange={(event) => setChangeForm((value) => ({ ...value, planId: event.target.value }))}>{activePlans.map((plan) => <option key={text(plan._id)} value={text(plan._id)}>{text(plan.name)} ({text(plan.code)})</option>)}</Select></Field>
            <Field label="Billing cycle"><Select value={changeForm.billingCycle} onChange={(event) => setChangeForm((value) => ({ ...value, billingCycle: event.target.value }))}><option value="monthly">monthly</option><option value="yearly">yearly</option><option value="free">free</option><option value="custom">custom</option></Select></Field>
            <Field label="Apply behavior"><Select value={changeForm.apply} onChange={(event) => setChangeForm((value) => ({ ...value, apply: event.target.value }))}><option value="now">Apply now</option><option value="later">Apply after current period ends</option></Select></Field>
            <Field label="End/effective date"><Input type="date" value={changeForm.endDate} onChange={(event) => setChangeForm((value) => ({ ...value, endDate: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button disabled={action.isPending}>Save</Button></div>
          </form>
        </Modal>
      ) : null}

      {dialog === 'extend' && selected ? (
        <Modal title="Extend subscription" onClose={() => setDialog(null)}>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action.mutate({ id: selectedId, type: 'extend', body: extendForm }); }}>
            <Field label="Add days"><Input type="number" min="1" value={extendForm.days} onChange={(event) => setExtendForm((value) => ({ ...value, days: Number(event.target.value || 1) }))} /></Field>
            <Field label="Or set new end date"><Input type="date" value={extendForm.endDate} onChange={(event) => setExtendForm((value) => ({ ...value, endDate: event.target.value }))} /></Field>
            <Field label="Admin note"><Input value={extendForm.note} onChange={(event) => setExtendForm((value) => ({ ...value, note: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button disabled={action.isPending}>Extend</Button></div>
          </form>
        </Modal>
      ) : null}

      {dialog === 'refund' && selected ? (
        <Modal title="Mark refunded" description="This records an admin refund marker; gateway refund can be handled separately." onClose={() => setDialog(null)}>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action.mutate({ id: selectedId, type: 'refund', body: refundForm }); }}>
            <Field label="Refund amount"><Input type="number" min="0" value={refundForm.amount} onChange={(event) => setRefundForm((value) => ({ ...value, amount: Number(event.target.value || 0) }))} /></Field>
            <Field label="Reason"><Input value={refundForm.reason} onChange={(event) => setRefundForm((value) => ({ ...value, reason: event.target.value }))} /></Field>
            <Field label="Note"><Input value={refundForm.note} onChange={(event) => setRefundForm((value) => ({ ...value, note: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button variant="destructive" disabled={action.isPending}>Mark refunded</Button></div>
          </form>
        </Modal>
      ) : null}

      {dialog === 'note' && selected ? (
        <Modal title="Admin note" onClose={() => setDialog(null)}>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action.mutate({ id: selectedId, type: 'addNote', body: { note } }); }}>
            <textarea className="min-h-32 w-full rounded-md border border-input bg-black px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button disabled={action.isPending}>Save note</Button></div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
