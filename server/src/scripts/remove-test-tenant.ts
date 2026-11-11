// Deletes the test company and ALL its data (users, orders, couriers, merchants, zones, audit, sessions).
//   npm run remove-test-tenant               dry run: shows what would be deleted, deletes nothing
//   npm run remove-test-tenant -- --confirm  deletes it (one transaction: all or nothing)
// Refuses any company that isn't flagged isTest, so a real customer can't be removed with it.
import { config } from "../config";
import { connectDb, disconnectDb } from "../config/db";
import { planTestTenantRemoval, removeTestTenant, TEST_TENANT } from "../modules/demo/test-tenant";

async function main() {
  const confirm = process.argv.includes("--confirm");
  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const slug = slugArg ? slugArg.slice("--slug=".length) : TEST_TENANT.slug;
  await connectDb(config.mongoUri);
  const { tenant, counts } = confirm ? await removeTestTenant(slug) : await planTestTenantRemoval(slug);
  if (!tenant) {
    process.stdout.write(`No company with slug "${slug}": nothing to do.\n`);
    return;
  }
  process.stdout.write(`${confirm ? "Deleted" : "Dry run, would delete"} test company "${tenant.name}" (slug ${tenant.slug}) and:\n`);
  for (const [name, n] of Object.entries(counts!)) process.stdout.write(`  ${name.padEnd(14)} ${n}\n`);
  if (!confirm) process.stdout.write(`\nNothing was deleted. Run again with --confirm to delete.\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
