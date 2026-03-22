// src/pages/DebugAuth.jsx
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function DebugAuth() {
  const [info, setInfo] = useState("Caricamento…");

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const ss = await supabase.auth.getSession();
      const usr = await supabase.auth.getUser();

      setInfo(JSON.stringify(
        {
          session: !!ss.data.session,
          expires_at: ss.data.session?.expires_at,
          user_email: usr.data.user?.email ?? null,
          user_id: usr.data.user?.id ?? null,
        },
        null,
        2
      ));
    })();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-2">Debug Auth</h1>
      <pre className="text-xs bg-[#141c27] p-3 rounded-xl overflow-x-auto">
        {info}
      </pre>
    </div>
  );
}