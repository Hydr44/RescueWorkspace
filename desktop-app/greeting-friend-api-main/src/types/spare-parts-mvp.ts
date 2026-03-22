// =====================================================
// SISTEMA RICAMBI MVP COMPLETO - TIPI TYPESCRIPT
// =====================================================

// 1. DISTINTE SMONTAGGIO E BATCH
// =====================================================

export interface DismantlingJob {
  id: string;
  org_id: string;
  
  // Dati veicolo
  vehicle_id?: string;
  targa?: string;
  telaio?: string;
  marca?: string;
  modello?: string;
  anno?: number;
  
  // Dati smontaggio
  dismantling_date: string;
  dismantler_name?: string;
  notes?: string;
  
  // Stato
  status: 'in_progress' | 'completed' | 'cancelled';
  
  // Metadata
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PartBatch {
  id: string;
  org_id: string;
  
  // Riferimenti
  job_id: string;
  part_id?: string;
  
  // Dati batch
  oem_code?: string;
  part_name: string;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  
  // Quantità
  qty_in: number;
  qty_available: number;
  qty_sold: number;
  
  // Prezzi
  cost_price?: number;
  list_price?: number;
  sell_price?: number;
  
  // Stato
  status: 'NEW' | 'QA_OK' | 'LISTED_STORE' | 'LISTED_ONLINE' | 'SOLD' | 'RETURNED' | 'DISCARDED';
  
  // Metadata
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 2. SISTEMA PREZZI E LISTINI QUATTORUOTE
// =====================================================

export interface QuattroruoteCatalog {
  id: string;
  
  // Identificazione veicolo
  make: string;
  model: string;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  
  // Categoria ricambio
  category: string;
  subcategory?: string;
  
  // Prezzo listino
  list_price: number;
  currency: string;
  
  // Metadata
  source: string;
  last_updated: string;
  created_at: string;
}

export interface PriceRule {
  id: string;
  org_id: string;
  
  // Dati regola
  name: string;
  description?: string;
  formula: string; // es: "max(list_price*0.6, cost*1.3)"
  
  // Condizioni
  condition_type: 'all' | 'category' | 'condition' | 'custom';
  condition_value?: string;
  
  // Stato
  active: boolean;
  priority: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// 3. GESTIONE MAGAZZINO AVANZATA
// =====================================================

export interface Shelf {
  id: string;
  org_id: string;
  
  // Codice scaffale
  code: string;
  area?: string;
  section?: string;
  shelf_number?: string;
  
  // Dettagli
  description?: string;
  capacity?: number;
  notes?: string;
  
  // Stato
  active: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface StockMove {
  id: string;
  org_id: string;
  
  // Riferimenti
  part_id: string;
  batch_id?: string;
  
  // Movimento
  qty: number;
  type: 'IN' | 'OUT' | 'ADJ' | 'TRANSFER';
  reason?: string;
  
  // Riferimento esterno
  ref_type?: string; // 'order', 'dismantling', 'adjustment', 'transfer'
  ref_id?: string;
  
  // Dettagli
  notes?: string;
  cost_per_unit?: number;
  
  // Metadata
  created_at: string;
  created_by?: string;
}

// 4. SISTEMA POS E VENDITE
// =====================================================

export interface Order {
  id: string;
  org_id: string;
  
  // Tipo ordine
  type: 'POS' | 'ONLINE' | 'WHOLESALE';
  
  // Cliente
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_tax_code?: string;
  
  // Totale
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  
  // Pagamento
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Stato
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  
  // Metadata
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface OrderLine {
  id: string;
  order_id: string;
  part_id: string;
  batch_id?: string;
  
  // Quantità e prezzi
  qty: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  
  // Metadata
  notes?: string;
  created_at: string;
}

// 5. SISTEMA BARCODE E ETICHETTE
// =====================================================

export interface Barcode {
  id: string;
  org_id: string;
  
  // Riferimenti
  part_id: string;
  
  // Barcode
  symbology: string;
  value: string;
  
  // Tipo
  type: 'part' | 'location' | 'batch';
  
  // Metadata
  created_at: string;
  created_by?: string;
}

// 6. VENDITA ONLINE E MARKETPLACE
// =====================================================

export interface Marketplace {
  id: string;
  org_id: string;
  
  // Dati marketplace
  name: 'woo' | 'shopify' | 'csv' | 'custom';
  display_name: string;
  
  // Configurazione
  config: Record<string, any>;
  active: boolean;
  
  // Sync
  last_sync?: string;
  sync_status: 'idle' | 'syncing' | 'error' | 'success';
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListing {
  id: string;
  marketplace_id: string;
  part_id: string;
  
  // ID esterno
  external_id?: string;
  
  // Stato
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  
  // Dati sincronizzati
  payload: Record<string, any>;
  
  // Sync
  last_sync: string;
  sync_errors: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// 7. TIPI ESTESI PER COMPATIBILITÀ
// =====================================================

// Estende SparePart esistente con nuovi campi
export interface SparePartExtended extends SparePart {
  // Nuovi campi per MVP
  shelf_id?: string;
  batch_id?: string;
  dismantling_job_id?: string;
  
  // Prezzi estesi
  cost_price?: number;
  list_price?: number;
  margin_percentage?: number;
  
  // Stato esteso
  listing_status?: 'STORE' | 'ONLINE' | 'BOTH' | 'NONE';
  
  // Barcode
  barcode?: string;
  
  // Marketplace
  marketplace_listings?: MarketplaceListing[];
}

// 8. TIPI PER FORM E UI
// =====================================================

export interface DismantlingJobForm {
  vehicle_id?: string;
  targa?: string;
  telaio?: string;
  marca?: string;
  modello?: string;
  anno?: number;
  dismantling_date: string;
  dismantler_name?: string;
  notes?: string;
}

export interface PartBatchForm {
  job_id: string;
  oem_code?: string;
  part_name: string;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  qty_in: number;
  cost_price?: number;
  list_price?: number;
  sell_price?: number;
  notes?: string;
}

export interface OrderForm {
  type: 'POS' | 'ONLINE' | 'WHOLESALE';
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_tax_code?: string;
  payment_method?: string;
  notes?: string;
  lines: OrderLineForm[];
}

export interface OrderLineForm {
  part_id: string;
  batch_id?: string;
  qty: number;
  unit_price: number;
  discount_rate?: number;
  notes?: string;
}

export interface ShelfForm {
  code: string;
  area?: string;
  section?: string;
  shelf_number?: string;
  description?: string;
  capacity?: number;
  notes?: string;
}

export interface PriceRuleForm {
  name: string;
  description?: string;
  formula: string;
  condition_type: 'all' | 'category' | 'condition' | 'custom';
  condition_value?: string;
  active: boolean;
  priority: number;
}

// 9. TIPI PER RICERCA E FILTRI
// =====================================================

export interface SparePartSearchFilters {
  q?: string; // Ricerca testuale
  category_id?: string;
  condition?: string;
  status?: string;
  shelf_id?: string;
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  listing_status?: string;
  created_from?: string;
  created_to?: string;
}

export interface DismantlingJobFilters {
  status?: string;
  dismantler_name?: string;
  created_from?: string;
  created_to?: string;
  marca?: string;
  modello?: string;
}

export interface OrderFilters {
  type?: string;
  status?: string;
  payment_status?: string;
  customer_name?: string;
  created_from?: string;
  created_to?: string;
}

// 10. TIPI PER STATISTICHE E REPORT
// =====================================================

export interface SparePartStats {
  total_parts: number;
  available_parts: number;
  sold_parts: number;
  total_value: number;
  available_value: number;
  sold_value: number;
  categories_count: Record<string, number>;
  condition_count: Record<string, number>;
  status_count: Record<string, number>;
}

export interface SalesStats {
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  orders_by_type: Record<string, number>;
  revenue_by_type: Record<string, number>;
  top_selling_parts: Array<{
    part_id: string;
    part_name: string;
    qty_sold: number;
    revenue: number;
  }>;
}

export interface InventoryStats {
  total_stock_value: number;
  stock_by_category: Record<string, number>;
  stock_by_condition: Record<string, number>;
  low_stock_parts: Array<{
    part_id: string;
    part_name: string;
    quantity: number;
    min_threshold: number;
  }>;
  overstock_parts: Array<{
    part_id: string;
    part_name: string;
    quantity: number;
    max_threshold: number;
  }>;
}

// 11. TIPI PER IMPORT/EXPORT
// =====================================================

export interface ImportDismantlingJobData {
  targa: string;
  telaio?: string;
  marca: string;
  modello: string;
  anno: number;
  dismantling_date: string;
  dismantler_name?: string;
  parts: Array<{
    oem_code?: string;
    part_name: string;
    condition: string;
    qty: number;
    cost_price?: number;
    list_price?: number;
    notes?: string;
  }>;
}

export interface ExportPartsData {
  id: string;
  name: string;
  description?: string;
  oem_code?: string;
  ean_code?: string;
  internal_code?: string;
  category: string;
  condition: string;
  status: string;
  quantity: number;
  price_sell?: number;
  warehouse_location?: string;
  images: string[];
  tags: string[];
  compatibility_notes?: string;
}

// 12. TIPI PER API RESPONSE
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =====================================================
// FINE TIPI TYPESCRIPT SISTEMA RICAMBI MVP COMPLETO
// =====================================================

