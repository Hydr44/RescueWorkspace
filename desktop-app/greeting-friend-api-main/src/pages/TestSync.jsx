import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SyncService from "@/lib/sync";
import { useOrg } from "@/context/OrgContext";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function TestSync() {
  const navigate = useNavigate();
  const { orgId, orgName, userId, orgs } = useOrg();
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("idle");
  const [lastSync, setLastSync] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transports, setTransports] = useState([]);
  const [websiteOrgId, setWebsiteOrgId] = useState(null);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}]`, message);
  };

  // Carica dati debug
  useEffect(() => {
    const loadDebugData = async () => {
      if (!userId) return;
      
      const supabase = supabaseBrowser();
      
      // Carica profile
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        setProfile(prof);
        setWebsiteOrgId(prof?.current_org);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
      
      // Carica transports
      if (orgId) {
        try {
          const { data: trs } = await supabase
            .from("transports")
            .select("*")
            .eq("org_id", orgId);
          setTransports(trs || []);
        } catch (err) {
          console.error("Error loading transports:", err);
        }
      }
    };
    
    loadDebugData();
  }, [userId, orgId]);

  // Test Sync Status
  const testStatus = async () => {
    addLog("=== TEST SYNC STATUS ===", "info");
    setStatus("testing");
    
    try {
      const result = await SyncService.getSyncStatus(orgId);
      addLog(`Sync status loaded: ${JSON.stringify(result, null, 2)}`, "success");
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setStatus("idle");
    }
  };

  // Test Sync Pull
  const testPull = async (table = "clients") => {
    addLog(`=== TEST SYNC PULL: ${table} ===`, "info");
    setStatus("testing");
    
    try {
      const result = await SyncService.pull({ orgId, table });
      
      if (result.success) {
        const count = result.data?.length || 0;
        addLog(`Pulled ${count} records from ${table}`, "success");
        addLog(`Data: ${JSON.stringify(result.data, null, 2)}`, "info");
      } else {
        addLog(`Error: ${result.error}`, "error");
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setStatus("idle");
    }
  };

  // Test Sync All
  const testSyncAll = async () => {
    addLog("=== TEST SYNC ALL ===", "info");
    setStatus("testing");
    
    try {
      const result = await SyncService.syncAll(orgId);
      
      if (result.success) {
        addLog("Sync all completed successfully", "success");
        setLastSync(new Date());
      } else {
        addLog(`Error: ${result.error}`, "error");
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setStatus("idle");
    }
  };

  // Test Push
  const testPush = async () => {
    addLog("=== TEST SYNC PUSH ===", "info");
    setStatus("testing");
    
    try {
      const testClient = {
        nome: `Test Client ${Date.now()}`,
        phone: "123456789",
        email: "test@example.com",
        org_id: orgId
      };

      const result = await SyncService.push("clients", [testClient], orgId);
      
      if (result.success) {
        addLog("Push successful", "success");
        addLog(`Response: ${JSON.stringify(result.data, null, 2)}`, "info");
      } else {
        addLog(`Error: ${result.error}`, "error");
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setStatus("idle");
    }
  };

  // Test Real-time
  const testRealtime = () => {
    addLog("=== TEST REAL-TIME SUBSCRIPTION ===", "info");
    setStatus("testing");
    
    try {
      const unsubscribe = SyncService.subscribeToChanges(
        orgId,
        "transports",
        (payload) => {
          addLog(`Real-time update received: ${JSON.stringify(payload, null, 2)}`, "success");
        }
      );

      addLog("Real-time subscription active for 30 seconds...", "info");
      
      setTimeout(() => {
        unsubscribe();
        addLog("Real-time subscription ended", "info");
        setStatus("idle");
      }, 30000);
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
      setStatus("idle");
    }
  };

  // Test Background Sync
  const startBackgroundSync = () => {
    addLog("=== STARTING BACKGROUND SYNC ===", "info");
    SyncService.startBackgroundSync(orgId, 60000); // Ogni minuto
    addLog("Background sync started (every 60s)", "success");
  };

  const stopBackgroundSync = () => {
    addLog("=== STOPPING BACKGROUND SYNC ===", "info");
    SyncService.stopBackgroundSync();
    addLog("Background sync stopped", "info");
  };

  return (
    <div className="space-y-4 bg-[#141c27] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a2536] rounded-lg  p-6">
          <h1 className="text-3xl font-bold mb-6"> Test Sincronizzazione</h1>
          
          <div className="mb-6">
            <p className="text-slate-400">
              Org: <span className="font-semibold">{orgName}</span> ({orgId})
            </p>
            {lastSync && (
              <p className="text-sm text-slate-500">
                Ultimo sync: {lastSync.toLocaleString()}
              </p>
            )}
          </div>

          {/* Debug Section - VISIBILE SUBITO */}
          <div className="mb-8 border rounded-lg p-4 bg-[#141c27]">
            <h2 className="text-xl font-bold mb-4"> Debug Info</h2>
            
            {/* Org Comparison */}
            <div className={`rounded p-3 mb-3 ${orgId === websiteOrgId ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
              <div className="text-sm space-y-1">
                <div>
                  <strong>App orgId:</strong> 
                  <span className="font-mono ml-2 text-xs">{orgId || 'NONE'}</span>
                </div>
                <div>
                  <strong>Site current_org:</strong> 
                  <span className="font-mono ml-2 text-xs">{websiteOrgId || 'NONE'}</span>
                </div>
                <div className={`font-bold text-lg ${orgId === websiteOrgId ? 'text-emerald-400' : 'text-red-400'}`}>
                  {orgId === websiteOrgId ? ' MATCH' : ' MISMATCH'}
                </div>
              </div>
            </div>

            {/* Transports Count */}
            <div className="rounded border p-3">
              <div className="text-sm">
                <strong>Trasporti nel DB:</strong> <span className="font-mono text-blue-600">{transports.length}</span>
              </div>
              {transports.length > 0 && (
                <div className="text-xs mt-2 max-h-20 overflow-y-auto space-y-1">
                  {transports.slice(0, 3).map(t => (
                    <div key={t.id} className="font-mono">
                      #{t.id} - {t.pickup_address || t.indirizzo || 'No addr'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testStatus}
              disabled={status === "testing" || !orgId}
              className="btn btn-primary"
            >
              Test Status
            </button>
            
            <button
              onClick={() => testPull("clients")}
              disabled={status === "testing" || !orgId}
              className="btn btn-secondary"
            >
              Pull Clients
            </button>
            
            <button
              onClick={() => testPull("transports")}
              disabled={status === "testing" || !orgId}
              className="btn btn-secondary"
            >
              Pull Transports
            </button>
            
            <button
              onClick={testSyncAll}
              disabled={status === "testing" || !orgId}
              className="btn btn-success"
            >
              Sync All
            </button>
            
            <button
              onClick={testPush}
              disabled={status === "testing" || !orgId}
              className="btn btn-warning"
            >
              Test Push
            </button>
            
            <button
              onClick={testRealtime}
              disabled={status === "testing" || !orgId}
              className="btn btn-info"
            >
              Real-time Test
            </button>
            
            <button
              onClick={startBackgroundSync}
              disabled={status === "testing" || !orgId}
              className="btn btn-success"
            >
              Start Background
            </button>
            
            <button
              onClick={stopBackgroundSync}
              disabled={status === "testing" || !orgId}
              className="btn btn-danger"
            >
              Stop Background
            </button>
            
            <button
              onClick={() => setLogs([])}
              className="btn btn-outline"
            >
              Clear Logs
            </button>
          </div>

          {/* Logs */}
          <div className="bg-[#141c27] rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-500">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>{" "}
                  <span
                    className={
                      log.type === "error"
                        ? "text-red-400"
                        : log.type === "success"
                        ? "text-green-400"
                        : "text-slate-400"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Debug Section */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-bold mb-4"> Debug Sincronizzazione</h2>
            
            {/* Org Comparison */}
            <div className={`rounded-lg p-4 border-2 mb-4 ${orgId === websiteOrgId ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
              <h3 className="font-semibold mb-2">Organizzazioni</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>App Desktop orgId:</strong> 
                  <span className="font-mono ml-2 text-xs">{orgId || 'NONE'}</span>
                </div>
                <div>
                  <strong>Sito Web current_org:</strong> 
                  <span className="font-mono ml-2 text-xs">{websiteOrgId || 'NONE'}</span>
                </div>
                <div className={`font-bold ${orgId === websiteOrgId ? 'text-emerald-400' : 'text-red-400'}`}>
                  {orgId === websiteOrgId ? ' MATCH' : ' MISMATCH'}
                </div>
              </div>
            </div>

            {/* Orgs List */}
            <div className="rounded-lg border p-4 mb-4">
              <h3 className="font-semibold mb-2">Organizzazioni Utente ({orgs.length})</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {orgs.map(org => (
                  <div key={org.id} className={`text-sm ${org.id === orgId ? 'font-bold text-blue-600' : ''}`}>
                    {org.name} ({org.role}) - <span className="font-mono text-xs">{org.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transports */}
            <div className="rounded-lg border p-4 mb-4">
              <h3 className="font-semibold mb-2">Trasporti per orgId Attuale ({transports.length})</h3>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {transports.map(t => (
                  <div key={t.id} className="font-mono text-xs border-b pb-1">
                    #{t.id} - {t.pickup_address || t.indirizzo || 'No address'} - org: {t.org_id}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile */}
            {profile && (
              <div className="rounded-lg border p-4 mb-4">
                <h3 className="font-semibold mb-2">Profilo Utente</h3>
                <pre className="text-xs bg-[#141c27] p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="mt-6">
            <button onClick={() => navigate("/")} className="btn btn-outline">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

