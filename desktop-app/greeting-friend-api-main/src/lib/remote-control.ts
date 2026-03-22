/**
 * Remote Control Service
 * 
 * Gestisce:
 * - Check manutenzione (all'avvio + polling ogni 30s)
 * - Controllo versioni e aggiornamenti forzati
 * - Heartbeat per monitoraggio real-time
 */

// ✅ Usa VPS per monitoring/maintenance invece di Vercel
const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL || 'https://rescuemanager.eu/api';

interface MaintenanceStatus {
  is_active: boolean;
  message: string | null;
  started_at: string | null;
}

interface VersionStatus {
  update_required: boolean;
  force_update: boolean;
  current_version: string;
  min_required: string;
  latest_version: string;
  notes?: string | null;
}

interface HeartbeatData {
  user_id: string;
  org_id: string;
  app_version: string;
}

class RemoteControlService {
  // ✅ RIDOTTO: Da 30s a 5 minuti per ridurre edge requests Vercel
  private static POLLING_INTERVAL = 300000; // 5 minuti (era 30 secondi)
  // ✅ RIDOTTO: Da 5 min a 30 minuti per ridurre edge requests Vercel
  private static VERSION_CHECK_INTERVAL = 1800000; // 30 minuti (era 5 minuti)
  private maintenanceCheckInterval: NodeJS.Timeout | null = null;
  private versionCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private onMaintenanceChange: ((status: MaintenanceStatus) => void) | null = null;
  private onVersionUpdate: ((status: VersionStatus) => void) | null = null;
  private isCheckingMaintenance = false;
  private lastMaintenanceCheck = 0;

