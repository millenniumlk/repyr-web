import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Activity, Wrench, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { Button } from '../components/ui/Button';
import { IosAlert } from '../components/ui/IosAlert';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const MaintenanceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: record, isLoading } = useQuery({
    queryKey: ['maintenance_record', id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*, vehicles(make, model, year)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const handleDelete = async () => {
    if (!id || !user) return;
    
    // Optionally delete photos from storage here as well
    if (record?.photo_urls?.length) {
      // Extraction logic for storage paths could go here
    }

    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['maintenance_records', user.id] });
      showToast('Record deleted', 'success');
      navigate('/maintenance');
    } else {
      showToast('Could not delete record', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 animate-pulse">
        <div className="h-10 w-10 bg-muted rounded-full mb-6" />
        <div className="h-8 w-3/4 bg-muted rounded-lg mb-4" />
        <div className="h-4 w-1/2 bg-muted rounded-lg mb-8" />
        <div className="space-y-4">
          <div className="h-24 bg-card rounded-[20px] border border-border" />
          <div className="h-48 bg-card rounded-[20px] border border-border" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center py-20">
        <p className="text-muted-foreground">Record not found.</p>
        <Button onClick={() => navigate('/maintenance')} variant="outline" className="mt-4">
          Back to Maintenance
        </Button>
      </div>
    );
  }

  const date = new Date(record.service_date).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const vehicleName = record.vehicles 
    ? `${record.vehicles.year} ${record.vehicles.make} ${record.vehicles.model}` 
    : 'Unknown Vehicle';

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between mt-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/maintenance')} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex gap-2">
          {/* Edit could be implemented later */}
          <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-card border border-border rounded-[28px] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Wrench className="w-32 h-32" />
          </div>
          
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
            {vehicleName}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">{record.service_type}</h1>
          <div className="text-muted-foreground flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4" />
            {date}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Cost
            </div>
            <div className="text-2xl font-bold text-foreground">
              {record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="bg-card border border-border rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Mileage
            </div>
            <div className="text-2xl font-bold text-foreground">
              {record.mileage ? `${record.mileage.toLocaleString()} mi` : 'N/A'}
            </div>
          </div>
        </div>

        {record.description && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
               Notes
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {record.description}
            </p>
          </div>
        )}

        {record.photo_urls && record.photo_urls.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground px-1">Receipts & Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {record.photo_urls.map((url: string, index: number) => (
                <div 
                  key={index} 
                  onClick={() => setLightboxImage(url)}
                  className="aspect-square rounded-[20px] overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity bg-muted"
                >
                  <img src={url} alt={`Receipt ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <IosAlert 
        isOpen={showDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to delete this maintenance record? This cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Full size receipt"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceDetail;
