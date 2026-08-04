
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../lib/ToastContext';
import { cn } from '../../lib/utils';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

const Toast = ({ toast, onDismiss }: ToastProps) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-full",
        "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md",
        "shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-white/10",
        "min-w-[280px] max-w-md"
      )}
    >
      <div className="shrink-0">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {toast.message}
      </p>
      <button 
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-zinc-500" />
      </button>
    </motion.div>
  );
};

export default Toast;
