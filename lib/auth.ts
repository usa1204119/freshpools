import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import { prisma, isDbConfigured } from "./db";
import { verifyOtp } from "./otp";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      candidateId?: string | null;
      companyId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    candidateId?: string | null;
    companyId?: string | null;
  }
}

export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  CANDIDATE: "/me",
  COMPANY: "/co",
  ADMIN: "/admin",
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials sign-in requires JWT sessions; the adapter is not used for
  // session storage, only for the user records the OTP flow reads and writes.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      id: "otp",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        // Only honoured when the account does not exist yet.
        name: { label: "Name", type: "text" },
        intendedRole: { label: "Role", type: "text" },
      },
      async authorize(raw) {
        if (!isDbConfigured) return null;

        const email = String(raw?.email ?? "").toLowerCase().trim();
        const code = String(raw?.code ?? "").trim();
        if (!email || !code) return null;

        const result = await verifyOtp(email, code);
        if (!result.ok) return null;

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true },
        });

        if (existing) {
          if (!existing.name) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { emailVerified: new Date() },
            });
          }
          return {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            role: existing.role,
          };
        }

        // First sign-in creates the account. A self-serve signup can only ever
        // become CANDIDATE or COMPANY — ADMIN is assigned in the database.
        const requested = String(raw?.intendedRole ?? "CANDIDATE").toUpperCase();
        const role: Role = requested === "COMPANY" ? "COMPANY" : "CANDIDATE";
        const name = String(raw?.name ?? "").trim() || email.split("@")[0];

        const created = await prisma.user.create({
          data: { email, name, role, emailVerified: new Date() },
          select: { id: true, email: true, name: true, role: true },
        });

        return {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }

      // Refresh the profile ids on sign-in and on an explicit session update,
      // e.g. right after onboarding creates the Candidate/Company row.
      if ((user || trigger === "update") && token.id && isDbConfigured) {
        try {
          const profile = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              role: true,
              candidate: { select: { id: true } },
              company: { select: { id: true } },
            },
          });
          if (profile) {
            token.role = profile.role;
            token.candidateId = profile.candidate?.id ?? null;
            token.companyId = profile.company?.id ?? null;
          }
        } catch (error) {
          console.error("[auth] failed to hydrate profile ids", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.candidateId = token.candidateId ?? null;
      session.user.companyId = token.companyId ?? null;
      return session;
    },
  },
});

/* ── Guards used by server components and actions ────────────────────────── */

export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (!user || user.role !== role) return null;
  return user;
}
