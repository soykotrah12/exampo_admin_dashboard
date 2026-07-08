'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';

type ConfirmActionProps = {
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  children: ReactNode;
  onConfirm: () => void;
};

export function ConfirmAction({
  title,
  description,
  confirmLabel,
  pending,
  variant = 'outline',
  children,
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)} disabled={pending}>
        {children}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close dialog" className="absolute inset-0 bg-black/75" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                disabled={pending}
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
