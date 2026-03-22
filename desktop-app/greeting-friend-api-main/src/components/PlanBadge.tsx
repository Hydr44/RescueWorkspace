import React from "react";



type Props = {
    status?: string | null;
    renewAt?: string | null;
    planName?: string | null;
  };
  
  export default function PlanBadge({ status, renewAt, planName }: Props) {
    return (
      <div className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-lg border">
        <span className="font-medium">{planName || "Free"}</span>
        {status && <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">{status}</span>}
        {renewAt && <span className="text-slate-400">Rinnovo: {renewAt}</span>}
      </div>
    );
  }