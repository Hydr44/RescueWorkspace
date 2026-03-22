export interface BillingDriver {
    createDraft(inv: any): Promise<{ id: string, providerExtId?: string }>;
    sendToSdi(id: string, options?: Record<string, any>): Promise<any>;
    getPdf(id: string): Promise<string | null>;
    getXml(id: string): Promise<string | null>;
  }