import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8001/api';
let accessToken: string | undefined;

export const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
});

export function setApiAccessToken(token?: string) {
  accessToken = token;
}

export function parseApiError(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || 'Something went wrong';
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = parseApiError(error);
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      toast.error('Session expired. Please sign in again.');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  },
);

type Paginated<T = Record<string, unknown>> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const unwrap = async <T>(request: Promise<{ data: { data: T } | T }>): Promise<T> => {
  const response = await request;
  const body = response.data as { data?: T };
  return body.data ?? (response.data as T);
};

export type ListParams = Record<string, string | number | undefined>;

const list = <T = Record<string, unknown>>(path: string, params?: ListParams) => unwrap<Paginated<T>>(apiClient.get(path, { params }));
const details = <T>(path: string) => unwrap<T>(apiClient.get(path));
const patch = <T>(path: string, body?: unknown) => unwrap<T>(apiClient.patch(path, body ?? {}));
const post = <T>(path: string, body?: unknown) => unwrap<T>(apiClient.post(path, body ?? {}));

export const dashboardApi = {
  summary: () => details<Record<string, unknown>>('/admin/dashboard-summary'),
};

export const organizationsApi = {
  list: (params?: ListParams) => list('/admin/organizations', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/organizations/${id}`),
  update: (id: string, body: unknown) => patch(`/admin/organizations/${id}`, body),
  suspend: (id: string) => patch(`/admin/organizations/${id}/suspend`),
  activate: (id: string) => patch(`/admin/organizations/${id}/activate`),
};

export const usersApi = {
  list: (params?: ListParams) => list('/admin/users', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/users/${id}`),
  block: (id: string) => patch(`/admin/users/${id}/block`),
  unblock: (id: string) => patch(`/admin/users/${id}/unblock`),
};

export const teachersApi = {
  list: (params?: ListParams) => list('/admin/teachers', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/teachers/${id}`),
  pause: (id: string, body?: unknown) => patch(`/admin/teachers/${id}/pause`, body),
  reactivate: (id: string) => patch(`/admin/teachers/${id}/reactivate`),
  remove: (id: string) => patch(`/admin/teachers/${id}/remove`),
};

export const studentsApi = {
  list: (params?: ListParams) => list('/admin/students', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/students/${id}`),
};

export const servicesApi = {
  list: (params?: ListParams) => list('/admin/services', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/services/${id}`),
  deactivate: (id: string) => patch(`/admin/services/${id}/deactivate`),
  reactivate: (id: string) => patch(`/admin/services/${id}/reactivate`),
};

export const batchesApi = {
  list: (params?: ListParams) => list('/admin/batches', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/batches/${id}`),
  deactivate: (id: string) => patch(`/admin/batches/${id}/deactivate`),
  reactivate: (id: string) => patch(`/admin/batches/${id}/reactivate`),
};

export const examsApi = {
  list: (params?: ListParams) => list('/admin/exams', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/exams/${id}`),
  cancel: (id: string) => patch(`/admin/exams/${id}/cancel`),
};

export const submissionsApi = {
  list: (params?: ListParams) => list('/admin/submissions', params),
  details: (id: string) => details<Record<string, unknown>>(`/admin/submissions/${id}`),
};

export const rankingsApi = {
  list: (params?: ListParams) => list('/admin/rankings', params),
};

export const plansApi = {
  list: (params?: ListParams) => list('/admin/plans', params),
  create: (body: unknown) => post('/admin/plans', body),
  update: (id: string, body: unknown) => patch(`/admin/plans/${id}`, body),
  deactivate: (id: string) => patch(`/admin/plans/${id}/deactivate`),
};

export const subscriptionsApi = {
  list: (params?: ListParams) => list('/admin/subscriptions', params),
  update: (id: string, body: unknown) => patch(`/admin/subscriptions/${id}`, body),
};

export const paymentsApi = {
  list: (params?: ListParams) => list('/admin/payment-requests', params),
  approve: (id: string, body?: unknown) => patch(`/admin/payment-requests/${id}/approve`, body),
  reject: (id: string, body?: unknown) => patch(`/admin/payment-requests/${id}/reject`, body),
};

export const verificationApi = {
  list: (params?: ListParams) => list('/admin/organization-verifications', params),
  approve: (id: string) => patch(`/admin/organization-verifications/${id}/approve`),
  reject: (id: string, body?: unknown) => patch(`/admin/organization-verifications/${id}/reject`, body),
};

export const reportsApi = {
  summary: () => details<Record<string, unknown>>('/admin/reports'),
};

export const teacherRequestsApi = {
  list: (params?: ListParams) => list('/admin/teacher-join-requests', params),
};
