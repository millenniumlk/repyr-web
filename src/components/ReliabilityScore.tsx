import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, AlertOctagon, ThumbsUp, Activity, Wrench } from 'lucide-react';
import { fetchRecalls, fetchComplaints, fetchInvestigations } from '../services/nhtsaService';

interface ReliabilityScoreProps {
  make: string;
  model: string;
  year: string;
}

export function ReliabilityScore({ make, model, year }: ReliabilityScoreProps) {
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

  const isLoading = recallsLoading || investigationsLoading || complaintsLoading;

  const stats = useMemo(() => {
    const recallsCount = recallsData?.Count ?? recallsData?.results?.length ?? 0;
    const investigationsCount = investigationsData?.Count ?? investigationsData?.results?.length ?? 0;
    const complaintsCount = complaintsData?.Count ?? complaintsData?.results?.length ?? 0;

    // Deductions
    const recallPenalty = recallsCount * 5;
    const invPenalty = investigationsCount * 10;
    const compPenalty = Math.floor(complaintsCount * 0.1);

    const totalPenalty = recallPenalty + invPenalty + compPenalty;
    const score = Math.max(0, 100 - totalPenalty);

    let verdict = '';
    let color = '';
    if (score >= 85) {
      verdict = 'Excellent';
      color = 'text-green-500';
    } else if (score >= 70) {
      verdict = 'Good';
      color = 'text-blue-500';
    } else if (score >= 50) {
      verdict = 'Fair';
      color = 'text-yellow-500';
    } else {
      verdict = 'High Risk';
      color = 'text-destructive';
    }

    // Common issues from complaints
    const complaints = complaintsData?.results || [];
    const counts: Record<string, number> = {};
    complaints.forEach((c: any) => {
      if (!c.components) return;
      const parts = c.components.split(',');
      parts.forEach((p: string) => {
        const clean = p.trim().toUpperCase();
        if (clean && clean !== 'UNKNOWN OR OTHER') {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });
    const topIssues = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      recallsCount,
      investigationsCount,
      complaintsCount,
      recallPenalty,
      invPenalty,
      compPenalty,
      totalPenalty,
      score,
      verdict,
      color,
      topIssues
    };
  }, [recallsData, investigationsData, complaintsData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Running Reliability Score algorithm...</p>
      </div>
    );
  }

  // SVG Gauge Calculations
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Section: Score & Verdict */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
        
        {/* Animated Dial */}
        <div className="relative flex items-center justify-center">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              className="stroke-muted fill-none"
              strokeWidth="12"
            />
            {/* Foreground Circle (Score) */}
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              className={`fill-none ${stats.score >= 70 ? 'stroke-green-500' : stats.score >= 50 ? 'stroke-yellow-500' : 'stroke-destructive'}`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black tracking-tighter">{stats.score}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">out of 100</span>
          </div>
        </div>

        {/* Verdict Details */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-black tracking-tight mb-2">
            Reliability: <span className={stats.color}>{stats.verdict}</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg">
            Based on millions of NHTSA records, we algorithmically generate this score by penalizing major factory defects, federal safety probes, and chronic consumer complaints.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="bg-background border border-border rounded-2xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              {stats.recallsCount} Recalls
            </div>
            <div className="bg-background border border-border rounded-2xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-yellow-500" />
              {stats.investigationsCount} Investigations
            </div>
            <div className="bg-background border border-border rounded-2xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              {stats.complaintsCount} Complaints
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Deductions & Common Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Score Breakdown */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Score Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="font-medium text-sm">Base Score</span>
              <span className="font-bold text-green-500">100 pts</span>
            </div>
            {stats.recallPenalty > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <span className="font-medium text-sm text-foreground/80">Recalls Deduction (-5/ea)</span>
                <span className="font-bold text-destructive">-{stats.recallPenalty} pts</span>
              </div>
            )}
            {stats.invPenalty > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <span className="font-medium text-sm text-foreground/80">Investigations Deduction (-10/ea)</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-500">-{stats.invPenalty} pts</span>
              </div>
            )}
            {stats.compPenalty > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <span className="font-medium text-sm text-foreground/80">Complaints Deduction (-0.1/ea)</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">-{stats.compPenalty} pts</span>
              </div>
            )}
            {stats.totalPenalty === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold">
                <ThumbsUp className="w-4 h-4" /> Perfect Record! No deductions found.
              </div>
            )}
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Top Failing Components
          </h3>
          {stats.topIssues.length > 0 ? (
            <div className="space-y-3">
              {stats.topIssues.map(([issue, count], idx) => (
                <div key={idx} className="flex flex-col p-3 rounded-xl bg-background border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm truncate pr-4">{issue}</span>
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">{count} reports</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, (count / stats.topIssues[0][1]) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center bg-background rounded-2xl border border-dashed border-border p-4">
              <ThumbsUp className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No significant common issues reported.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
