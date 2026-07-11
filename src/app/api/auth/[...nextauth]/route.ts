/**
 * NextAuth route handler — mounts the Auth.js catch-all at `/api/auth/*`.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
