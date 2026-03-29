/**
 * 4-digit Tally sync status codes stored on each DB row.
 *
 * 1xxx  → User  (maps to Tally Ledger)
 * 2xxx  → Product (maps to Tally Stock Item)
 * 3xxx  → Order (maps to Tally Sales + Receipt Voucher)
 *
 * Queue picks up any row whose status is NOT the *_SYNCED code.
 */

export const TALLY_STATUS = {
    // ── Users ───────────────────────────────────────────────
    /** User just registered — ledger needs to be CREATED in Tally */
    USER_NEW: 1000,
    /** User profile updated — ledger needs to be ALTERED in Tally */
    USER_UPDATED: 1001,
    /** Ledger successfully synced to Tally */
    USER_SYNCED: 1002,
    /** All retry attempts exhausted — ledger sync permanently failed */
    USER_FAILED: 1009,

    // ── Products ────────────────────────────────────────────
    /** Product created — stock item needs to be CREATED in Tally */
    PRODUCT_NEW: 2000,
    /** Product updated — stock item needs to be ALTERED in Tally */
    PRODUCT_UPDATED: 2001,
    /** Stock item successfully synced to Tally */
    PRODUCT_SYNCED: 2002,
    /** All retry attempts exhausted — stock item sync permanently failed */
    PRODUCT_FAILED: 2009,

    // ── Orders ──────────────────────────────────────────────
    /** Order created via payment — vouchers need to be CREATED in Tally */
    ORDER_NEW: 3000,
    /** Order status updated (e.g. CANCELLED) — may need a Credit Note */
    ORDER_UPDATED: 3001,
    /** Vouchers successfully synced to Tally */
    ORDER_SYNCED: 3002,
    /** All retry attempts exhausted — voucher sync permanently failed */
    ORDER_FAILED: 3009,
} as const;

export type TallyStatusCode = typeof TALLY_STATUS[keyof typeof TALLY_STATUS];
