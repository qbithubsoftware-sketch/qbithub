/**
 * Seed script — creates the four demo accounts used to exercise RBAC.
 *
 * Run with: `bun run scripts/seed-users.ts`
 *
 * Demo credentials (all passwords are `<role>123`):
 *   admin@qbithub.com        / admin123        → administrator
 *   engineer@qbithub.com     / engineer123     → installation_engineer
 *   sales@qbithub.com        / sales123        → sales_executive
 *   dealer@qbithub.com       / dealer123       → dealer
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type SeedUser = {
  email: string;
  name: string;
  role: string;
  password: string;
};

const SEED_USERS: SeedUser[] = [
  {
    email: "admin@qbithub.com",
    name: "Alex Rivera",
    role: "administrator",
    password: "admin123",
  },
  {
    email: "engineer@qbithub.com",
    name: "Alex Chen",
    role: "installation_engineer",
    password: "engineer123",
  },
  {
    email: "sales@qbithub.com",
    name: "Sarah Jenkins",
    role: "sales_executive",
    password: "sales123",
  },
  {
    email: "dealer@qbithub.com",
    name: "James Wilson",
    role: "dealer",
    password: "dealer123",
  },
];

async function main() {
  console.log("Seeding QBIT Hub demo users...");
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const created = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
    console.log(`  ✓ ${created.email.padEnd(28)} → ${u.role}`);
  }
  console.log("\nDone. Demo credentials:");
  console.log("  admin@qbithub.com / admin123");
  console.log("  engineer@qbithub.com / engineer123");
  console.log("  sales@qbithub.com / sales123");
  console.log("  dealer@qbithub.com / dealer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
