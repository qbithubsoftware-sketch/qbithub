/**
 * NextAuth configuration for QBIT Hub.
 *
 * Strategy: JWT sessions with a Credentials provider backed by the Prisma
 * User table. Passwords are hashed with bcrypt. The role is injected into
 * the JWT token and surfaced on the session via the `role` callback.
 *
 * V3 — supports TWO login modes through the same Credentials provider:
 *   1. Staff login (via /portal): Corporate Email + Password
 *   2. Customer login (via /accounts/login): Mobile Number + Password
 *
 * The `authorize` callback detects which mode by inspecting the `email`
 * field — if it's a 10-digit number (or starts with +91), it's treated as
 * a mobile number lookup; otherwise it's treated as an email.
 *
 * Customer mobile-number login ALSO requires the mobile number to be
 * verified against the Purchase Database (via CustomerVerificationService).
 * If verification fails, login is denied with a specific reason.
 *
 * Demo accounts are seeded by `scripts/seed-users.ts` so the portal can be
 * exercised end-to-end without an external identity provider.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac/roles";
import {
  normalizeMobileNumber,
  isValidMobileNumber,
  verifyCustomerByMobile,
  CustomerVerificationReason,
} from "@/lib/auth/purchase-database";

/** Augment the NextAuth types with our custom role field. */
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

/** Detect if the given identifier is a mobile number (10 digits, optionally prefixed with +91). */
function isMobileNumber(identifier: string): boolean {
  const normalized = normalizeMobileNumber(identifier);
  return isValidMobileNumber(normalized);
}

export const authOptions: NextAuthOptions = {
  // JWT strategy — no database session table required (works with SQLite).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/accounts/login",
    // We don't render a separate error page — the login screen handles it.
    error: "/accounts/login",
  },
  providers: [
    CredentialsProvider({
      name: "QBIT Hub Login",
      credentials: {
        email: { label: "Email or Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim() ?? "";
        const password = credentials?.password ?? "";
        if (!identifier || !password) return null;

        // ===== Branch 1: Mobile Number login (customer) =====
        if (isMobileNumber(identifier)) {
          const mobileNumber = normalizeMobileNumber(identifier);

          // SECURITY: Verify the mobile number against the Purchase Database
          // BEFORE checking the password. This denies login for mobile numbers
          // that aren't associated with any registered QBIT product purchase.
          const verification = await verifyCustomerByMobile(mobileNumber);
          if (!verification.verified) {
            // Verification failed — return null so NextAuth shows "invalid credentials".
            // The actual reason is logged server-side; the UI shows a generic error.
            // (The /accounts/login page calls /api/auth/verify-customer FIRST, so the
            //  user sees the specific reason before even submitting the password.)
            console.warn(
              `[auth] Customer login denied for mobile ${mobileNumber}: ${verification.reason}`,
            );
            return null;
          }

          // Verification passed — look up the user by mobile-derived email.
          // Convention: customer users are stored with email = mobile@qbit.customer
          // (When the real Purchase Database is connected, this lookup will be
          //  replaced by a direct customer ID lookup — no User table needed.)
          const customerEmail = `${mobileNumber}@qbit.customer`;
          const user = await db.user.findUnique({
            where: { email: customerEmail },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              passwordHash: true,
            },
          });
          if (!user || !user.passwordHash) {
            // Customer verified in Purchase DB but no QBIT Hub account yet.
            // They need to be provisioned — contact dealer/support.
            console.warn(
              `[auth] Mobile ${mobileNumber} verified in Purchase DB but no User account exists.`,
            );
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as Role,
          };
        }

        // ===== Branch 2: Email login (staff) =====
        const email = identifier.toLowerCase();
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

/** Re-export for convenience. */
export { CustomerVerificationReason };
