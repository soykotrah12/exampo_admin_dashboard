'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name?: string;
  src?: string;
  className?: string;
};

export function Avatar({ name = '?', src, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const resolvedSrc = useMemo(() => resolveAvatarSrc(src), [src]);
  const [failedSrc, setFailedSrc] = useState('');

  useEffect(() => {
    setFailedSrc('');
  }, [resolvedSrc]);

  const imageSrc = resolvedSrc && resolvedSrc !== failedSrc ? resolvedSrc : '';
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold', className)}>
      {imageSrc ? <Image src={imageSrc} alt={name} width={72} height={72} className="h-full w-full object-cover" onError={() => setFailedSrc(imageSrc)} /> : initial}
    </div>
  );
}

function resolveAvatarSrc(src?: string) {
  const value = String(src || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/')) return value;

  const apiBase = process.env.NEXT_PUBLIC_BASE_URL || '';
  try {
    const backendOrigin = new URL(apiBase).origin;
    return `${backendOrigin}${value}`;
  } catch (_) {
    return value;
  }
}
