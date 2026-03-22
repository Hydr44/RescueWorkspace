/**
 * Hook per notifiche real-time sui trasporti
 * Usa Supabase Realtime per aggiornamenti live
 */

import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

export function useRealtimeTransports(orgId, onUpdate) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const supabase = supabaseBrowser();
  
  // Usa useRef per evitare loop infinito quando onUpdate cambia
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!orgId) return;

    console.log('[Realtime] Subscribing to transports channel for org:', orgId);

    // Subscribe to transports changes
    const channel = supabase
      .channel(`transports:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transports',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          console.log('[Realtime] Transport change:', payload.eventType, payload.new?.id);
          
          setLastEvent({
            type: payload.eventType,
            transport: payload.new || payload.old,
            timestamp: new Date()
          });

          // Usa ref per evitare dipendenza diretta
          if (onUpdateRef.current) {
            onUpdateRef.current(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Realtime] Unsubscribing from transports channel');
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return {
    isConnected,
    lastEvent
  };
}

/**
 * Hook per notifiche real-time su singolo trasporto
 */
export function useRealtimeTransport(transportId, onUpdate) {
  const [isConnected, setIsConnected] = useState(false);
  const supabase = supabaseBrowser();
  
  // Usa useRef per evitare loop infinito
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!transportId) return;

    const channel = supabase
      .channel(`transport:${transportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transports',
          filter: `id=eq.${transportId}`
        },
        (payload) => {
          console.log('[Realtime] Transport updated:', payload.new);
          
          if (onUpdateRef.current) {
            onUpdateRef.current(payload.new);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transportId, supabase]);

  return { isConnected };
}
