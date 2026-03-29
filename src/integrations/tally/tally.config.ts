import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const tallyConfig = {
    /** Tally XML HTTP server */
    host: process.env.TALLY_HOST || "localhost",
    port: parseInt(process.env.TALLY_PORT || "9000"),

    /** Must exactly match the company name opened in Tally */
    companyName: process.env.TALLY_COMPANY || "Anurag",

    /** Ledger group under which customer ledgers are created */
    ledgerGroup: process.env.TALLY_LEDGER_GROUP || "Anurag Debtors",

    /** Stock group under which products are created */
    stockGroup: process.env.TALLY_STOCK_GROUP || "All Items",

    /** Unit of measure used for stock items */
    stockUnit: process.env.TALLY_STOCK_UNIT || "Nos",

    /** Ledger used for the debit side of sales vouchers */
    salesLedger: process.env.TALLY_SALES_LEDGER || "Sales",

    /** Ledger used for receipts (bank / cash) */
    bankLedger: process.env.TALLY_BANK_LEDGER || "Bank",

    /** HTTP timeout in ms for each Tally call */
    timeoutMs: parseInt(process.env.TALLY_TIMEOUT_MS || "10000"),
} as const;
