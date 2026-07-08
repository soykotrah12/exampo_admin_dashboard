'use client';

import { Loader2, LockKeyhole } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get('callbackUrl');
  const destination = callbackUrl && callbackUrl !== '/' ? callbackUrl : '/dashboard';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: destination,
    });
    setLoading(false);
    if (result?.error) {
      toast.error(result.error === 'CredentialsSignin' ? 'Invalid credentials or not a super admin.' : result.error);
      return;
    }
    toast.success('Welcome back.');
    const nextUrl = result?.url ? new URL(result.url, window.location.origin) : null;
    router.replace(nextUrl?.pathname === '/' ? '/dashboard' : `${nextUrl?.pathname || destination}${nextUrl?.search || ''}`);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-border bg-black p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white font-black text-black">ES</div>
          <div>
            <p className="font-black">Exam SaaS</p>
            <p className="text-xs text-muted-foreground">Platform control center</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Super Admin</p>
          <h1 className="text-5xl font-black tracking-tight">Manage every organization from one premium dashboard.</h1>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Monitor organizations, users, plans, subscriptions, verification requests, exams, rankings, and platform reports.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">NEXT_PUBLIC_BASE_URL powers all backend API calls.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Use a super_admin account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="email">Email</label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="password">Password</label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
