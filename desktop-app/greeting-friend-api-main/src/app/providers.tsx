"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ToastProvider } from "@/context/ToastContext";
import { ModalProvider } from "@/components/ui/ModalProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  // crea una sola istanza
  const [supabase] = useState(() => supabaseBrowser());
  return (
    <ToastProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </ToastProvider>
  );
}