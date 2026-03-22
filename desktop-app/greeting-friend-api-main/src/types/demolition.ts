// src/types/demolition.ts
export type DemolitionCase = {
    id: string;
    org_id: string;
    client_id?: string | null;
    transport_id?: string | null;
  
    targa?: string | null;
    telaio?: string | null;
    marca_modello?: string | null;
    anno?: number | null;
  
    stato: 'bozza'|'documenti'|'inviata'|'completata'|'scartata';
    pra_check?: any | null;
    docs: Array<{name:string; url:string; type?:string}>;
  
    invoice_id?: string | null;
    invoice_total_cents?: number | null;
    invoice_currency?: string;
    invoice_number?: string | null;
    invoice_date?: string | null; // ISO date
    note?: string | null;
  
    created_by?: string | null;
    created_at: string; // ISO
    updated_at: string; // ISO
  };