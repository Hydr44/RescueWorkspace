import { OAuthService } from './oauth';
import { supabaseBrowser } from './supabase-browser';

const API_BASE_URL = 'https://rescuemanager.eu/api/sync';

// TypeScript declaration for window.api
declare global {
  interface Window {
    api?: {
      transports?: {
        create: (data: any) => Promise<any>;
        list: () => Promise<any[]>;
        update: (id: any, data: any) => Promise<any>;
        remove: (id: any) => Promise<any>;
      };
      clients?: {
        create: (data: any) => Promise<any>;
        list: () => Promise<any[]>;
        update: (id: any, data: any) => Promise<any>;
        remove: (id: any) => Promise<any>;
      };
    };
  }
}

interface SyncOptions {
  orgId: string;
  table?: string;
  since?: string;
}

interface SyncResult {
  success: boolean;
  data?: any;
  error?: string;
}

class SyncService {
  private static syncInProgress = false;
  private static lastSyncTime: Date | null = null;
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Ottieni token OAuth per autenticazione
   */
  private static async getAuthHeaders(): Promise<Headers> {
    const tokens = await OAuthService.getTokens();
    if (!tokens?.access_token) {
      throw new Error('Not authenticated');
    }

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${tokens.access_token}`);
    headers.set('Content-Type', 'application/json');
    return headers;
  }

  /**
   * Verifica stato di sincronizzazione
   */
  static async getSyncStatus(orgId: string): Promise<any> {
    try {
      console.log('[SyncService] Getting sync status for org:', orgId);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/status?org_id=${orgId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('[SyncService] Sync status:', data);
      return data;
    } catch (error) {
      console.error('[SyncService] Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Pull data from server
   */
  static async pull(options: SyncOptions): Promise<SyncResult> {
    try {
      console.log('[SyncService] Pulling data:', options);
      const headers = await this.getAuthHeaders();

      const params = new URLSearchParams({ org_id: options.orgId });
      if (options.table) params.set('table', options.table);
      if (options.since) params.set('since', options.since);

      const response = await fetch(`${API_BASE_URL}/pull?${params}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('[SyncService] Pulled data:', data);
      
      this.lastSyncTime = new Date();
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('[SyncService] Error pulling data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Push data to server
   */
  static async push(table: string, data: any[], orgId: string): Promise<SyncResult> {
    try {
      console.log('[SyncService] Pushing data to', table, 'for org:', orgId);
      const headers = await this.getAuthHeaders();

      // Assicurati che tutti gli item abbiano org_id
      const dataWithOrgId = data.map(item => ({
        ...item,
        org_id: orgId,
        updated_at: new Date().toISOString()
      }));

      const response = await fetch(`${API_BASE_URL}/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          org_id: orgId,
          table,
          data: dataWithOrgId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      console.log('[SyncService] Pushed data:', result);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[SyncService] Error pushing data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync all data (pull from server)
   */
  static async syncAll(orgId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[SyncService] Sync already in progress, skipping...');
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    try {
      console.log('[SyncService] Starting full sync for org:', orgId);
      
      const result = await this.pull({ orgId });
      
      if (result.success && result.data) {
        // Salva in localStorage/cache locale
        await this.saveToCache(orgId, result.data);
      }
      
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync specific table
   */
  static async syncTable(orgId: string, table: string, since?: string): Promise<SyncResult> {
    try {
      console.log('[SyncService] Syncing table:', table, 'for org:', orgId);
      
      const result = await this.pull({ orgId, table, since });
      
      if (result.success && result.data) {
        // Salva in cache locale
        await this.saveToCacheTable(orgId, table, result.data);
      }
      
      return result;
    } catch (error) {
      console.error('[SyncService] Error syncing table:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Attiva sync in background
   */
  static startBackgroundSync(orgId: string, intervalMs: number = 60000): void {
    console.log('[SyncService] Starting background sync every', intervalMs, 'ms');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync immediato
    this.syncAll(orgId);

    // Poi ogni intervallo
    this.syncInterval = setInterval(() => {
      this.syncAll(orgId);
    }, intervalMs);
  }

  /**
   * Ferma sync in background
   */
  static stopBackgroundSync(): void {
    console.log('[SyncService] Stopping background sync');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Subscribe a real-time changes via Supabase
   */
  static subscribeToChanges(orgId: string, table: string, callback: (payload: any) => void): () => void {
    console.log('[SyncService] Subscribing to real-time changes for', table);
    
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`sync:${table}:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `org_id=eq.${orgId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Salva in cache locale
   */
  private static async saveToCache(orgId: string, data: any): Promise<void> {
    try {
      const cacheKey = `sync:cache:${orgId}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      // Salva anche nel database locale se disponibile
      await this.saveToLocalDatabase(orgId, data);
    } catch (error) {
      console.error('[SyncService] Error saving to cache:', error);
    }
  }

  /**
   * Salva nel database locale (SQLite)
   */
  private static async saveToLocalDatabase(orgId: string, data: any): Promise<void> {
    try {
      const api = globalThis.window?.api;
      
      if (!api?.transports) {
        console.log('[SyncService] No local database API available, skipping local save');
        return;
      }

      // Salva trasporti nel database locale
      if (data.transports && Array.isArray(data.transports) && api.transports?.create) {
        console.log('[SyncService] Saving', data.transports.length, 'transports to local database');
        console.log('[SyncService] First transport example:', data.transports[0]);
        
        // Crea una mappa dei clienti per look-up rapido
        const clientsMap = new Map();
        if (data.clients && Array.isArray(data.clients)) {
          data.clients.forEach(client => {
            clientsMap.set(client.id, client);
          });
        }
        
        for (const transport of data.transports) {
          try {
            // Trova il nome del cliente dal client_id
            let clienteNome = 'Cliente Sconosciuto';
            if (transport.client_id && clientsMap.has(transport.client_id)) {
              const client = clientsMap.get(transport.client_id);
              clienteNome = client.nome || client.name || 'Cliente Sconosciuto';
            }
            
            // Mappa i campi di Supabase ai campi del database locale
            const localTransport = {
              cliente: clienteNome,
              indirizzo: transport.pickup_address || transport.dropoff_address || '',
              stato: this.mapSupabaseStatusToLocal(transport.status),
              orario: transport.created_at || null,
              autista: null, // driver_id è UUID, non salviamo direttamente
              mezzo: null, // vehicle_id è UUID, non salviamo direttamente
              note: transport.notes || null
            };

            console.log('[SyncService] Mapped transport:', localTransport);

            // Salva nel database locale
            await api.transports.create(localTransport);
            console.log('[SyncService] Saved transport:', localTransport);
          } catch (err) {
            console.error('[SyncService] Error saving transport:', err);
          }
        }
      }

      // Salva clienti
      if (data.clients && Array.isArray(data.clients) && api.clients?.create) {
        console.log('[SyncService] Saving', data.clients.length, 'clients to local database');
        
        for (const client of data.clients) {
          try {
            const localClient = {
              nome: client.name || client.nome || '',
              telefono: client.phone || client.telefono || '',
              email: client.email || '',
              piva: client.vat_number || client.piva || '',
              indirizzo: client.address || client.indirizzo || '',
              note: client.notes || client.note || ''
            };

            await api.clients.create(localClient);
            console.log('[SyncService] Saved client:', localClient);
          } catch (err) {
            console.error('[SyncService] Error saving client:', err);
          }
        }
      }
    } catch (error) {
      console.error('[SyncService] Error saving to local database:', error);
    }
  }

  /**
   * Mappa lo stato di Supabase allo stato locale
   */
  private static mapSupabaseStatusToLocal(status: string): string {
    const statusMap = {
      'new': 'da fare',
      'assigned': 'in corso',
      'enroute': 'in corso',
      'done': 'completato',
      'cancelled': 'in attesa'
    };
    return statusMap[status] || 'da fare';
  }

  /**
   * Salva tabella specifica in cache
   */
  private static async saveToCacheTable(orgId: string, table: string, data: any): Promise<void> {
    try {
      const cacheKey = `sync:cache:${orgId}:${table}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[SyncService] Error saving table to cache:', error);
    }
  }

  /**
   * Leggi da cache
   */
  static getCachedData(orgId: string, table?: string): any | null {
    try {
      const cacheKey = table 
        ? `sync:cache:${orgId}:${table}`
        : `sync:cache:${orgId}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[SyncService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Ottieni timestamp ultimo sync
   */
  static getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}

export default SyncService;

