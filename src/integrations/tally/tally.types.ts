// ── Voucher types ────────────────────────────────────────────────────────────

export interface TallyLineItem {
    productName: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface TallySalesVoucherPayload {
    orderId: number;
    date: string;           // YYYYMMDD
    partyName: string;
    address: string;
    items: TallyLineItem[];
    totalAmount: number;
    narration?: string;
}

export interface TallyReceiptVoucherPayload {
    orderId: number;
    date: string;           // YYYYMMDD
    partyName: string;
    amount: number;
    paymentId: string;
    narration?: string;
}

// ── Master types ─────────────────────────────────────────────────────────────

export interface TallyLedgerPayload {
    /** Must match the Tally ledger name exactly on ALTER */
    name: string;
    /** Parent group — defaults to tallyConfig.ledgerGroup */
    group?: string;
    address?: string;
    email?: string;
    /** "Create" for new, "Alter" for existing */
    action: "Create" | "Alter";
}

export interface TallyStockItemPayload {
    /** Must match the Tally stock item name exactly on ALTER */
    name: string;
    /** Parent group — defaults to tallyConfig.stockGroup */
    group?: string;
    unit?: string;
    openingRate?: number;
    /** "Create" for new, "Alter" for existing */
    action: "Create" | "Alter";
}

// ── Job data (kept for future BullMQ use) ────────────────────────────────────

export interface TallyJobData {
    type: "sales_voucher" | "receipt_voucher" | "ledger" | "stock_item";
    payload:
        | TallySalesVoucherPayload
        | TallyReceiptVoucherPayload
        | TallyLedgerPayload
        | TallyStockItemPayload;
}

export interface TallyResponse {
    success: boolean;
    message?: string;
    rawXml?: string;
}
