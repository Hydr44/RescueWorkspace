import { useEffect, useState } from "react";

export default function TestSupabase() {
  const [msg, setMsg] = useState("Test in corso…");

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL + "/auth/v1/health";

    fetch(url, { method: "GET" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json().catch(() => ({}));
      })
      .then((data) => setMsg(" Supabase raggiungibile: " + JSON.stringify(data)))
      .catch((err) => setMsg(" Errore: " + err.message));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Test Supabase</h1>
      <pre className="mt-2 text-sm">{msg}</pre>
    </div>
  );
}