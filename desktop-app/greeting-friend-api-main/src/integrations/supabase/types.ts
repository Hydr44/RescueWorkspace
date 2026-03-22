export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assistance_requests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          org_id: string
          phone: string
          token: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          org_id: string
          phone: string
          token?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          org_id?: string
          phone?: string
          token?: string | null
          url?: string | null
        }
        Relationships: []
      }
      billing_providers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          city: string | null
          cognome: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          data_nascita: string | null
          email: string | null
          gender: string | null
          id: string
          indirizzo: string | null
          is_company: boolean | null
          luogo_nascita: string | null
          nome: string | null
          note: string | null
          notes: string | null
          org_id: string
          phone: string | null
          piva: string | null
          province: string | null
          sesso: string | null
          surname: string | null
          tax_code: string | null
          telefono: string | null
          vat: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          cognome?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascita?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          indirizzo?: string | null
          is_company?: boolean | null
          luogo_nascita?: string | null
          nome?: string | null
          note?: string | null
          notes?: string | null
          org_id: string
          phone?: string | null
          piva?: string | null
          province?: string | null
          sesso?: string | null
          surname?: string | null
          tax_code?: string | null
          telefono?: string | null
          vat?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          cognome?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascita?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          indirizzo?: string | null
          is_company?: boolean | null
          luogo_nascita?: string | null
          nome?: string | null
          note?: string | null
          notes?: string | null
          org_id?: string
          phone?: string | null
          piva?: string | null
          province?: string | null
          sesso?: string | null
          surname?: string | null
          tax_code?: string | null
          telefono?: string | null
          vat?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ddt: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          id: string
          meta: Json | null
          notes: string | null
          number: string | null
          org_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          meta?: Json | null
          notes?: string | null
          number?: string | null
          org_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          meta?: Json | null
          notes?: string | null
          number?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ddt_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ddt_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ddt_items: {
        Row: {
          ddt_id: string | null
          descr: string
          id: string
          qty: number
        }
        Insert: {
          ddt_id?: string | null
          descr: string
          id?: string
          qty?: number
        }
        Update: {
          ddt_id?: string | null
          descr?: string
          id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "ddt_items_ddt_id_fkey"
            columns: ["ddt_id"]
            isOneToOne: false
            referencedRelation: "ddt"
            referencedColumns: ["id"]
          },
        ]
      }
      demolition_cases: {
        Row: {
          anno: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          docs: Json | null
          id: string
          invoice_currency: string | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_total_cents: number | null
          marca_modello: string | null
          meta: Json
          note: string | null
          org_id: string
          pra_check: Json | null
          stato: string
          targa: string | null
          telaio: string | null
          transport_id: string | null
          updated_at: string
        }
        Insert: {
          anno?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          docs?: Json | null
          id?: string
          invoice_currency?: string | null
          invoice_date?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_total_cents?: number | null
          marca_modello?: string | null
          meta?: Json
          note?: string | null
          org_id: string
          pra_check?: Json | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          transport_id?: string | null
          updated_at?: string
        }
        Update: {
          anno?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          docs?: Json | null
          id?: string
          invoice_currency?: string | null
          invoice_date?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_total_cents?: number | null
          marca_modello?: string | null
          meta?: Json
          note?: string | null
          org_id?: string
          pra_check?: Json | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          transport_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demolition_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demolition_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demolition_cases_transport_id_fkey"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "transports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demolition_cases_transport_id_fkey"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "transports_with_driver"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          license_no: string | null
          name: string
          org_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          license_no?: string | null
          name: string
          org_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          license_no?: string | null
          name?: string
          org_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_parts_cache: {
        Row: {
          api_source: string
          created_at: string | null
          ean_code: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          last_sync: string | null
          oem_code: string | null
          part_data: Json
        }
        Insert: {
          api_source: string
          created_at?: string | null
          ean_code?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          last_sync?: string | null
          oem_code?: string | null
          part_data: Json
        }
        Update: {
          api_source?: string
          created_at?: string | null
          ean_code?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          last_sync?: string | null
          oem_code?: string | null
          part_data?: Json
        }
        Relationships: []
      }
      invoice_due: {
        Row: {
          amount: number
          due_date: string
          id: string
          invoice_id: string | null
          meta: Json | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          due_date: string
          id?: string
          invoice_id?: string | null
          meta?: Json | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          due_date?: string
          id?: string
          invoice_id?: string | null
          meta?: Json | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_due_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          descr: string
          id: string
          invoice_id: string | null
          price: number
          qty: number
          vat_perc: number
        }
        Insert: {
          descr: string
          id?: string
          invoice_id?: string | null
          price?: number
          qty?: number
          vat_perc?: number
        }
        Update: {
          descr?: string
          id?: string
          invoice_id?: string | null
          price?: number
          qty?: number
          vat_perc?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_address: Json | null
          customer_name: string
          customer_tax_code: string | null
          customer_vat: string | null
          date: string
          id: string
          meta: Json | null
          number: string | null
          org_id: string
          pdf_url: string | null
          provider_ext_id: string | null
          provider_id: string
          sdi_protocol: string | null
          sdi_status: string | null
          total: number | null
          xml_url: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_address?: Json | null
          customer_name: string
          customer_tax_code?: string | null
          customer_vat?: string | null
          date: string
          id?: string
          meta?: Json | null
          number?: string | null
          org_id: string
          pdf_url?: string | null
          provider_ext_id?: string | null
          provider_id: string
          sdi_protocol?: string | null
          sdi_status?: string | null
          total?: number | null
          xml_url?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_address?: Json | null
          customer_name?: string
          customer_tax_code?: string | null
          customer_vat?: string | null
          date?: string
          id?: string
          meta?: Json | null
          number?: string | null
          org_id?: string
          pdf_url?: string | null
          provider_ext_id?: string | null
          provider_id?: string
          sdi_protocol?: string | null
          sdi_status?: string | null
          total?: number | null
          xml_url?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          org_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_billing_connections: {
        Row: {
          access_token: string
          created_at: string | null
          fic_company_id: number | null
          id: string
          org_id: string
          provider_id: string
          refresh_token: string
          token_expires_at: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          fic_company_id?: number | null
          id?: string
          org_id: string
          provider_id: string
          refresh_token: string
          token_expires_at: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          fic_company_id?: number | null
          id?: string
          org_id?: string
          provider_id?: string
          refresh_token?: string
          token_expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_billing_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "billing_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          key: string
          org_id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          org_id: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          org_id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          current_period_end: string | null
          org_id: string
          plan: string
          status: string
          updated_at: string | null
        }
        Insert: {
          current_period_end?: string | null
          org_id: string
          plan: string
          status: string
          updated_at?: string | null
        }
        Update: {
          current_period_end?: string | null
          org_id?: string
          plan?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      orgs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      outbox_emails: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string | null
          error: string | null
          id: string
          org_id: string
          sent_at: string | null
          status: string
          subject: string
          to_addr: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string | null
          error?: string | null
          id?: string
          org_id: string
          sent_at?: string | null
          status?: string
          subject: string
          to_addr: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string | null
          error?: string | null
          id?: string
          org_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_addr?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbox_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_org: string | null
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_org?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          org_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_org?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_org_fkey"
            columns: ["current_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_presets: {
        Row: {
          created_at: string | null
          description: string
          id: number
          ord: number
          org_id: string
          price: number
          qty: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string
          id?: number
          ord?: number
          org_id: string
          price?: number
          qty?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          ord?: number
          org_id?: string
          price?: number
          qty?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_presets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: number | null
          cliente: string | null
          created_at: string
          data: string | null
          id: number
          importo: number | null
          iva_perc: number | null
          note: string | null
          numero: string | null
          org_id: string
          sconto_perc: number | null
          stato: string | null
          updated_at: string | null
          valuta: string | null
          voci: Json | null
        }
        Insert: {
          client_id?: number | null
          cliente?: string | null
          created_at?: string
          data?: string | null
          id?: number
          importo?: number | null
          iva_perc?: number | null
          note?: string | null
          numero?: string | null
          org_id: string
          sconto_perc?: number | null
          stato?: string | null
          updated_at?: string | null
          valuta?: string | null
          voci?: Json | null
        }
        Update: {
          client_id?: number | null
          cliente?: string | null
          created_at?: string
          data?: string | null
          id?: number
          importo?: number | null
          iva_perc?: number | null
          note?: string | null
          numero?: string | null
          org_id?: string
          sconto_perc?: number | null
          stato?: string | null
          updated_at?: string | null
          valuta?: string | null
          voci?: Json | null
        }
        Relationships: []
      }
      sdi_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          invoice_id: string | null
          payload: Json | null
          provider_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          invoice_id?: string | null
          payload?: Json | null
          provider_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          invoice_id?: string | null
          payload?: Json | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdi_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          auto_price: boolean | null
          category_id: string | null
          compatibility_notes: string | null
          condition: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dismantled_from_transport: string | null
          ean_code: string | null
          id: string
          images: Json | null
          internal_code: string | null
          metadata: Json | null
          name: string
          oem_code: string | null
          org_id: string
          price_buy: number | null
          price_sell: number | null
          quantity: number | null
          search_terms: string | null
          source_vehicle_id: string | null
          status: string | null
          technical_docs: Json | null
          updated_at: string | null
          warehouse_barcode: string | null
          warehouse_location: string | null
        }
        Insert: {
          auto_price?: boolean | null
          category_id?: string | null
          compatibility_notes?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dismantled_from_transport?: string | null
          ean_code?: string | null
          id?: string
          images?: Json | null
          internal_code?: string | null
          metadata?: Json | null
          name: string
          oem_code?: string | null
          org_id: string
          price_buy?: number | null
          price_sell?: number | null
          quantity?: number | null
          search_terms?: string | null
          source_vehicle_id?: string | null
          status?: string | null
          technical_docs?: Json | null
          updated_at?: string | null
          warehouse_barcode?: string | null
          warehouse_location?: string | null
        }
        Update: {
          auto_price?: boolean | null
          category_id?: string | null
          compatibility_notes?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dismantled_from_transport?: string | null
          ean_code?: string | null
          id?: string
          images?: Json | null
          internal_code?: string | null
          metadata?: Json | null
          name?: string
          oem_code?: string | null
          org_id?: string
          price_buy?: number | null
          price_sell?: number | null
          quantity?: number | null
          search_terms?: string | null
          source_vehicle_id?: string | null
          status?: string | null
          technical_docs?: Json | null
          updated_at?: string | null
          warehouse_barcode?: string | null
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "spare_parts_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_dismantled_from_transport_fkey"
            columns: ["dismantled_from_transport"]
            isOneToOne: false
            referencedRelation: "transports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_dismantled_from_transport_fkey"
            columns: ["dismantled_from_transport"]
            isOneToOne: false
            referencedRelation: "transports_with_driver"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_source_vehicle_id_fkey"
            columns: ["source_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts_categories: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spare_parts_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts_compatibility: {
        Row: {
          compatibility_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          spare_part_id: string
          vehicle_id: string
        }
        Insert: {
          compatibility_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          spare_part_id: string
          vehicle_id: string
        }
        Update: {
          compatibility_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          spare_part_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_compatibility_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_compatibility_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_drivers: {
        Row: {
          assegnati_oggi: number
          assegnatioggi: number
          created_at: string
          disp: Json | null
          id: number
          nome: string
          note: string | null
          org_id: string
          patente: string | null
          patenti: string[] | null
          preferenze: string[] | null
          stato: string
          tags: string[] | null
          telefono: string
          updated_at: string
        }
        Insert: {
          assegnati_oggi?: number
          assegnatioggi?: number
          created_at?: string
          disp?: Json | null
          id?: number
          nome: string
          note?: string | null
          org_id: string
          patente?: string | null
          patenti?: string[] | null
          preferenze?: string[] | null
          stato?: string
          tags?: string[] | null
          telefono: string
          updated_at?: string
        }
        Update: {
          assegnati_oggi?: number
          assegnatioggi?: number
          created_at?: string
          disp?: Json | null
          id?: number
          nome?: string
          note?: string | null
          org_id?: string
          patente?: string | null
          patenti?: string[] | null
          preferenze?: string[] | null
          stato?: string
          tags?: string[] | null
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_drivers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_vehicles: {
        Row: {
          autista: string | null
          created_at: string
          id: number
          modello: string
          note: string | null
          org_id: string
          portata: string | null
          scad_assicurazione: string | null
          scad_bollo: string | null
          scad_revisione: string | null
          scadenze: Json | null
          stato: string
          targa: string
          telaio: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          autista?: string | null
          created_at?: string
          id?: number
          modello: string
          note?: string | null
          org_id: string
          portata?: string | null
          scad_assicurazione?: string | null
          scad_bollo?: string | null
          scad_revisione?: string | null
          scadenze?: Json | null
          stato?: string
          targa: string
          telaio?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          autista?: string | null
          created_at?: string
          id?: number
          modello?: string
          note?: string | null
          org_id?: string
          portata?: string | null
          scad_assicurazione?: string | null
          scad_bollo?: string | null
          scad_revisione?: string | null
          scadenze?: Json | null
          stato?: string
          targa?: string
          telaio?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          price_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transports: {
        Row: {
          autista: string | null
          cap: string | null
          citta: string | null
          client_id: string | null
          cliente: string | null
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          dropoff_address: string | null
          eta_minutes: number | null
          id: string
          indirizzo: string | null
          lat: number | null
          lng: number | null
          mezzo: string | null
          note: string | null
          notes: string | null
          orario: string | null
          org_id: string
          pickup_address: string | null
          price_cents: number | null
          provincia: string | null
          stato: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
          via: string | null
        }
        Insert: {
          autista?: string | null
          cap?: string | null
          citta?: string | null
          client_id?: string | null
          cliente?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          dropoff_address?: string | null
          eta_minutes?: number | null
          id?: string
          indirizzo?: string | null
          lat?: number | null
          lng?: number | null
          mezzo?: string | null
          note?: string | null
          notes?: string | null
          orario?: string | null
          org_id: string
          pickup_address?: string | null
          price_cents?: number | null
          provincia?: string | null
          stato?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          via?: string | null
        }
        Update: {
          autista?: string | null
          cap?: string | null
          citta?: string | null
          client_id?: string | null
          cliente?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          dropoff_address?: string | null
          eta_minutes?: number | null
          id?: string
          indirizzo?: string | null
          lat?: number | null
          lng?: number | null
          mezzo?: string | null
          note?: string | null
          notes?: string | null
          orario?: string | null
          org_id?: string
          pickup_address?: string | null
          price_cents?: number | null
          provincia?: string | null
          stato?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string | null
          id: number
          nome: string
          note: string | null
          org_id: string
          ruolo: string
          stato: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome: string
          note?: string | null
          org_id: string
          ruolo?: string
          stato?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome?: string
          note?: string | null
          org_id?: string
          ruolo?: string
          stato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          autista: string | null
          created_at: string | null
          created_by: string | null
          id: string
          model: string | null
          modello: string | null
          note: string | null
          notes: string | null
          org_id: string
          plate: string
          portata: string | null
          scadenze: Json | null
          stato: string
          targa: string | null
          telaio: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          autista?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          model?: string | null
          modello?: string | null
          note?: string | null
          notes?: string | null
          org_id: string
          plate: string
          portata?: string | null
          scadenze?: Json | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          autista?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          model?: string | null
          modello?: string | null
          note?: string | null
          notes?: string | null
          org_id?: string
          plate?: string
          portata?: string | null
          scadenze?: Json | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles_catalog: {
        Row: {
          created_at: string | null
          engine_code: string | null
          fuel_type: string | null
          hp: number | null
          id: string
          ktype_id: string | null
          kw: number | null
          make: string
          metadata: Json | null
          model: string
          org_id: string
          updated_at: string | null
          vin_pattern: string | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          created_at?: string | null
          engine_code?: string | null
          fuel_type?: string | null
          hp?: number | null
          id?: string
          ktype_id?: string | null
          kw?: number | null
          make: string
          metadata?: Json | null
          model: string
          org_id: string
          updated_at?: string | null
          vin_pattern?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          created_at?: string | null
          engine_code?: string | null
          fuel_type?: string | null
          hp?: number | null
          id?: string
          ktype_id?: string | null
          kw?: number | null
          make?: string
          metadata?: Json | null
          model?: string
          org_id?: string
          updated_at?: string | null
          vin_pattern?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      yard_items: {
        Row: {
          categoria: string
          condizioni_in: string | null
          condizioni_out: string | null
          created_at: string
          foto: Json | null
          id: number
          ingressodata: string
          marca_modello: string
          note: string | null
          org_id: string
          posizione: string | null
          stato: string
          targa: string | null
          telaio: string | null
          updated_at: string
          uscita_effettiva: string | null
          uscita_prevista: string | null
        }
        Insert: {
          categoria?: string
          condizioni_in?: string | null
          condizioni_out?: string | null
          created_at?: string
          foto?: Json | null
          id?: number
          ingressodata?: string
          marca_modello?: string
          note?: string | null
          org_id: string
          posizione?: string | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          updated_at?: string
          uscita_effettiva?: string | null
          uscita_prevista?: string | null
        }
        Update: {
          categoria?: string
          condizioni_in?: string | null
          condizioni_out?: string | null
          created_at?: string
          foto?: Json | null
          id?: number
          ingressodata?: string
          marca_modello?: string
          note?: string | null
          org_id?: string
          posizione?: string | null
          stato?: string
          targa?: string | null
          telaio?: string | null
          updated_at?: string
          uscita_effettiva?: string | null
          uscita_prevista?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yard_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      transports_with_driver: {
        Row: {
          autista: string | null
          cap: string | null
          citta: string | null
          client_id: string | null
          cliente: string | null
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          driver_name: string | null
          dropoff_address: string | null
          eta_minutes: number | null
          id: string | null
          indirizzo: string | null
          lat: number | null
          lng: number | null
          mezzo: string | null
          note: string | null
          notes: string | null
          orario: string | null
          org_id: string | null
          pickup_address: string | null
          price_cents: number | null
          provincia: string | null
          stato: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
          via: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_set_user_org: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: undefined
      }
      claim_transport: {
        Args: { p_id: number } | { p_id: string }
        Returns: {
          autista: string | null
          cap: string | null
          citta: string | null
          client_id: string | null
          cliente: string | null
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          dropoff_address: string | null
          eta_minutes: number | null
          id: string
          indirizzo: string | null
          lat: number | null
          lng: number | null
          mezzo: string | null
          note: string | null
          notes: string | null
          orario: string | null
          org_id: string
          pickup_address: string | null
          price_cents: number | null
          provincia: string | null
          stato: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
          via: string | null
        }
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_role_for: {
        Args: { org: string }
        Returns: string
      }
      fn_is_member: {
        Args: { org: string }
        Returns: boolean
      }
      fn_is_owner: {
        Args: { org: string }
        Returns: boolean
      }
      generate_assistance_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_member: {
        Args: { org: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { org: string }
        Returns: boolean
      }
      is_org_driver: {
        Args: { org: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org: string } | { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      rpc_invoice_conserve: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      rpc_invoice_next_number: {
        Args: { p_org_id: string }
        Returns: string
      }
      rpc_invoice_send: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      rpc_invoice_set_outcome: {
        Args: { p_invoice_id: string; p_outcome: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
