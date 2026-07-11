/**
 * NextAuth configuration for QBIT Hub.
 *
 * Strategy: JWT sessions with a Credentials provider backed by the Prisma
 * User table.  Passwords are hashed with bcrypt.  The role is injected into
 * the JWT token and surfaced on the session via the `role` callback.
 *
 * Demo accounts are seeded by `scripts/seed-users.ts` so the portal can be
 * exercised end-to-end without an external identity provider.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac/roles";

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

export const authOptions: NextAuthOptions = {
  // JWT strategy — no database session table required (works with SQLite).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    // We don't render a separate error page — the login screen handles it.
    error: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Corporate Email",
      credentials: {
        email: { label: "Corporate Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

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
