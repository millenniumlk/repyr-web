import { useState } from 'react';
import { ClipboardList, Plus, Car, Wrench, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { Button } from '../components/ui/Button';
import { IosAlert } from '../components/ui/IosAlert';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MaintenanceRecord } from '../types';

const Maintenance = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance_records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*, vehicles(make, model, year)')
        .eq('user_id', user.id)
        .order('service_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    const { id } = recordToDelete;

    const { error } = await supabase.from('maintenance_records').delete().eq('id', id).eq('user_id', user?.id);
    if (!error) {
      queryClient.setQueryData(['maintenance_records', user?.id], (old: any[]) => 
        old ? old.filter(r => r.id !== id) : []
      );
      showToast(`Record removed.`, 'success');
    } else {
      showToast('Could not delete record.', 'error');
    }
    
    setRecordToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
        <div className="hidden md:block mb-6 px-1 mt-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[20px] p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-muted animate-pulse rounded-lg" />
                <div className="h-5 w-2/3 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6 px-1 mt-2">
        <h1 className="hidden md:block text-3xl font-bold text-foreground tracking-tight leading-tight">Maintenance</h1>
        {records.length > 0 && (
          <Link to="/diagnose/maintenance/add">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" strokeWidth={2.2} />
              Add Record
            </Button>
          </Link>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Maintenance Records"
          description="Keep track of your vehicle's service history, costs, and receipts all in one place."
          actionLabel="Add Record"
          onAction={() => navigate('/diagnose/maintenance/add')}
        />
      ) : (
        <div className="space-y-4 px-1">
          <AnimatePresence>
            {records.map((record, index) => {
              const vehicleName = record.vehicles 
                ? `${record.vehicles.year} ${record.vehicles.make} ${record.vehicles.model}` 
                : 'Unknown Vehicle';
                
              const date = new Date(record.service_date).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
              });

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.96 }}
                  key={record.id} 
                  onClick={() => navigate(`/diagnose/maintenance/${record.id}`)}
                  className="bg-card border border-border rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] cursor-pointer flex flex-row items-center gap-4"
                >
                  <div className="w-[46px] h-[46px] rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 overflow-hidden">
                    {record.photo_urls && record.photo_urls.length > 0 ? (
                      <img src={record.photo_urls[0]} alt="Receipt" className="w-full h-full object-cover" />
                    ) : (
                      <Wrench className="w-5 h-5 text-primary" strokeWidth={2.2} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground font-bold text-[11px] uppercase tracking-widest">{date}</span>
                      {record.cost && (
                        <span className="font-medium text-sm">${record.cost}</span>
                      )}
                    </div>
                    
                    <div className="text-foreground font-bold text-[15px] leading-snug truncate mb-0.5">
                      {record.service_type}
                    </div>
                    
                    <div className="text-muted-foreground font-medium text-sm truncate flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      {vehicleName}
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecordToDelete(record);
                    }}
                    className="h-11 w-11 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 group shrink-0 ml-1"
                    title="Remove Record"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                  </Button>
                  
                  <div className="pr-1 hidden md:block">
                    <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <IosAlert 
        isOpen={!!recordToDelete}
        title="Delete Record"
        message="Are you sure you want to delete this maintenance record? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={confirmDeleteRecord}
      />
    </div>
  );
};

export default Maintenance;
