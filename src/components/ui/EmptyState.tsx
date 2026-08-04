import type { LucideIcon } from 'lucide-react';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from './Skeleton';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
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
      {Icon && (
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-[28px] md:text-3xl font-normal text-primary tracking-tight leading-tight mb-8">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed text-[15px]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="w-full flex items-center justify-between px-5 py-4 h-auto rounded-2xl shadow-sm hover:bg-primary/90 transition-colors group"
        >
          <div className="flex items-center">
            <div className="mr-4 text-white">
              <Plus className="w-[22px] h-[22px]" strokeWidth={2.2} />
            </div>
            <span className="text-[16px] tracking-tight font-medium text-white">
              {actionLabel}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" strokeWidth={2} />
        </Button>
      )}
    </div>
  );
}
