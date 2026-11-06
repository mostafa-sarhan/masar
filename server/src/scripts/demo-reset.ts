// Resets the demo company now (demo mode does this every hour by itself):  npm run demo-reset
import { config } from "../config";
import { connectDb, disconnectDb } from "../config/db";
import { resetDemo } from "../modules/demo/demo.service";

async function main() {
  if (!config.demo.enabled) throw new Error("DEMO_MODE is not true for this instance");
  await connectDb(config.mongoUri);
  const { tenant, orders } = await resetDemo();
  process.stdout.write(`Reset "${tenant.name}": ${orders} orders\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
