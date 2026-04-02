import { LedgerSkeleton } from '@/components/ui/Skeleton';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function Loading() {
  // We can show the BrandLoader for the initial load 
  // or a Skeleton for faster perceived navigation.
  // Using both/conditional approach:
  return (
    <div className="relative">
      <LedgerSkeleton />
      {/* 
          Optional: If we want to show the full-screen brand loader 
          on the very first landing, we could use a client component 
          with a brief timeout or state. 
          But for standard Next.js navigation, LedgerSkeleton is best.
      */}
    </div>
  );
}
