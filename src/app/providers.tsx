'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { setApiAccessToken } from '@/lib/api';

function TokenBridge() {
  const { data } = useSession();
  useEffect(() => {
    setApiAccessToken(data?.accessToken);
  }, [data?.accessToken]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TokenBridge />
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