  /**
   * Check manutenzione
   */
  async checkMaintenance(): Promise<MaintenanceStatus> {
    // Evita richieste simultanee
    if (this.isCheckingMaintenance) {
      console.log('[RemoteControl] Already checking maintenance, skipping');
      return { is_active: false, message: null, started_at: null };
    }

    this.isCheckingMaintenance = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10 secondi

      const response = await fetch(`${API_BASE_URL}/maintenance/status`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Se timeout (504) o errore server, ritorna default (manutenzione OFF)
        if (response.status === 504 || response.status >= 500) {
          console.warn('[RemoteControl] Maintenance check server error:', response.status, '(assuming no maintenance)');
          this.isCheckingMaintenance = false;
          return { is_active: false, message: null, started_at: null };
        }

        console.error('[RemoteControl] Maintenance check failed:', response.status);
        this.isCheckingMaintenance = false;
        return { is_active: false, message: null, started_at: null };
      }
      const data = await response.json();
      console.log('[RemoteControl] Maintenance status:', data.is_active ? 'ON' : 'OFF');
      this.isCheckingMaintenance = false;
      return data;
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        console.error('[RemoteControl] Request timeout');
      } else {
        console.error('[RemoteControl] Error checking maintenance:', error);
      }
      this.isCheckingMaintenance = false;
      return { is_active: false, message: null, started_at: null };
    }
  }

  /**
   * Check versioni
   */
  async checkVersion(currentVersion: string = '0.1.0'): Promise<VersionStatus> {
    try {
      // Skip se l'endpoint non è configurato (evita 404 su fallback)
      const versionApiUrl = import.meta.env.VITE_VERSION_API_URL;
      if (!versionApiUrl) {
        return {
          update_required: false,
          force_update: false,
          current_version: currentVersion,
          min_required: currentVersion,
          latest_version: currentVersion
        };
      }
      const response = await fetch(`${versionApiUrl}/version/check?current=${currentVersion}`);
      if (!response.ok) {
        // Non è critico se fallisce (default: no update required)
        if (response.status === 404) {
          console.log('[RemoteControl] Version check endpoint not available, assuming no update required');
        } else {
          console.warn('[RemoteControl] Version check failed:', response.status);
        }
        return {
          update_required: false,
          force_update: false,
          current_version: currentVersion,
          min_required: currentVersion,
          latest_version: currentVersion
        };
      }
      const data = await response.json();
      return data;
    } catch (error) {
      // Non è critico se fallisce (default: no update required)
      console.log('[RemoteControl] Version check unavailable, assuming no update required');
      return {
        update_required: false,
        force_update: false,
        current_version: currentVersion,
        min_required: currentVersion,
        latest_version: currentVersion
      };
    }
  }

  /**
   * Invia heartbeat con autenticazione
   */
  async sendHeartbeat(data: HeartbeatData): Promise<void> {
    try {
      // Recupera token OAuth
      const tokens = this.getOAuthTokens();
      if (!tokens?.access_token) {
        console.error('[RemoteControl] No OAuth token for heartbeat');
        return;
      }

      // Verifica se il token è scaduto
      if (tokens.created_at) {
        const expiresAt = tokens.created_at + (tokens.expires_in * 1000);
        if (Date.now() >= expiresAt) {
          console.error('[RemoteControl] OAuth token expired, skipping heartbeat');
          return;
        }
      }

      // ✅ Aggiungi timeout per evitare richieste bloccanti
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10 secondi

      const response = await fetch(`${API_BASE_URL}/monitoring/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify({
          ...data,
          online: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Se timeout (504) o errore server, logga ma non blocca
        if (response.status === 504 || response.status >= 500) {
          console.warn('[RemoteControl] Heartbeat server error:', response.status, '(ignoring, will retry)');
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        console.error('[RemoteControl] Heartbeat failed:', response.status, errorData);

        // Se token invalido, salta il prossimo heartbeat
        if (response.status === 401) {
          console.error('[RemoteControl] Invalid token, will skip next heartbeat');
        }
      } else {
        console.log('[RemoteControl] Heartbeat sent successfully');
      }
    } catch (error) {
      // ✅ Gestisci timeout e errori di rete senza bloccare l'app
      if ((error as any).name === 'AbortError') {
        console.warn('[RemoteControl] Heartbeat timeout (ignoring, will retry)');
      } else {
        console.error('[RemoteControl] Error sending heartbeat:', error);
      }
    }
  }

  /**
   * Recupera token OAuth da localStorage
   */
  private getOAuthTokens(): any {
    try {
      const stored = localStorage.getItem('rm-oauth-tokens');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Inizia polling manutenzione
   */
  startMaintenancePolling(onChange: (status: MaintenanceStatus) => void): void {
    this.onMaintenanceChange = onChange;

    // Check immediato con delay
    setTimeout(() => {
      this.checkMaintenance().then(status => {
        if (status && this.onMaintenanceChange) {
          this.onMaintenanceChange(status);
        }
      }).catch(err => {
        console.error('[RemoteControl] Initial maintenance check failed:', err);
      });
    }, 3000); // 3 secondi di delay

    // ✅ RIDOTTO: Polling ogni 5 minuti invece di 60s per ridurre edge requests Vercel
    this.maintenanceCheckInterval = setInterval(async () => {
      const status = await this.checkMaintenance();
      // Solo aggiorna se lo stato è cambiato
      if (this.onMaintenanceChange) {
        this.onMaintenanceChange(status);
      }
    }, 300000); // 5 minuti invece di 60 secondi

    console.log('[RemoteControl] Maintenance polling started - interval: 5min (ridotto per ridurre costi Vercel)');
  }

  /**
   * Stop polling manutenzione
   */
  stopMaintenancePolling(): void {
    if (this.maintenanceCheckInterval) {
      clearInterval(this.maintenanceCheckInterval);
      this.maintenanceCheckInterval = null;
      console.log('[RemoteControl] Maintenance polling stopped');
    }
  }

  /**
   * Inizia polling versioni
   */
  startVersionCheck(currentVersion: string, onUpdate: (status: VersionStatus) => void): void {
    this.onVersionUpdate = onUpdate;

    // Check immediato
    this.checkVersion(currentVersion).then(status => {
      if (status) {
        this.onVersionUpdate?.(status);
      }
    });

    // Polling ogni 5 minuti
    this.versionCheckInterval = setInterval(async () => {
      const status = await this.checkVersion(currentVersion);
      if (this.onVersionUpdate) {
        this.onVersionUpdate(status);
      }
    }, RemoteControlService.VERSION_CHECK_INTERVAL);

    console.log('[RemoteControl] Version check started');
  }

  /**
   * Stop polling versioni
   */
  stopVersionCheck(): void {
    if (this.versionCheckInterval) {
      clearInterval(this.versionCheckInterval);
      this.versionCheckInterval = null;
      console.log('[RemoteControl] Version check stopped');
    }
  }

  /**
   * Inizia heartbeat
   */
  startHeartbeat(data: HeartbeatData): void {
    // Send immediately
    this.sendHeartbeat(data);

    // Polling ogni 30s
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(data);
    }, RemoteControlService.POLLING_INTERVAL);

    console.log('[RemoteControl] Heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[RemoteControl] Heartbeat stopped');
    }
  }

  /**
   * Cleanup completo
   */
  cleanup(): void {
    this.stopMaintenancePolling();
    this.stopVersionCheck();
    this.stopHeartbeat();
    console.log('[RemoteControl] Service cleaned up');
  }
}

export const remoteControl = new RemoteControlService();
export type { MaintenanceStatus, VersionStatus };

