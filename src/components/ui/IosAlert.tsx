import { motion, AnimatePresence } from 'framer-motion';

interface IosAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function IosAlert({
  isOpen,
  title,
  message,
  cancelText = 'Cancel',
  confirmText = 'OK',
  onCancel,
  onConfirm,
  isDestructive = false
}: IosAlertProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
            className="w-full max-w-[270px] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] overflow-hidden shadow-2xl relative z-10 flex flex-col"
          >
            <div className="p-4 pt-5 pb-4 text-center flex flex-col items-center justify-center">
              {title && <h3 className="font-semibold text-[17px] leading-tight text-black dark:text-white mb-1">{title}</h3>}
              <p className="text-[13px] leading-[18px] text-black/70 dark:text-white/70 font-medium">
                {message}
              </p>
            </div>
            
            <div className="flex border-t border-black/10 dark:border-white/10 mt-0">
              <button
                onClick={onCancel}
                className="flex-1 py-3 text-[17px] text-[#007AFF] font-normal hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-r border-black/10 dark:border-white/10 active:bg-black/10 dark:active:bg-white/10 outline-none"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 text-[17px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:bg-black/10 dark:active:bg-white/10 outline-none ${
                  isDestructive ? 'text-[#FF3B30]' : 'text-[#007AFF]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
