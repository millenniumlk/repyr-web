import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui/Skeleton';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { fetchRecalls, fetchComplaints, fetchInvestigations } from '../services/nhtsaService';
import type { NHTSARecall, NHTSAComplaint, NHTSAInvestigation } from '../services/nhtsaService';
import { cn } from '../lib/utils';

export interface NHTSASafetyHubProps {
  make: string;
  model: string;
  year: string;
  activeTab: 'recalls' | 'investigations' | 'complaints';
}

export type SafetyTab = 'recalls' | 'investigations' | 'complaints';

function formatNHTSADate(dateStr?: string): string {
  if (!dateStr) return '';

  const msMatch = /\/Date\((\d+)\)\//.exec(dateStr);
  if (msMatch) {
    const timestamp = parseInt(msMatch[1], 10);
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return dateStr;
}

export function NHTSASafetyHub({ make, model, year, activeTab }: NHTSASafetyHubProps) {
  const [showAll, setShowAll] = useState(false);

  const isValidVehicle = Boolean(make?.trim() && model?.trim() && year?.toString().trim());

  const { data: recallsData, isLoading: recallsLoading } = useQuery({
    queryKey: ['nhtsa-recalls', make, model, year],
    queryFn: () => fetchRecalls(make, model, year),
    enabled: isValidVehicle,
  });

  const { data: investigationsData, isLoading: investigationsLoading } = useQuery({
    queryKey: ['nhtsa-investigations', make, model, year],
    queryFn: () => fetchInvestigations(make, model, year),
    enabled: isValidVehicle,
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['nhtsa-complaints', make, model, year],
    queryFn: () => fetchComplaints(make, model, year),
    enabled: isValidVehicle,
  });

  if (!isValidVehicle) {
    return null;
  }

  const recalls: NHTSARecall[] = recallsData?.results ?? [];
  const investigations: NHTSAInvestigation[] = investigationsData?.results ?? [];
  const complaints: NHTSAComplaint[] = complaintsData?.results ?? [];

  const renderContent = () => {
    switch (activeTab) {
      case 'recalls': {
        if (recallsLoading) {
          return renderSkeletons();
        }
        if (recalls.length === 0) {
          return renderEmptyState('recalls');
        }
        const visibleRecalls = showAll ? recalls : recalls.slice(0, 10);
        return (
          <div className="space-y-3">
            {visibleRecalls.map((recall, idx) => (
              <motion.div
                key={recall.NHTSACampaignNumber ? `${recall.NHTSACampaignNumber}-${idx}` : idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="bg-card rounded-[20px] border border-border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {recall.NHTSACampaignNumber ? `Campaign ${recall.NHTSACampaignNumber}` : 'NHTSA Recall'}
                    {recall.ReportReceivedDate ? ` • ${formatNHTSADate(recall.ReportReceivedDate)}` : ''}
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground tracking-tight">
                  {recall.Component || 'Safety Recall'}
                </h4>

                {recall.Summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {recall.Summary}
                  </p>
                )}

                {recall.Consequence && (
                  <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-xl flex items-start gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Consequence:</strong> {recall.Consequence}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}

            {recalls.length > 10 && !showAll && renderShowMore(recalls.length - 10)}
          </div>
        );
      }

      case 'investigations': {
        if (investigationsLoading) {
          return renderSkeletons();
        }
        if (investigations.length === 0) {
          return renderEmptyState('investigations');
        }
        const visibleInvestigations = showAll ? investigations : investigations.slice(0, 10);
        return (
          <div className="space-y-3">
            {visibleInvestigations.map((inv, idx) => (
              <motion.div
                key={inv.NHTSAActionNumber ? `${inv.NHTSAActionNumber}-${idx}` : idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="bg-card rounded-[20px] border border-border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {inv.NHTSAActionNumber ? `Action ${inv.NHTSAActionNumber}` : 'Investigation'}
                    {inv.OpenedDate ? ` • Opened ${formatNHTSADate(inv.OpenedDate)}` : ''}
                  </span>
                  {inv.investigationStatus && (
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        inv.investigationStatus.toLowerCase().includes('open') || inv.investigationStatus.toLowerCase().includes('active')
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {inv.investigationStatus}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-foreground tracking-tight">
                  {inv.subject || inv.components || 'Safety Investigation'}
                </h4>

                {inv.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {inv.summary}
                  </p>
                )}
              </motion.div>
            ))}

            {investigations.length > 10 && !showAll && renderShowMore(investigations.length - 10)}
          </div>
        );
      }

      case 'complaints': {
        if (complaintsLoading) {
          return renderSkeletons();
        }
        if (complaints.length === 0) {
          return renderEmptyState('complaints');
        }
        const visibleComplaints = showAll ? complaints : complaints.slice(0, 10);
        return (
          <div className="space-y-3">
            {visibleComplaints.map((complaint, idx) => {
              const isCrash = complaint.crash === true || String(complaint.crash).trim().toLowerCase() === 'yes' || String(complaint.crash).trim().toLowerCase() === 'y';
              const isFire = complaint.fire === true || String(complaint.fire).trim().toLowerCase() === 'yes' || String(complaint.fire).trim().toLowerCase() === 'y';

              return (
                <motion.div
                  key={complaint.odiNumber ? `${complaint.odiNumber}-${idx}` : idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="bg-card rounded-[20px] border border-border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      {complaint.odiNumber ? `ODI ${complaint.odiNumber}` : 'Complaint'}
                      {complaint.dateComplaintFiled ? ` • Filed ${formatNHTSADate(complaint.dateComplaintFiled)}` : ''}
                    </span>

                    {(isCrash || isFire) && (
                      <div className="flex items-center gap-1.5">
                        {isCrash && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            Crash
                          </span>
                        )}
                        {isFire && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            Fire
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-foreground tracking-tight">
                    {complaint.components || 'Consumer Complaint'}
                  </h4>

                  {complaint.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {complaint.summary}
                    </p>
                  )}
                </motion.div>
              );
            })}

            {complaints.length > 10 && !showAll && renderShowMore(complaints.length - 10)}
          </div>
        );
      }
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-card rounded-[20px] border border-border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3"
        >
          <Skeleton className="h-3 w-1/3 rounded-full" />
          <Skeleton className="h-5 w-3/4 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-5/6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = (tab: SafetyTab) => (
    <div className="bg-card rounded-[20px] border border-border p-8 text-center text-muted-foreground text-sm shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      No {tab} found for this vehicle.
    </div>
  );

  const renderShowMore = (remainingCount: number) => (
    <div className="pt-2 text-center">
      <button
        type="button"
        onClick={() => setShowAll(true)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline transition-colors cursor-pointer py-1 px-3"
      >
        <span>Show more ({remainingCount} remaining)</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-6">

      {/* Tab content with Framer Motion transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
