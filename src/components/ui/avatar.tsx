import Image from 'next/image';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name?: string;
  src?: string;
  className?: string;
};

export function Avatar({ name = '?', src, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold', className)}>
      {src ? <Image src={src} alt={name} width={72} height={72} className="h-full w-full object-cover" /> : initial}
    </div>
  );
}
