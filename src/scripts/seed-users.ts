import { prismaClient } from "../db/prisma.ts";
import { hashSync } from "bcrypt";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";

const TOTAL = 50_000;
const BATCH_SIZE = 1_000;

const run = async () => {
    console.log(`Seeding ${TOTAL.toLocaleString()} test users in batches of ${BATCH_SIZE}...`);

    // Pre-hash once and reuse — bcrypt is intentionally slow, no point hashing 50k times
    const password = hashSync("abc123", 10);

    let inserted = 0;

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
        const start = batch * BATCH_SIZE + 1;
        const end = start + BATCH_SIZE - 1;

        const data = Array.from({ length: BATCH_SIZE }, (_, i) => {
            const n = start + i;
            return {
                name: `test ${n}`,
                email: `test${n}@test.com`,
                password,
                role: "USER" as const,
                tallyStatus: TALLY_STATUS.USER_NEW,
            };
        });

        await prismaClient.user.createMany({ data, skipDuplicates: true });

        inserted += BATCH_SIZE;
        process.stdout.write(`\r  Progress: ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()}`);
    }

    console.log(`\nDone — ${inserted.toLocaleString()} users seeded.`);
    await prismaClient.$disconnect();
};

run().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
