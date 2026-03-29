import http from "http";
import { tallyConfig } from "./tally.config.ts";
import type { TallyResponse } from "./tally.types.ts";

// Persistent TCP connections — eliminates per-request handshake overhead
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 20 });

export const sendToTally = (xml: string): Promise<TallyResponse> => {
    if (process.env.TALLY_MOCK === "true") {
        console.log(`[Tally MOCK] ${xml.slice(0, 120).replace(/\s+/g, " ")}...`);
        return Promise.resolve({ success: true, message: "mocked" });
    }

    if (process.env.TALLY_DEBUG === "true") {
        console.log("\n[TALLY_DEBUG] ── REQUEST XML ─────────────────────────────");
        console.log(xml);
        console.log("────────────────────────────────────────────────────────\n");
    }

    return new Promise((resolve, reject) => {
        const body = Buffer.from(xml, "utf-8");

        const options: http.RequestOptions = {
            hostname: tallyConfig.host,
            port: tallyConfig.port,
            path: "/",
            method: "POST",
            agent: keepAliveAgent,
            headers: {
                "Content-Type": "text/xml;charset=utf-8",
                "Content-Length": body.length,
            },
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.setEncoding("utf-8");
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                if (process.env.TALLY_DEBUG === "true") {
                    console.log("\n[TALLY_DEBUG] ── RESPONSE XML ────────────────────────────");
                    console.log(data);
                    console.log("────────────────────────────────────────────────────────\n");
                }
                let failed: boolean;
                let message: string;

                const hasLineError  = data.includes("<LINEERROR>") || data.includes("NOTDONE");
                const hasException  = /<EXCEPTIONS>\s*[1-9]/.test(data);
                const nothingDone   = /<CREATED>\s*0\s*<\/CREATED>/.test(data) && hasException;
                failed  = hasLineError || nothingDone;
                message = failed
                    ? (hasLineError ? (data.match(/<LINEERROR>(.*?)<\/LINEERROR>/s)?.[1] ?? "Tally reported an error") : "Tally created 0 records (exception)")
                    : "OK";

                resolve({ success: !failed, message, rawXml: data });
            });
        });

        req.setTimeout(tallyConfig.timeoutMs, () => {
            req.destroy();
            reject(new Error("Tally request timed out"));
        });

        req.on("error", (err) => reject(err));
        req.write(body);
        req.end();
    });
};
