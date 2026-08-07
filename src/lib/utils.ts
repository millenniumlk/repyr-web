import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .toString()
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .trim();
}
