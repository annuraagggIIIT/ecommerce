/**
 * One-time migration script — run once after upgrading to batch workers.
 * Clears all old individual-format jobs from tally queues in Redis.
 */
import { Queue } from "bullmq";
import { bullmqConnection } from "../integrations/tally/queues/connection.ts";

const queues = ["tally-users", "tally-products", "tally-orders", "tally-scheduler"];

for (const name of queues) {
    const q = new Queue(name, { connection: bullmqConnection });
    await q.obliterate({ force: true });
    console.log(`Flushed queue: ${name}`);
    await q.close();
}

console.log("Done — safe to restart the server.");
process.exit(0);
