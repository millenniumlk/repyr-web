export const brandColors: Record<string, string> = {
  ford: '#003478',
  honda: '#E40521',
  toyota: '#EB0A1E',
  chevrolet: '#CD9834',
  bmw: '#0066B1',
  mercedes: '#000000',
  'mercedes-benz': '#000000',
  audi: '#000000',
  volkswagen: '#001E50',
  nissan: '#C3002F',
  subaru: '#013C74',
  hyundai: '#002C5F',
  kia: '#05141F',
  lexus: '#000000',
  mazda: '#101010',
  jeep: '#FFBA00',
  dodge: '#E51A24',
  ram: '#D91F26',
  gmc: '#C8102E',
  porsche: '#D5001C',
  tesla: '#E82127',
  volvo: '#003057',
  acura: '#000000',
  infiniti: '#000000',
  cadillac: '#000000',
  buick: '#000000',
  lincoln: '#000000',
  chrysler: '#000000',
  mitsubishi: '#E60012',
  mini: '#000000',
  landrover: '#005A2B',
  'land rover': '#005A2B',
  jaguar: '#000000',
  fiat: '#9B0014',
  alfa: '#B51621',
  'alfa romeo': '#B51621',
  maserati: '#002B49',
  ferrari: '#E32636',
  lamborghini: '#D2B034',
  astonmartin: '#006F62',
  'aston martin': '#006F62',
  bentley: '#000000',
  rollsroyce: '#000000',
  'rolls-royce': '#000000',
  genesis: '#000000',
  suzuki: '#E30613',
  isuzu: '#E4002B',
};

/**
 * Gets the brand color for a given make, falling back to a default color.
 */
export function getBrandColor(make: string): string {
  if (!make) return 'hsl(var(--primary))'; // CSS variable for fallback
  const normalizedMake = make.toLowerCase().trim();
  return brandColors[normalizedMake] || 'hsl(var(--primary))';
}
