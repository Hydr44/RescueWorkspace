// src/components/Topbar.jsx
import { useEffect, useState } from "react";
import { Bars3Icon, ArrowRightOnRectangleIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { useOrg } from "@/context/OrgContext";
import { supabaseBrowser } from "@/lib/supabase-browser";
import RVFUNotificationCenter from "@/components/rvfu/RVFUNotificationCenter";
import PropTypes from 'prop-types';
import logoUrl from "@/assets/logo.png";

export default function Topbar({ onMenu, onLogout }) {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orgId) { setOrgName(""); return; }
      const { data, error } = await supabase
        .from("orgs")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();
      if (!alive) return;
      setOrgName(error ? "" : (data?.name || ""));
    })();
    return () => { alive = false; };
  }, [orgId, supabase]);

  return (
    <header className="sticky top-0 z-40 bg-[#1a2536]/90backdrop-blur border-b border-[#243044] ">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 flex items-center gap-3">
        {/* Menu Mobile */}
        <button
          onClick={onMenu}
          className="p-2 rounded-lg hover:bg-[#141c27]  sm:hidden"
          aria-label="Apri menu"
        >
          <Bars3Icon className="size-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
            <img src={logoUrl} alt="RescueManager" className="w-full h-full object-contain" />
          </div>
          <span className="hidden sm:block text-base font-extrabold text-white tracking-tight">
            RESCUE<span className="text-blue-500">MANAGER</span>
          </span>
        </div>

        {/* Nome azienda (org) */}
        <div className="ml-2 flex items-center gap-2 text-sm text-slate-400 ">
          <BuildingOffice2Icon className="size-5 opacity-70" />
          <span className="font-medium truncate max-w-[40vw] sm:max-w-[28rem]">
            {orgName || "Organizzazione"}
          </span>
        </div>

        {/* Azioni lato destro */}
        <div className="ml-auto flex items-center gap-3">
          {/* Notifiche RVFU */}
          <RVFUNotificationCenter orgId={orgId} />

          {/* Profilo Utente (avatar placeholder) */}
          <button
            type="button"
            title="Profilo"
            className="h-9 w-9 rounded-full overflow-hidden border border-[#243044] "
          >
            <img
              src="https://ui-avatars.com/api/?name=RM&background=4f46e5&color=fff"
              alt="Profilo"
              className="h-full w-full object-cover"
            />
          </button>

          {/* Logout */}
          <button
            type="button"
            title="Logout"
            onClick={onLogout}
            className="h-9 w-9 grid place-items-center rounded-lg border border-[#243044]  hover:bg-red-500/10 text-red-600"
          >
            <ArrowRightOnRectangleIcon className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

Topbar.propTypes = {
  onMenu: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};