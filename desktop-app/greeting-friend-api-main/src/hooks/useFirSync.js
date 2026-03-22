/**
 * Hook: Sync FIR stati da RENTRI
 * Alternativa a Vercel Cron (limiti piano free)
 * Polling client-side ogni 2 minuti per FIR trasmessi
 */

import { useEffect, useCallback, useRef } from "react";

export function useFirSync(enabled = true) {
  const intervalRef = useRef(null);
  
  const syncStati = useCallback(async () => {
    try {
      console.log("[FIR-SYNC] Sync stati in background...");
      
      //  Spostato su VPS per ridurre edge requests Vercel
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/fir/sync-stati`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer rentri-sync-prod-2025-XK9mP2nQ7vL4"
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("[FIR-SYNC] Sync completato:", result);
        
        if (result.synced > 0) {
          console.log(`[FIR-SYNC] ${result.synced} FIR aggiornati!`);
          // Trigger re-render se necessario
          window.dispatchEvent(new CustomEvent("fir-sync-update", { detail: result }));
        }
      }
    } catch (error) {
      console.error("[FIR-SYNC] Errore sync:", error);
    }
  }, []);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Sync immediato all'inizio
    syncStati();
    
    //  RIDOTTO: Da 2 minuti a 10 minuti per ridurre edge requests Vercel
    intervalRef.current = setInterval(syncStati, 10 * 60 * 1000); // 10 minuti invece di 2
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, syncStati]);
  
  return { syncStati }; // Espone funzione per sync manuale
}

