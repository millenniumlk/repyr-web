import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '../lib/utils';
import { CAR_BRANDS } from '../lib/constants';

export interface BrandSelectorGridProps {
  selectedMake: string | null;
  onSelectMake: (make: string | null) => void;
  className?: string;
}

const BRAND_ABBREVIATIONS: Record<string, string> = {
  Audi: 'A',
  BMW: 'BMW',
  Chevrolet: 'CH',
  Citroën: 'C',
  Fiat: 'F',
  Ford: 'F',
  GMC: 'GMC',
  Honda: 'H',
  Hyundai: 'H',
  Kia: 'KIA',
  Mercedes: 'MB',
  Nissan: 'N',
  Porsche: 'P',
  Subaru: 'S',
  Toyota: 'T',
  Volkswagen: 'VW',
};

const BRAND_LOGOS: Record<string, string> = {
  Audi: 'https://www.carlogos.org/car-logos/audi-logo.png',
  BMW: 'https://www.carlogos.org/car-logos/bmw-logo.png',
  Chevrolet: 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  'Citroën': 'https://www.carlogos.org/car-logos/citroen-logo.png',
  Fiat: 'https://www.carlogos.org/car-logos/fiat-logo.png',
  Ford: 'https://www.carlogos.org/car-logos/ford-logo.png',
  GMC: 'https://www.carlogos.org/car-logos/gmc-logo.png',
  Honda: 'https://www.carlogos.org/car-logos/honda-logo.png',
  Hyundai: 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  Kia: 'https://www.carlogos.org/car-logos/kia-logo.png',
  Mercedes: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  Nissan: 'https://www.carlogos.org/car-logos/nissan-logo.png',
  Porsche: 'https://www.carlogos.org/car-logos/porsche-logo.png',
  Subaru: 'https://www.carlogos.org/car-logos/subaru-logo.png',
  Toyota: 'https://www.carlogos.org/car-logos/toyota-logo.png',
  Volkswagen: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
};

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
};

interface BrandCardProps {
  brand: string;
  isSelected: boolean;
  onSelect: (brand: string) => void;
}

const BrandCard = React.memo(function BrandCard({
  brand,
  isSelected,
  onSelect,
}: BrandCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const monogram = BRAND_ABBREVIATIONS[brand] || brand.slice(0, 2).toUpperCase();
  const logoUrl = BRAND_LOGOS[brand] || null;

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(brand)}
      className={cn(
        'group relative flex flex-col items-center justify-center p-4 rounded-[20px] border transition-all duration-200 text-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-glow-primary'
          : 'bg-card border-border hover:border-primary/20 hover:bg-muted/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      )}
    >
      <div
        className={cn(
          'w-16 h-16 flex items-center justify-center font-bold text-lg transition-all duration-200 mb-2.5',
          (!logoUrl || imageError) && (isSelected
            ? 'bg-primary text-primary-foreground rounded-full shadow-sm shadow-primary/20'
            : 'bg-muted text-foreground/80 rounded-full group-hover:bg-primary/10 group-hover:text-primary')
        )}
      >
        {!imageError && logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${brand} logo`} 
            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          monogram
        )}
      </div>
      <span
        className={cn(
          'text-xs sm:text-sm font-medium tracking-tight truncate w-full transition-colors',
          isSelected ? 'text-primary font-semibold' : 'text-foreground'
        )}
      >
        {brand}
      </span>
    </motion.button>
  );
});

export function BrandSelectorGrid({
  selectedMake,
  onSelectMake,
}: BrandSelectorGridProps) {
  const handleBrandClick = (brand: string) => {
    onSelectMake(selectedMake === brand ? null : brand);
  };

  return (
    <div className="w-full">
      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4"
      >
        {CAR_BRANDS.map((brand) => (
          <BrandCard
            key={brand}
            brand={brand}
            isSelected={selectedMake === brand}
            onSelect={handleBrandClick}
          />
        ))}
      </motion.div>
    </div>
  );
}
