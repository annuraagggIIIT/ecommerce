import { prismaClient } from "../db/prisma.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";

const TOTAL = 50_000;
const MAP_CHUNK = 5_000;   // how many users/products to fetch at once into maps
const TX_SIZE = 50;        // orders per transaction — keeps memory low
const FAKE_ADDRESS = "123 Test Street,,Test City,India,000000";

const run = async () => {
    // ── Build user map in chunks ──────────────────────────────────────────────
    console.log("Building user map...");
    const userMap = new Map<number, number>(); // n → userId
    let skip = 0;
    while (true) {
        const chunk = await prismaClient.user.findMany({
            where: { name: { startsWith: "test " } },
            select: { id: true, name: true },
            skip,
            take: MAP_CHUNK,
        });
        if (chunk.length === 0) break;
        for (const u of chunk) {
            const n = parseInt(u.name.slice(5));
            if (!isNaN(n)) userMap.set(n, u.id);
        }
        skip += MAP_CHUNK;
        process.stdout.write(`\r  Users mapped: ${userMap.size.toLocaleString()}`);
    }
    console.log(`\n  Done — ${userMap.size.toLocaleString()} users`);

    // ── Build product map in chunks ───────────────────────────────────────────
    console.log("Building product map...");
    const productMap = new Map<number, { id: number; price: number }>(); // n → {id, price}
    skip = 0;
    while (true) {
        const chunk = await prismaClient.product.findMany({
            where: { name: { startsWith: "Dino " } },
            select: { id: true, name: true, price: true },
            skip,
            take: MAP_CHUNK,
        });
        if (chunk.length === 0) break;
        for (const p of chunk) {
            const n = parseInt(p.name.slice(5));
            if (!isNaN(n)) productMap.set(n, { id: p.id, price: +p.price });
        }
        skip += MAP_CHUNK;
        process.stdout.write(`\r  Products mapped: ${productMap.size.toLocaleString()}`);
    }
    console.log(`\n  Done — ${productMap.size.toLocaleString()} products`);

    // ── Create orders in small transactions ───────────────────────────────────
    const count = Math.min(userMap.size, productMap.size, TOTAL);
    console.log(`\nSeeding ${count.toLocaleString()} orders (${TX_SIZE} per transaction)...`);

    let inserted = 0;

    for (let start = 1; start <= count; start += TX_SIZE) {
        const end = Math.min(start + TX_SIZE - 1, count);

        const ops = [];
        for (let n = start; n <= end; n++) {
            const userId = userMap.get(n);
            const prod = productMap.get(n);
            if (!userId || !prod) continue;

            ops.push(
                prismaClient.order.create({
                    data: {
                        userId,
                        netAmount: prod.price,
                        address: FAKE_ADDRESS,
                        tallyStatus: TALLY_STATUS.ORDER_NEW,
                        products: {
                            create: [{ productId: prod.id, quantity: 1, address: FAKE_ADDRESS }],
                        },
                        events: {
                            create: [{ status: "PENDING" }],
                        },
                    },
                })
            );
        }

        await prismaClient.$transaction(ops);
        inserted += ops.length;
        ops.length = 0; // free memory immediately
        process.stdout.write(`\r  Progress: ${inserted.toLocaleString()} / ${count.toLocaleString()}`);
    }

    console.log(`\nDone — ${inserted.toLocaleString()} orders seeded.`);
    await prismaClient.$disconnect();
};

run().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
