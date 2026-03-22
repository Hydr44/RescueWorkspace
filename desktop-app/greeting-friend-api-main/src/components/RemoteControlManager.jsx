import { useEffect, useState } from "react";
import { useOrg } from "@/context/OrgContext";
import { remoteControl } from "@/lib/remote-control";

const APP_VERSION = "0.1.0";

export default function RemoteControlManager({ onMaintenanceChange }) {
  const { userId, orgId } = useOrg();
  const [lastHeartbeat, setLastHeartbeat] = useState(0);

  useEffect(() => {
    let heartbeatInterval = null;

    // Avvia heartbeat se utente e org sono disponibili
    if (userId && orgId) {
      const heartbeatData = {
        user_id: userId,
        org_id: orgId,
        app_version: APP_VERSION
      };

      // Start heartbeat immediato
      remoteControl.sendHeartbeat(heartbeatData);
      setLastHeartbeat(Date.now());

      // Polling ogni 30 secondi
      heartbeatInterval = setInterval(() => {
        remoteControl.sendHeartbeat(heartbeatData);
        setLastHeartbeat(Date.now());
      }, 30000);

      console.log('[RemoteControlManager] Heartbeat started for user:', userId, 'org:', orgId);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        console.log('[RemoteControlManager] Heartbeat stopped');
      }
      remoteControl.stopHeartbeat();
    };
  }, [userId, orgId]);

  return null; // Componente invisibile
}

