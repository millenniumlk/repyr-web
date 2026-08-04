import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from './Skeleton';
import { Button } from './Button';
import { Plus } from 'lucide-react';

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn("flex flex-col items-center text-center max-w-md mx-auto w-full px-4 py-12", className)}
    >
      {Icon && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <Icon className="w-16 h-16 text-muted-foreground/50" strokeWidth={1.5} />
        </motion.div>
      )}
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[28px] md:text-3xl font-bold text-foreground tracking-tight leading-tight mb-4"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-muted-foreground max-w-sm mb-10 leading-relaxed text-[15px]"
        >
          {description}
        </motion.p>
      )}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button onClick={onAction} className="font-medium">
            <Plus className="w-5 h-5 mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
