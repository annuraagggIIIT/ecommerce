import { prismaClient } from "../db/prisma.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";

const TOTAL = 50_000;
const BATCH_SIZE = 1_000;

const run = async () => {
    console.log(`Seeding ${TOTAL.toLocaleString()} test products in batches of ${BATCH_SIZE}...`);

    let inserted = 0;

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
        const start = batch * BATCH_SIZE + 1;

        const data = Array.from({ length: BATCH_SIZE }, (_, i) => {
            const n = start + i;
            return {
                name: `Dino ${n}`,
                description: `Test product Dino ${n}`,
                price: parseFloat((Math.random() * 9999 + 1).toFixed(2)),
                tags: "test,dino",
                tallyStatus: TALLY_STATUS.PRODUCT_NEW,
            };
        });

        await prismaClient.product.createMany({ data, skipDuplicates: true });

        inserted += BATCH_SIZE;
        process.stdout.write(`\r  Progress: ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()}`);
    }

    console.log(`\nDone — ${inserted.toLocaleString()} products seeded.`);
    await prismaClient.$disconnect();
};

run().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
