/**
 * Seed a demo Super Administrator account.
 *
 * Creates:
 *   1. User row — email: superadmin@qbit.com, role: super_administrator,
 *      password: SuperAdmin@1234
 *
 * After seeding, the super-admin can log in at /accounts/login with:
 *   Mobile Number: (not applicable — use email login)
 *   OR
 *   Email: superadmin@qbit.com
 *   Password: SuperAdmin@1234
 *
 * NOTE: Super Admins log in with email (not mobile) since they're staff.
 * The /accounts/login page mobile field also accepts email — the NextAuth
 * authorize() callback detects email vs mobile automatically.
 *
 * Run with: npx tsx scripts/seed-super-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SUPER_ADMIN_EMAIL = "superadmin@qbit.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@1234";

async function main() {
  console.log("=== Seeding Super Administrator account ===");
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log("");

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const existing = await db.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        name: "Super Administrator",
        passwordHash,
        role: "super_administrator",
      },
    });
    console.log(`  ✓ Updated existing User: ${existing.id}`);
  } else {
    const user = await db.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        name: "Super Administrator",
        passwordHash,
        role: "super_administrator",
      },
    });
    console.log(`  ✓ Created User: ${user.id}`);
  }

  console.log("");
  console.log("=== Super Administrator ready! ===");
  console.log("");
  console.log("Login at: https://qbithub.vercel.app/accounts/login");
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log("");
  console.log("Portal: https://qbithub.vercel.app/super-admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
