import { sendToTally } from "./tally.client.ts";
import {
    buildSalesVoucherXml,
    buildReceiptVoucherXml,
    buildLedgerXml,
    buildStockItemXml,
    buildBatchLedgerXml,
    buildBatchStockItemXml,
} from "./tally.builder.ts";
import type {
    TallySalesVoucherPayload,
    TallyReceiptVoucherPayload,
    TallyLedgerPayload,
    TallyStockItemPayload,
    TallyResponse,
} from "./tally.types.ts";

export const createSalesVoucher = (payload: TallySalesVoucherPayload): Promise<TallyResponse> =>
    sendToTally(buildSalesVoucherXml(payload));

export const createReceiptVoucher = (payload: TallyReceiptVoucherPayload): Promise<TallyResponse> =>
    sendToTally(buildReceiptVoucherXml(payload));

export const syncLedger = (payload: TallyLedgerPayload): Promise<TallyResponse> =>
    sendToTally(buildLedgerXml(payload));

export const syncStockItem = (payload: TallyStockItemPayload): Promise<TallyResponse> =>
    sendToTally(buildStockItemXml(payload));

export const syncLedgerBatch = (payloads: TallyLedgerPayload[]): Promise<TallyResponse> =>
    sendToTally(buildBatchLedgerXml(payloads));

export const syncStockItemBatch = (payloads: TallyStockItemPayload[]): Promise<TallyResponse> =>
    sendToTally(buildBatchStockItemXml(payloads));
