import { Badge } from '@/components/ui/badge';
import { cn, labelize } from '@/lib/utils';

const colors: Record<string, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  verified: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  published: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  paused: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  draft: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
  cancelled: 'border-red-500/30 bg-red-500/10 text-red-300',
  suspended: 'border-red-500/30 bg-red-500/10 text-red-300',
  inactive: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-300',
  reviewed: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = String(value || 'unknown').toLowerCase();
  return <Badge className={cn(colors[normalized] || 'bg-muted text-muted-foreground')}>{labelize(normalized)}</Badge>;
}
