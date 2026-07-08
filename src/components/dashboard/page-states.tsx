import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'No data found', message = 'Try changing your search or filters.' }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black">Could not load data</p>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>Retry</Button>
    </Alert>
  );
}
