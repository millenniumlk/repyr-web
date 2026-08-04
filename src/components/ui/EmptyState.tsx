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
    <div className={cn("flex flex-col items-center text-center max-w-lg mx-auto w-full", className)}>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-60"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-xl border border-gray-200/50 rounded-full flex items-center justify-center shadow-soft">
          <Icon className="w-10 h-10 text-primary opacity-80" />
        </div>
      </div>
      <h3 className="text-[28px] font-black mb-3 tracking-tighter text-gray-900">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed text-[15px] font-medium">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
