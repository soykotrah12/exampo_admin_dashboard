'use client';

import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  FileText,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookTabs,
  PackageCheck,
  Receipt,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/users', label: 'Users', icon: UserCog },
  { href: '/teachers', label: 'Teachers', icon: Users },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/services', label: 'Services', icon: Layers3 },
  { href: '/batches', label: 'Batches', icon: NotebookTabs },
  { href: '/exams', label: 'Exams', icon: ClipboardCheck },
  { href: '/submissions', label: 'Submissions', icon: FileText },
  { href: '/rankings', label: 'Rankings', icon: BarChart3 },
  { href: '/plans', label: 'Plans', icon: PackageCheck },
  { href: '/subscriptions', label: 'Subscriptions', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const routeQueryKeys: Record<string, string[]> = {
  '/dashboard': ['dashboard-summary'],
  '/organizations': ['organizations'],
  '/users': ['users'],
  '/teachers': ['teachers'],
  '/students': ['students'],
  '/services': ['services'],
  '/batches': ['batches'],
  '/exams': ['exams'],
  '/submissions': ['submissions'],
  '/rankings': ['rankings'],
  '/plans': ['plans'],
  '/subscriptions': ['subscriptions'],
  '/payments': ['payments'],
  '/verification': ['verification'],
  '/reports': ['reports'],
  '/settings': ['admin-profile'],
};

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full flex-col bg-black">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-black">ES</div>
        <div>
          <p className="font-black leading-none">Exam SaaS</p>
          <p className="text-xs text-muted-foreground">Super Admin</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground',
                active && 'bg-white text-black hover:bg-white hover:text-black',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data } = useSession();
  const activeQueryKeys = useMemo(() => {
    const route = Object.keys(routeQueryKeys).find((path) => pathname === path || pathname.startsWith(`${path}/`));
    return route ? routeQueryKeys[route] : ['dashboard-summary'];
  }, [pathname]);
  const isFetching = useIsFetching({ predicate: (query) => activeQueryKeys.includes(String(query.queryKey[0])) });
  const title = useMemo(() => {
    const found = nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return found?.label ?? 'Dashboard';
  }, [pathname]);

  const refreshCurrentPage = async () => {
    setRefreshing(true);
    await Promise.all(activeQueryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border lg:block">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close sidebar" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 border-r border-border">
            <div className="absolute right-3 top-3 z-10">
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-black/85 px-4 backdrop-blur md:px-6">
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black md:text-xl">{title}</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Manage platform data organization-wise.</p>
          </div>
          <div className="hidden w-72 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground md:flex">
            <Search className="h-4 w-4" />
            Use page search and filters
          </div>
          <Button variant="outline" size="sm" onClick={refreshCurrentPage} disabled={refreshing || Boolean(isFetching)}>
            <RefreshCcw className={`h-4 w-4 ${refreshing || isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar name={data?.user?.name ?? 'Admin'} src={data?.user?.avatarUrl} />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{data?.user?.name ?? 'Super Admin'}</p>
              <p className="text-xs text-muted-foreground">{data?.user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
