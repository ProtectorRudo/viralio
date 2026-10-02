export type MercadoPagoPayment = {
  id: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string | null;
  description?: string | null;
  date_approved?: string | null;
  payer?: { email?: string | null };
  metadata?: Record<string, unknown> | null;
};

export type EbookPurchase = {
  payment_id: string;
  payer_email: string;
  status: string;
  amount: string | number;
  currency_id: string;
  approved_at: Date | string | null;
  delivery_email_status: "pending" | "sent" | "not_configured" | "failed";
  email_sent_at: Date | string | null;
  download_count: number;
};
