'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  batchesApi,
  examsApi,
  organizationsApi,
  paymentsApi,
  plansApi,
  rankingsApi,
  servicesApi,
  studentsApi,
  submissionsApi,
  subscriptionsApi,
  teachersApi,
  usersApi,
  verificationApi,
  type ListParams,
} from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmAction } from '@/components/dashboard/confirm-action';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/dashboard/page-states';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatCurrency, formatDate, formatNumber, getValue, labelize } from '@/lib/utils';

type Row = Record<string, unknown>;
type PageData = {
  items: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
type Column = {
  header: string;
  render: (row: Row) => ReactNode;
  mobile?: boolean;
};
type Filter = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
};
type RowAction = {
  label: string;
  confirmLabel: string;
  description: string;
  destructive?: boolean;
  hide?: (row: Row) => boolean;
  run: (row: Row) => Promise<unknown>;
};
type ResourceConfig = {
  title: string;
  description: string;
  queryKey: string;
  list: (params: ListParams) => Promise<PageData>;
  filters?: Filter[];
  columns: Column[];
  actions?: RowAction[];
};

function text(value: unknown, fallback = 'Not provided') {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
}

function id(row: Row) {
  return text(row._id, '');
}

function nested(row: Row, path: string, fallback = 'Not provided') {
  return text(getValue(row, path), fallback);
}

function count(row: Row, path: string) {
  return formatNumber(getValue(row, path) ?? 0);
}

function orgCell(row: Row) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={text(row.name)} src={text(row.logoUrl ?? row.avatarUrl, '')} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{text(row.name)}</p>
        <p className="truncate text-xs text-muted-foreground">{text(row.email, '')}</p>
      </div>
    </div>
  );
}

function userCell(row: Row) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={text(row.name)} src={text(row.avatarUrl, '')} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{text(row.name)}</p>
        <p className="truncate text-xs text-muted-foreground">{text(row.email, '')}</p>
      </div>
    </div>
  );
}

function arrayCount(row: Row, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value.length : Number(value || 0);
}

