// Creates (or recreates) a demo company with realistic data and one account per role:  npm run seed
// Only the company with SEED_SLUG is touched. Never run it against a production database you care about
// with a slug that belongs to a real company.
import { config } from "../config";
import { connectDb, disconnectDb } from "../config/db";
import { seedCompany } from "../modules/demo/seed-company";

async function main() {
  await connectDb(config.mongoUri);
  const password = process.env.SEED_PASSWORD || "Test123456";
  const { tenant, accounts, orders } = await seedCompany({
    name: process.env.SEED_COMPANY_NAME || "النيل للشحن السريع",
    slug: process.env.SEED_SLUG || "demo",
    emailDomain: process.env.SEED_EMAIL_DOMAIN || "masar-demo.test",
    password,
  });
  process.stdout.write(`Seeded "${tenant.name}" (slug ${tenant.slug}): ${orders} orders\n\n`);
  process.stdout.write(`${"Role".padEnd(10)}${"Email".padEnd(30)}Password\n`);
  for (const a of accounts) process.stdout.write(`${a.role.padEnd(10)}${a.email.padEnd(30)}${password}\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
