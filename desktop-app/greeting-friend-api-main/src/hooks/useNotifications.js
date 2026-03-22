// src/hooks/useNotifications.js
// Hook che genera notifiche automatiche basate sui dati reali dell'app
import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { sendScadenzaNotification } from "@/lib/emailNotifications";

/**
 * Genera notifiche smart basate sui dati Supabase dell'organizzazione.
 * Le notifiche sono calcolate client-side e persistite in localStorage
 * per tracciare lo stato letto/non-letto.
 */
export function useNotifications() {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Chiave localStorage per stato letto
  const readKey = `rm-notif-read:${orgId || "none"}`;
  // Chiave localStorage per notifiche dismissate
  const dismissKey = `rm-notif-dismiss:${orgId || "none"}`;

  const getReadIds = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(readKey) || "[]");
    } catch {
      return [];
    }
  }, [readKey]);

  const getDismissedIds = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(dismissKey) || "[]");
    } catch {
      return [];
    }
  }, [dismissKey]);

  const generateNotifications = useCallback(async () => {
    if (!orgId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
      const weekAgo = new Date(now - 7 * 86400000).toISOString();
      const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(now - 60 * 86400000).toISOString().split("T")[0];

      // Helper: query sicura che non crasha se tabella/colonna non esiste
      const safeQuery = async (queryFn) => {
        try {
          const result = await queryFn();
          if (result.error) return { data: null, count: 0 };
          return result;
        } catch {
          return { data: null, count: 0 };
        }
      };

      // Query parallele per raccogliere dati
      const [
        todayTransports,
        yesterdayUnclosed,
        pendingQuotes,
        overdueInvoices,
        longYardVehicles,
        vehicleRevisions,
        recentClients,
        totalClients,
        rentriGiacenze,
      ] = await Promise.all([
        // 1. Trasporti di oggi (usa created_at, pickup_date non esiste)
        safeQuery(() => supabase
          .from("transports")
          .select("id, customer_name, status", { count: "exact", head: false })
          .eq("org_id", orgId)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
          .limit(50)),

        // 2. Trasporti di ieri non completati
        safeQuery(() => supabase
          .from("transports")
          .select("id, customer_name, status", { count: "exact", head: false })
          .eq("org_id", orgId)
          .gte("created_at", `${yesterday}T00:00:00`)
          .lte("created_at", `${yesterday}T23:59:59`)
          .not("status", "eq", "done")
          .limit(50)),

        // 3. Preventivi in attesa da 14+ giorni
        safeQuery(() => supabase
          .from("quotes")
          .select("id, cliente, created_at", { count: "exact", head: false })
          .eq("org_id", orgId)
          .eq("stato", "inviato")
          .lt("created_at", twoWeeksAgo)
          .limit(50)),

        // 4. Fatture non pagate
        safeQuery(() => supabase
          .from("invoices")
          .select("id, number, customer_name", { count: "exact", head: false })
          .eq("org_id", orgId)
          .eq("payment_status", "pending")
          .limit(50)),

        // 5. Veicoli in piazzale da 60+ giorni
        safeQuery(() => supabase
          .from("yard_vehicles")
          .select("id, targa, data_ingresso", { count: "exact", head: false })
          .eq("org_id", orgId)
          .lt("data_ingresso", sixtyDaysAgo)
          .limit(50)),

        // 6. Mezzi con scadenze entro 30 giorni (assicurazione, revisione, bollo)
        safeQuery(() => {
          const in30days = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];
          return supabase
            .from("vehicles")
            .select("id, targa, scad_assicurazione, scad_revisione, scad_bollo", { count: "exact", head: false })
            .eq("org_id", orgId)
            .or(`scad_assicurazione.lte.${in30days},scad_revisione.lte.${in30days},scad_bollo.lte.${in30days},scad_tachigrafo.lte.${in30days}`)
            .limit(50);
        }),

        // 7. Clienti aggiunti questa settimana
        safeQuery(() => supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gte("created_at", weekAgo)),

        // 8. Totale clienti
        safeQuery(() => supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)),

        // 9. Giacenza rifiuti per EER (carichi - scarichi)
        safeQuery(() => supabase
          .from("rentri_movimenti")
          .select("codice_eer, tipo_operazione, quantita")
          .eq("org_id", orgId)
          .limit(500)),
      ]);

      const notifs = [];
      const readIds = getReadIds();
      const dismissedIds = getDismissedIds();

      // --- Trasporti oggi ---
      const todayCount = todayTransports.data?.length || 0;
      if (todayCount > 0) {
        const pending = todayTransports.data.filter(t => t.status !== "completato").length;
        notifs.push({
          id: `transport-today-${today}`,
          type: "transport",
          level: pending > 0 ? "info" : "success",
          icon: "truck",
          title: `${todayCount} trasport${todayCount === 1 ? "o" : "i"} oggi`,
          message: pending > 0
            ? `${pending} ancora da completare`
            : "Tutti completati!",
          timestamp: now.toISOString(),
          actionUrl: "/trasporti",
          actionLabel: "Vedi trasporti",
        });
      }

      // --- Trasporti ieri non chiusi ---
      const unclosedCount = yesterdayUnclosed.data?.length || 0;
      if (unclosedCount > 0) {
        notifs.push({
          id: `transport-unclosed-${yesterday}`,
          type: "transport",
          level: "warn",
          icon: "alert",
          title: `${unclosedCount} trasport${unclosedCount === 1 ? "o" : "i"} non chius${unclosedCount === 1 ? "o" : "i"}`,
          message: `Di ieri — verifica lo stato`,
          timestamp: now.toISOString(),
          actionUrl: "/trasporti",
          actionLabel: "Controlla",
        });
      }

      // --- Preventivi in attesa ---
      const quotesCount = pendingQuotes.data?.length || 0;
      if (quotesCount > 0) {
        notifs.push({
          id: `quotes-pending-${today}`,
          type: "quote",
          level: "warn",
          icon: "file",
          title: `${quotesCount} preventiv${quotesCount === 1 ? "o" : "i"} in attesa`,
          message: "Inviati da più di 14 giorni senza risposta",
          timestamp: now.toISOString(),
          actionUrl: "/preventivi",
          actionLabel: "Vedi preventivi",
        });
      }

      // --- Fatture scadute ---
      const invoicesCount = overdueInvoices.data?.length || 0;
      if (invoicesCount > 0) {
        notifs.push({
          id: `invoices-overdue-${today}`,
          type: "invoice",
          level: "error",
          icon: "alert",
          title: `${invoicesCount} fattur${invoicesCount === 1 ? "a" : "e"} scadut${invoicesCount === 1 ? "a" : "e"}`,
          message: "Pagamento oltre la data di scadenza",
          timestamp: now.toISOString(),
          actionUrl: "/fatture",
          actionLabel: "Vedi fatture",
        });
      }

      // --- Veicoli in piazzale da troppo ---
      const yardCount = longYardVehicles.data?.length || 0;
      if (yardCount > 0) {
        notifs.push({
          id: `yard-long-${today}`,
          type: "yard",
          level: "info",
          icon: "mappin",
          title: `${yardCount} veicol${yardCount === 1 ? "o" : "i"} in piazzale da 60+ giorni`,
          message: "Valuta se procedere con demolizione o vendita",
          timestamp: now.toISOString(),
          actionUrl: "/piazzale",
          actionLabel: "Vedi piazzale",
        });
      }

      // --- Revisioni in scadenza ---
      const revisionCount = vehicleRevisions.data?.length || 0;
      if (revisionCount > 0) {
        const targhe = vehicleRevisions.data.map(v => v.targa).filter(Boolean).slice(0, 3);
        notifs.push({
          id: `vehicle-revision-${today}`,
          type: "vehicle",
          level: "warn",
          icon: "shield",
          title: `${revisionCount} mezz${revisionCount === 1 ? "o" : "i"} con revisione in scadenza`,
          message: targhe.length > 0
            ? `Targhe: ${targhe.join(", ")}${revisionCount > 3 ? "..." : ""}`
            : "Entro i prossimi 15 giorni",
          timestamp: now.toISOString(),
          actionUrl: "/mezzi",
          actionLabel: "Vedi mezzi",
        });
      }

      // --- Alert giacenza RENTRI ---
      if (rentriGiacenze.data?.length > 0) {
        // Calcola giacenza netta per EER (carico - scarico)
        const giacenzaMap = {};
        for (const mov of rentriGiacenze.data) {
          const eer = mov.codice_eer;
          if (!eer) continue;
          if (!giacenzaMap[eer]) giacenzaMap[eer] = 0;
          const qty = Number(mov.quantita_kg) || 0;
          giacenzaMap[eer] += mov.tipo_movimento === 'carico' ? qty : -qty;
        }
        // Soglie per EER pericolosi (13*) vs non pericolosi (tutti gli altri VFU)
        const LIMIT_PERICOLOSO_KG = 10000;  // ~10 tonnellate come soglia di alert
        const eerSuperiori = Object.entries(giacenzaMap)
          .filter(([eer, kg]) => {
            if (kg <= 0) return false;
            const isPericoloso = eer.startsWith('13') || eer.includes('*');
            return isPericoloso ? kg > LIMIT_PERICOLOSO_KG : kg > 50000;
          });
        if (eerSuperiori.length > 0) {
          notifs.push({
            id: `rentri-giacenza-${today}`,
            type: 'rentri',
            level: 'warn',
            icon: 'alert',
            title: `${eerSuperiori.length} codic${eerSuperiori.length === 1 ? 'e EER' : 'i EER'} con giacenza elevata`,
            message: eerSuperiori.map(([eer, kg]) => `${eer}: ${Math.round(kg/1000)}t`).slice(0,3).join(', '),
            timestamp: now.toISOString(),
            actionUrl: '/rifiuti/movimenti',
            actionLabel: 'Vedi movimenti',
          });
        }
      }

      // --- Nuovi clienti questa settimana ---
      const newClientsCount = recentClients.count || 0;
      const totalClientsCount = totalClients.count || 0;
      if (newClientsCount > 0) {
        notifs.push({
          id: `clients-new-week`,
          type: "client",
          level: "success",
          icon: "user",
          title: `${newClientsCount} nuov${newClientsCount === 1 ? "o" : "i"} client${newClientsCount === 1 ? "e" : "i"} questa settimana`,
          message: `Totale: ${totalClientsCount} clienti`,
          timestamp: now.toISOString(),
          actionUrl: "/clienti",
          actionLabel: "Vedi clienti",
        });
      }

      // Se non ci sono notifiche, mostra un messaggio di benvenuto
      if (notifs.length === 0) {
        notifs.push({
          id: "welcome",
          type: "system",
          level: "info",
          icon: "bell",
          title: "Tutto in ordine!",
          message: "Nessuna notifica urgente al momento",
          timestamp: now.toISOString(),
        });
      }

      // Applica stato letto e filtra dismissati
      const final = notifs
        .filter(n => !dismissedIds.includes(n.id))
        .map(n => ({
          ...n,
          read: readIds.includes(n.id),
        }));

      setNotifications(final);
    } catch (err) {
      console.error("useNotifications: error generating notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase, getReadIds, getDismissedIds]);

  // Invio email scadenze veicoli (ogni 6 ore)
  const checkAndSendExpirationEmails = useCallback(async () => {
    if (!orgId) return;
    const EMAIL_INTERVAL_MS = 6 * 60 * 60 * 1000;
    const lastSentKey = `rm-scadenze-email-sent:${orgId}`;
    const lastSent = parseInt(localStorage.getItem(lastSentKey) || '0', 10);
    if (Date.now() - lastSent < EMAIL_INTERVAL_MS) return;

    try {
      // Controlla se email notifiche sono abilitate
      const { data: settingsRow } = await supabase
        .from('org_settings')
        .select('value')
        .eq('org_id', orgId)
        .eq('key', 'email_notifications')
        .maybeSingle();

      const settings = settingsRow?.value;
      if (!settings?.enabled || !settings?.email) return;
      if (settings?.types?.scadenzeVeicoli === false) return;

      // Controlla anche le prefs Electron (fallback)
      const { data: orgData } = await supabase.from('orgs').select('name').eq('id', orgId).maybeSingle();
      const orgName = orgData?.name || 'RescueManager';

      const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('targa, scad_assicurazione, scad_revisione, scad_bollo')
        .eq('org_id', orgId)
        .or(`scad_assicurazione.lte.${in30days},scad_revisione.lte.${in30days},scad_bollo.lte.${in30days}`)
        .limit(50);

      if (!vehicles?.length) {
        localStorage.setItem(lastSentKey, String(Date.now()));
        return;
      }

      // Invia email per ogni veicolo con scadenza imminente
      for (const v of vehicles) {
        const scadenze = [
          { tipo: 'assicurazione', data: v.scad_assicurazione },
          { tipo: 'revisione', data: v.scad_revisione },
          { tipo: 'bollo', data: v.scad_bollo },
        ];
        for (const s of scadenze) {
          if (!s.data || s.data > in30days) continue;
          const giorni = Math.ceil((new Date(s.data) - new Date(today)) / 86400000);
          try {
            await sendScadenzaNotification({
              to: settings.email,
              vehiclePlate: v.targa,
              scadenzaTipo: s.tipo,
              scadenzaData: s.data,
              giorniMancanti: Math.max(0, giorni),
              orgName,
            });
          } catch (emailErr) {
            console.error('[NOTIF] Email scadenza error:', emailErr);
          }
        }
      }

      localStorage.setItem(lastSentKey, String(Date.now()));
      console.log(`[NOTIF] Email scadenze inviate per ${vehicles.length} veicoli`);
    } catch (err) {
      console.error('[NOTIF] checkAndSendExpirationEmails error:', err);
    }
  }, [orgId, supabase]);

  // Carica al mount e ogni 60 secondi
  useEffect(() => {
    generateNotifications();
    checkAndSendExpirationEmails();
    intervalRef.current = setInterval(generateNotifications, 60000);
    return () => clearInterval(intervalRef.current);
  }, [generateNotifications, checkAndSendExpirationEmails]);

  const markAsRead = useCallback((id) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(readKey, JSON.stringify(readIds));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [readKey, getReadIds]);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(readKey, JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications, readKey]);

  const dismiss = useCallback((id) => {
    const dismissedIds = getDismissedIds();
    if (!dismissedIds.includes(id)) {
      dismissedIds.push(id);
      localStorage.setItem(dismissKey, JSON.stringify(dismissedIds));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [dismissKey, getDismissedIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh: generateNotifications,
  };
}
