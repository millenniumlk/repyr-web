import { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { POPULAR_DTC_CODES } from '../lib/constants';
import { cn } from '../lib/utils';

export interface OBDTroubleshooterProps {
  onCodeSubmit: (code: string, label: string) => void;
  className?: string;
}

const DTC_REGEX = /^[PCBU]\d{4}$/i;

export function OBDTroubleshooter({ onCodeSubmit, className }: OBDTroubleshooterProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    const isDtc = DTC_REGEX.test(trimmed);
    if (isDtc) {
      const formattedCode = trimmed.toUpperCase();
      const matched = POPULAR_DTC_CODES.find(
        (item) => item.code.toUpperCase() === formattedCode
      );
      onCodeSubmit(formattedCode, matched?.label || 'OBD-II Code');
    } else {
      onCodeSubmit(trimmed, trimmed);
    }
  };

  const handlePillClick = (code: string, label: string) => {
    onCodeSubmit(code, label);
  };

  return (
    <div
      className={cn(
        'bg-card rounded-[20px] border border-border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
        className
      )}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter OBD-II code (e.g. P0300, P0420) or symptom..."
            className="w-full h-11 px-4 rounded-full bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={!searchValue.trim()}
          className="shrink-0 h-11 w-11 rounded-full cursor-pointer disabled:opacity-50"
          aria-label="Search OBD-II Code"
        >
          <Search className="w-5 h-5" />
        </Button>
      </form>

      <div className="overflow-x-auto no-scrollbar flex gap-2 pb-2">
        {POPULAR_DTC_CODES.map((item, index) => (
          <motion.div
            key={item.code}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="shrink-0"
          >
            <Button
              type="button"
              variant="outline"
              size="chip"
              onClick={() => handlePillClick(item.code, item.label)}
              className="border-transparent text-muted-foreground shadow-soft-card hover:border-primary/20 hover:text-primary whitespace-nowrap"
            >
              <span className="font-semibold text-foreground mr-1.5">{item.code}</span>
              <span>{item.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
