// src/types/shims.d.ts
import React from 'react';

declare module '@/context/OrgContext' {
  type Org = { id: string; name?: string | null } | null;
  export function useOrg(): { currentOrg: Org };
}

declare module '@/components/BarcodeScanner' {
  export const BarcodeScanner: React.FC<{
    onScan: (code: string) => void;
    onClose: () => void;
  }>;
}