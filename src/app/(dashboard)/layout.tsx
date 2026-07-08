import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/dashboard/app-shell';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/dashboard');
  if (session.role !== 'super_admin') redirect('/unauthorized');
  return <AppShell>{children}</AppShell>;
}
