// src/pages/DebugSync.jsx
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

export default function DebugSync() {
  const { orgId, userId, orgs } = useOrg();
  const [profile, setProfile] = useState(null);
  const [transports, setTransports] = useState([]);
  const [websiteOrgId, setWebsiteOrgId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = supabaseBrowser();
      
      // Carica profile
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        setProfile(prof);
        setWebsiteOrgId(prof?.current_org);
      }
      
      // Carica transports per orgId attuale
      if (orgId) {
        const { data: trs } = await supabase
          .from("transports")
          .select("*")
          .eq("org_id", orgId);
        setTransports(trs || []);
      }
    };
    
    loadData();
  }, [userId, orgId]);

  const isMatch = orgId === websiteOrgId;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold"> Debug Sincronizzazione</h1>
      
      {/* Org Comparison */}
      <div className={`rounded-lg p-4 border-2 ${isMatch ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
        <h2 className="font-semibold mb-2">Organizzazioni</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>App Desktop orgId:</strong> 
            <span className="font-mono ml-2">{orgId || 'NONE'}</span>
          </div>
          <div>
            <strong>Sito Web current_org:</strong> 
            <span className="font-mono ml-2">{websiteOrgId || 'NONE'}</span>
          </div>
          <div className={`font-bold ${isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
            {isMatch ? ' MATCH' : ' MISMATCH'}
          </div>
        </div>
      </div>

      {/* Orgs List */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Organizzazioni Utente ({orgs.length})</h2>
        <div className="space-y-1">
          {orgs.map(org => (
            <div key={org.id} className={`text-sm ${org.id === orgId ? 'font-bold text-blue-600' : ''}`}>
              {org.name} ({org.role}) - {org.id}
            </div>
          ))}
        </div>
      </div>

      {/* Transports */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Trasporti per orgId Attuale ({transports.length})</h2>
        <div className="space-y-1 text-sm">
          {transports.map(t => (
            <div key={t.id} className="font-mono text-xs">
              #{t.id} - {t.pickup_address || t.indirizzo} - org: {t.org_id}
            </div>
          ))}
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Profilo Utente</h2>
          <pre className="text-xs bg-[#141c27] p-2 rounded overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