const statusFilter: Filter = {
  key: 'status',
  label: 'Status',
  options: [
    { label: 'All statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Paused', value: 'paused' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Verified', value: 'verified' },
    { label: 'Rejected', value: 'rejected' },
  ],
};

const roleFilter: Filter = {
  key: 'role',
  label: 'Role',
  options: [
    { label: 'All roles', value: '' },
    { label: 'Organization owners', value: 'organization_owner' },
    { label: 'Teachers', value: 'teacher' },
    { label: 'Students', value: 'student' },
    { label: 'Super admins', value: 'super_admin' },
  ],
};

const configs: Record<string, ResourceConfig> = {
  organizations: {
    title: 'Organizations',
    description: 'Search, filter, inspect, suspend, and activate institutes across the platform.',
    queryKey: 'organizations',
    list: organizationsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Organization', render: orgCell, mobile: true },
      { header: 'Code', render: (row) => text(row.organizationCode, '-') },
      { header: 'Owner', render: (row) => nested(row, 'owner.name') },
      { header: 'Teachers', render: (row) => count(row, 'counts.teachers') },
      { header: 'Students', render: (row) => count(row, 'counts.students') },
      { header: 'Plan', render: (row) => nested(row, 'plan.name', 'Free') },
      { header: 'Verification', render: (row) => <StatusBadge value={text(row.verificationStatus, 'unverified')} /> },
      { header: 'Status', render: (row) => <StatusBadge value={row.isActive === false ? 'suspended' : 'active'} /> },
      { header: 'Created', render: (row) => formatDate(row.createdAt as string) },
    ],
    actions: [
      { label: 'View', confirmLabel: 'Open', description: 'Open organization details.', run: async (row) => Promise.resolve(window.location.assign(`/organizations/${id(row)}`)) },
      { label: 'Suspend', confirmLabel: 'Suspend', description: 'Suspend this organization and its access.', destructive: true, hide: (row) => row.isActive === false, run: (row) => organizationsApi.suspend(id(row)) },
      { label: 'Activate', confirmLabel: 'Activate', description: 'Reactivate this organization.', hide: (row) => row.isActive !== false, run: (row) => organizationsApi.activate(id(row)) },
    ],
  },
  users: {
    title: 'Users',
    description: 'All platform accounts with role, organization, and access status.',
    queryKey: 'users',
    list: usersApi.list,
    filters: [roleFilter, statusFilter],
    columns: [
      { header: 'User', render: userCell, mobile: true },
      { header: 'Role', render: (row) => labelize(text(row.role)) },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Status', render: (row) => <StatusBadge value={row.isActive === false ? 'blocked' : 'active'} /> },
      { header: 'Created', render: (row) => formatDate(row.createdAt as string) },
    ],
    actions: [
      { label: 'Block', confirmLabel: 'Block', description: 'Block this user account.', destructive: true, hide: (row) => row.isActive === false, run: (row) => usersApi.block(id(row)) },
      { label: 'Unblock', confirmLabel: 'Unblock', description: 'Allow this user to sign in again.', hide: (row) => row.isActive !== false, run: (row) => usersApi.unblock(id(row)) },
    ],
  },
  teachers: {
    title: 'Teachers',
    description: 'Teachers across every organization, including assignments and access status.',
    queryKey: 'teachers',
    list: teachersApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Teacher', render: userCell, mobile: true },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.status ?? row.organizationAccessStatus, 'active')} /> },
      { header: 'Services', render: (row) => formatNumber(row.assignedServicesCount ?? arrayCount(row, 'assignedServices')) },
      { header: 'Batches', render: (row) => formatNumber(row.assignedBatchesCount ?? arrayCount(row, 'assignedBatches')) },
      { header: 'Joined', render: (row) => formatDate(row.createdAt as string) },
    ],
    actions: [
      { label: 'Pause', confirmLabel: 'Pause', description: 'Pause teacher organization access.', destructive: true, hide: (row) => row.organizationAccessStatus === 'paused', run: (row) => teachersApi.pause(id(row), { reason: 'Paused by super admin' }) },
      { label: 'Reactivate', confirmLabel: 'Reactivate', description: 'Reactivate this teacher.', hide: (row) => row.organizationAccessStatus !== 'paused', run: (row) => teachersApi.reactivate(id(row)) },
      { label: 'Remove', confirmLabel: 'Remove', description: 'Remove teacher from their organization.', destructive: true, run: (row) => teachersApi.remove(id(row)) },
    ],
  },
  students: {
    title: 'Students',
    description: 'Students, organization membership, batches, submissions, and score summaries.',
    queryKey: 'students',
    list: studentsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Student', render: userCell, mobile: true },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Batches', render: (row) => formatNumber(arrayCount(row, 'batches')) },
      { header: 'Submissions', render: (row) => count(row, 'performance.submissionsCount') },
      { header: 'Avg score', render: (row) => Number(getValue(row, 'performance.averageScore') || 0).toFixed(1) },
      { header: 'Created', render: (row) => formatDate(row.createdAt as string) },
    ],
  },
  services: {
    title: 'Services',
    description: 'All services across organizations with batch, student, teacher, and exam counts.',
    queryKey: 'services',
    list: servicesApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Service', render: (row) => <span className="font-semibold">{text(row.name)}</span>, mobile: true },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Batches', render: (row) => formatNumber(row.totalBatches) },
      { header: 'Teachers', render: (row) => formatNumber(row.totalTeachers) },
      { header: 'Students', render: (row) => formatNumber(row.totalStudents) },
      { header: 'Exams', render: (row) => formatNumber(row.examsCount) },
      { header: 'Status', render: (row) => <StatusBadge value={row.isActive === false ? 'inactive' : 'active'} /> },
    ],
    actions: [
      { label: 'Deactivate', confirmLabel: 'Deactivate', description: 'Deactivate this service.', destructive: true, hide: (row) => row.isActive === false, run: (row) => servicesApi.deactivate(id(row)) },
      { label: 'Reactivate', confirmLabel: 'Reactivate', description: 'Reactivate this service.', hide: (row) => row.isActive !== false, run: (row) => servicesApi.reactivate(id(row)) },
    ],
  },
  batches: {
    title: 'Batches',
    description: 'Batch enrollment and activity across services and organizations.',
    queryKey: 'batches',
    list: batchesApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Batch', render: (row) => <span className="font-semibold">{text(row.name)}</span>, mobile: true },
      { header: 'Code', render: (row) => text(row.batchCode, '-') },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Service', render: (row) => nested(row, 'service.name') },
      { header: 'Students', render: (row) => formatNumber(row.studentsCount) },
      { header: 'Teachers', render: (row) => formatNumber(row.teachersCount) },
      { header: 'Exams', render: (row) => formatNumber(row.examsCount) },
      { header: 'Status', render: (row) => <StatusBadge value={row.isActive === false ? 'inactive' : 'active'} /> },
    ],
    actions: [
      { label: 'Deactivate', confirmLabel: 'Deactivate', description: 'Deactivate this batch.', destructive: true, hide: (row) => row.isActive === false, run: (row) => batchesApi.deactivate(id(row)) },
      { label: 'Reactivate', confirmLabel: 'Reactivate', description: 'Reactivate this batch.', hide: (row) => row.isActive !== false, run: (row) => batchesApi.reactivate(id(row)) },
    ],
  },
  exams: {
    title: 'Exams',
    description: 'Exam slots, status, assigned batches, result state, and submission volume.',
    queryKey: 'exams',
    list: examsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Exam', render: (row) => <span className="font-semibold">{text(row.title)}</span>, mobile: true },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Teacher', render: (row) => nested(row, 'createdBy.name') },
      { header: 'Type', render: (row) => text(row.examType) },
      { header: 'Start', render: (row) => formatDate(row.startDateTime as string) },
      { header: 'Submissions', render: (row) => formatNumber(row.submissionsCount) },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.status)} /> },
    ],
    actions: [
      { label: 'Cancel', confirmLabel: 'Cancel exam', description: 'Cancel this exam slot.', destructive: true, hide: (row) => row.status === 'cancelled', run: (row) => examsApi.cancel(id(row)) },
    ],
  },
  submissions: {
    title: 'Submissions',
    description: 'Submitted exam attempts and published result status across the platform.',
    queryKey: 'submissions',
    list: submissionsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Student', render: (row) => nested(row, 'student.name'), mobile: true },
      { header: 'Exam', render: (row) => nested(row, 'examSlot.title') },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'MCQ', render: (row) => formatNumber(row.mcqScore) },
      { header: 'Written', render: (row) => formatNumber(row.writtenScore) },
      { header: 'Total', render: (row) => formatNumber(row.totalScore) },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.status)} /> },
      { header: 'Submitted', render: (row) => formatDate(row.submittedAt as string) },
    ],
  },
  rankings: {
    title: 'Rankings',
    description: 'Student rankings by organization, batch, and score performance.',
    queryKey: 'rankings',
    list: rankingsApi.list,
    columns: [
      { header: 'Rank', render: (row) => `#${formatNumber(row.rank)}`, mobile: true },
      { header: 'Student', render: (row) => nested(row, 'student.name') },
      { header: 'Organization', render: (row) => nested(row, 'organization.name') },
      { header: 'Batch', render: (row) => nested(row, 'batch.name') },
      { header: 'Submitted', render: (row) => formatNumber(row.submittedExams) },
      { header: 'Average', render: (row) => Number(row.averageScore || 0).toFixed(1) },
      { header: 'Percentage', render: (row) => `${Number(row.percentage || 0).toFixed(1)}%` },
    ],
  },
  plans: {
    title: 'Plans',
    description: 'Plan pricing and limit controls for organization subscriptions.',
    queryKey: 'plans',
    list: plansApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Plan', render: (row) => <span className="font-semibold">{text(row.name)}</span>, mobile: true },
      { header: 'Code', render: (row) => text(row.code, '-') },
      { header: 'Monthly', render: (row) => formatCurrency(row.priceMonthly) },
      { header: 'Yearly', render: (row) => formatCurrency(row.priceYearly) },
      { header: 'Teachers', render: (row) => count(row, 'limits.teachersLimit') },
      { header: 'Students', render: (row) => count(row, 'limits.studentsLimit') },
      { header: 'Status', render: (row) => <StatusBadge value={row.isActive === false ? 'inactive' : 'active'} /> },
    ],
    actions: [
      { label: 'Deactivate', confirmLabel: 'Deactivate', description: 'Deactivate this plan.', destructive: true, hide: (row) => row.isActive === false, run: (row) => plansApi.deactivate(id(row)) },
    ],
  },
  subscriptions: {
    title: 'Subscriptions',
    description: 'Organization subscriptions, assigned plans, and billing status.',
    queryKey: 'subscriptions',
    list: subscriptionsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Organization', render: orgCell, mobile: true },
      { header: 'Plan', render: (row) => nested(row, 'plan.name', 'Free') },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.subscriptionStatus, 'free')} /> },
      { header: 'Owner', render: (row) => nested(row, 'owner.email') },
      { header: 'Started', render: (row) => formatDate(row.subscriptionStartDate as string) },
      { header: 'Ends', render: (row) => formatDate(row.subscriptionEndDate as string) },
    ],
  },
  payments: {
    title: 'Payments',
    description: 'Upgrade and payment requests awaiting admin review.',
    queryKey: 'payments',
    list: paymentsApi.list,
    filters: [statusFilter],
    columns: [
      { header: 'Organization', render: (row) => nested(row, 'organization.name'), mobile: true },
      { header: 'Plan', render: (row) => nested(row, 'plan.name') },
      { header: 'Amount', render: (row) => formatCurrency(row.amount) },
      { header: 'Method', render: (row) => text(row.paymentMethod, '-') },
      { header: 'Transaction', render: (row) => text(row.transactionId, '-') },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.status)} /> },
      { header: 'Submitted', render: (row) => formatDate(row.createdAt as string) },
    ],
    actions: [
      { label: 'Approve', confirmLabel: 'Approve', description: 'Approve this payment and activate the requested plan.', hide: (row) => row.status !== 'pending', run: (row) => paymentsApi.approve(id(row), { note: 'Approved by super admin' }) },
      { label: 'Reject', confirmLabel: 'Reject', description: 'Reject this payment request.', destructive: true, hide: (row) => row.status !== 'pending', run: (row) => paymentsApi.reject(id(row), { note: 'Rejected by super admin' }) },
    ],
  },
  verification: {
    title: 'Verification',
    description: 'Organization verification requests with uploaded document review links.',
    queryKey: 'verification',
    list: verificationApi.list,
    filters: [{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Verified', value: 'verified' }, { label: 'Rejected', value: 'rejected' }] }],
    columns: [
      { header: 'Organization', render: orgCell, mobile: true },
      { header: 'Category', render: (row) => text(row.category ?? row.type, '-') },
      { header: 'Document', render: (row) => text(row.verificationDocumentUrl, '') ? <a className="text-white underline" href={text(row.verificationDocumentUrl, '')} target="_blank">View PDF</a> : '-' },
      { header: 'Status', render: (row) => <StatusBadge value={text(row.verificationStatus)} /> },
      { header: 'Submitted', render: (row) => formatDate(row.verificationSubmittedAt as string) },
    ],
    actions: [
      { label: 'Approve', confirmLabel: 'Approve', description: 'Mark this organization as verified.', hide: (row) => row.verificationStatus !== 'pending', run: (row) => verificationApi.approve(id(row)) },
      { label: 'Reject', confirmLabel: 'Reject', description: 'Reject this verification request.', destructive: true, hide: (row) => row.verificationStatus !== 'pending', run: (row) => verificationApi.reject(id(row), { reason: 'Rejected by super admin' }) },
    ],
  },
};

export function AdminResourcePage({ resource }: { resource: keyof typeof configs }) {
  const config = configs[resource];
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const params = useMemo(() => ({ page, limit, search: search || undefined, ...filters }), [page, limit, search, filters]);
  const query = useQuery({
    queryKey: [config.queryKey, params],
    queryFn: () => config.list(params),
  });
  const mutation = useMutation({
    mutationFn: (action: { row: Row; action: RowAction }) => action.action.run(action.row),
    onSuccess: (_data, variables) => {
      toast.success(`${variables.action.label} completed.`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    },
    onError: (error) => toast.error(error.message || 'Something went wrong'),
  });

  const data = query.data;
  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${config.title.toLowerCase()}...`}
            />
            {config.filters?.map((filter) => (
              <Select
                key={filter.key}
                value={filters[filter.key] ?? ''}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, [filter.key]: event.target.value || undefined }));
                  setPage(1);
                }}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            ))}
            <Select value={String(limit)} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
              {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value} / page</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <TableSkeleton /> : null}
      {query.isError ? <ErrorState message={query.error.message} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError && items.length === 0 ? <EmptyState /> : null}

      {!query.isLoading && !query.isError && items.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column) => <TableHead key={column.header}>{column.header}</TableHead>)}
                  {config.actions?.length ? <TableHead>Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={id(row)}>
                    {config.columns.map((column) => <TableCell key={column.header}>{column.render(row)}</TableCell>)}
                    {config.actions?.length ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {config.actions.filter((action) => !action.hide?.(row)).map((action) => (
                            <ConfirmAction
                              key={action.label}
                              title={action.label}
                              description={action.description}
                              confirmLabel={action.confirmLabel}
                              variant={action.destructive ? 'destructive' : 'outline'}
                              pending={mutation.isPending}
                              onConfirm={() => mutation.mutate({ row, action })}
                            >
                              {action.label}
                            </ConfirmAction>
                          ))}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((row) => (
              <Card key={id(row)}>
                <CardContent className="space-y-3 pt-5">
                  {config.columns.filter((column) => column.mobile).map((column) => <div key={column.header}>{column.render(row)}</div>)}
                  {config.columns.filter((column) => !column.mobile).slice(0, 5).map((column) => (
                    <div key={column.header} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{column.header}</span>
                      <span className="text-right">{column.render(row)}</span>
                    </div>
                  ))}
                  {config.actions?.length ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {config.actions.filter((action) => !action.hide?.(row)).map((action) => (
                        <ConfirmAction
                          key={action.label}
                          title={action.label}
                          description={action.description}
                          confirmLabel={action.confirmLabel}
                          variant={action.destructive ? 'destructive' : 'outline'}
                          pending={mutation.isPending}
                          onConfirm={() => mutation.mutate({ row, action })}
                        >
                          {action.label}
                        </ConfirmAction>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data?.page ?? page} of {data?.totalPages ?? 1} - {formatNumber(data?.total ?? 0)} total
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Previous</Button>
              <Button variant="outline" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
