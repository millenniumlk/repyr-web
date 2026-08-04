import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const Notifications = () => {
  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="hidden md:block mb-6 px-1 mt-2">
        <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">Notifications</h1>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md px-4"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
            <Bell className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
            You're all caught up
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We will notify you here when the AI Master Mechanic has updates regarding your garage or diagnostics.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Notifications;
