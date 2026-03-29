import { tallyConfig } from "./tally.config.ts";
import type {
    TallySalesVoucherPayload,
    TallyReceiptVoucherPayload,
    TallyLedgerPayload,
    TallyStockItemPayload,
} from "./tally.types.ts";

const esc = (val: string | number) =>
    String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const company = () => esc(tallyConfig.companyName);

// ── Voucher builders ─────────────────────────────────────────────────────────

export const buildSalesVoucherXml = (p: TallySalesVoucherPayload): string => `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>IMPORT</TALLYREQUEST>
    <TYPE>DATA</TYPE>
    <ID>All Masters</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <IMPORTDUPS>@@DUPCOMBINE</IMPORTDUPS>
        <SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>${esc(p.date)}</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <NARRATION>${esc(p.narration || `Order #${p.orderId}`)}</NARRATION>
          <PARTYLEDGERNAME>${esc(p.partyName)}</PARTYLEDGERNAME>
          <LEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number"><OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS></OLDAUDITENTRYIDS.LIST>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
            <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
            <LEDGERNAME>${esc(p.partyName)}</LEDGERNAME>
            <AMOUNT>-${esc(p.totalAmount.toFixed(2))}</AMOUNT>
          </LEDGERENTRIES.LIST>
          <LEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number"><OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS></OLDAUDITENTRYIDS.LIST>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
            <LEDGERNAME>${esc(tallyConfig.salesLedger)}</LEDGERNAME>
            <AMOUNT>${esc(p.totalAmount.toFixed(2))}</AMOUNT>
          </LEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`.trim();

export const buildReceiptVoucherXml = (p: TallyReceiptVoucherPayload): string => `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>IMPORT</TALLYREQUEST>
    <TYPE>DATA</TYPE>
    <ID>All Masters</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <IMPORTDUPS>@@DUPCOMBINE</IMPORTDUPS>
        <SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER VCHTYPE="Receipt" ACTION="Create">
          <DATE>${esc(p.date)}</DATE>
          <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
          <NARRATION>${esc(p.narration || `Payment ${p.paymentId} for Order #${p.orderId}`)}</NARRATION>
          <PARTYLEDGERNAME>${esc(p.partyName)}</PARTYLEDGERNAME>
          <LEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number"><OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS></OLDAUDITENTRYIDS.LIST>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
            <LEDGERNAME>${esc(tallyConfig.bankLedger)}</LEDGERNAME>
            <AMOUNT>-${esc(p.amount.toFixed(2))}</AMOUNT>
          </LEDGERENTRIES.LIST>
          <LEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number"><OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS></OLDAUDITENTRYIDS.LIST>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
            <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
            <LEDGERNAME>${esc(p.partyName)}</LEDGERNAME>
            <AMOUNT>${esc(p.amount.toFixed(2))}</AMOUNT>
          </LEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`.trim();

// ── Master builders ──────────────────────────────────────────────────────────

export const buildLedgerXml = (p: TallyLedgerPayload): string => `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${esc(p.name)}" ACTION="${p.action}">
            <NAME>${esc(p.name)}</NAME>
            <PARENT>${esc(p.group || tallyConfig.ledgerGroup)}</PARENT>
            <MAILINGNAME>${esc(p.name)}</MAILINGNAME>
            ${p.email ? `<EMAIL>${esc(p.email)}</EMAIL>` : ""}
            ${p.address ? `<ADDRESS.LIST><ADDRESS>${esc(p.address)}</ADDRESS></ADDRESS.LIST>` : ""}
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();

export const buildStockItemXml = (p: TallyStockItemPayload): string => `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${esc(p.name)}" ACTION="${p.action}">
            <NAME>${esc(p.name)}</NAME>
            <BASEUNITS>${esc(p.unit || tallyConfig.stockUnit)}</BASEUNITS>
            ${p.openingRate !== undefined
                ? `<OPENINGRATE>${esc(p.openingRate.toFixed(2))}/${esc(p.unit || tallyConfig.stockUnit)}</OPENINGRATE>`
                : ""}
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();

// ── Batch builders (multiple TALLYMESSAGE blocks in one HTTP call) ─────────────

export const buildBatchLedgerXml = (payloads: TallyLedgerPayload[]): string => `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${payloads.map((p) => `<TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${esc(p.name)}" ACTION="${p.action}">
            <NAME>${esc(p.name)}</NAME>
            <PARENT>${esc(p.group || tallyConfig.ledgerGroup)}</PARENT>
            <MAILINGNAME>${esc(p.name)}</MAILINGNAME>
            ${p.email ? `<EMAIL>${esc(p.email)}</EMAIL>` : ""}
            ${p.address ? `<ADDRESS.LIST><ADDRESS>${esc(p.address)}</ADDRESS></ADDRESS.LIST>` : ""}
          </LEDGER>
        </TALLYMESSAGE>`).join("\n        ")}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();

export const buildBatchStockItemXml = (payloads: TallyStockItemPayload[]): string => `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${company()}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${payloads.map((p) => `<TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${esc(p.name)}" ACTION="${p.action}">
            <NAME>${esc(p.name)}</NAME>
            <BASEUNITS>${esc(p.unit || tallyConfig.stockUnit)}</BASEUNITS>
            ${p.openingRate !== undefined
                ? `<OPENINGRATE>${esc(p.openingRate.toFixed(2))}/${esc(p.unit || tallyConfig.stockUnit)}</OPENINGRATE>`
                : ""}
          </STOCKITEM>
        </TALLYMESSAGE>`).join("\n        ")}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
