import { cn } from '@/lib/utils';

type TabsProps = {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn('rounded-md px-3 py-2 text-sm font-semibold capitalize text-muted-foreground transition', value === tab && 'bg-primary text-primary-foreground')}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
