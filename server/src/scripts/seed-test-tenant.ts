// Creates (or recreates) the test company "شركة مسار التجريبية" with sample data:  npm run seed-test-tenant
// Flagged isTest; remove it with `npm run remove-test-tenant`. Only that company is touched.
import { config } from "../config";
import { connectDb, disconnectDb } from "../config/db";
import { seedTestTenant } from "../modules/demo/test-tenant";

async function main() {
  await connectDb(config.mongoUri);
  const password = process.env.TEST_TENANT_PASSWORD || "Test123456";
  const { tenant, accounts, orders, merchantApiKey } = await seedTestTenant(password);
  process.stdout.write(`Seeded test company "${tenant.name}" (slug ${tenant.slug}, isTest): ${orders} orders\n\n`);
  for (const a of accounts) process.stdout.write(`${a.role.padEnd(10)}${a.email.padEnd(30)}${password}\n`);
  process.stdout.write(`\nMerchant API key (shown once): ${merchantApiKey}\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
