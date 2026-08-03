import type { LucideIcon } from 'lucide-react';
import { cn } from './Skeleton';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("glass rounded-3xl p-12 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm w-full", className)}>
      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed text-[15px]">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="px-8 py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
