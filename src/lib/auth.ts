import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      issuer: "https://github.com/login/oauth",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user = { ...session.user, id: token.id as string };
      }
      return session;
    },
    async signIn({ user, account }) {
      // Resolve the user through the adapter-created account first. This is
      // reliable even when GitHub does not return a public email address.
      const persistedUser =
        (account?.provider && account.providerAccountId
          ? (
              await db.account.findUnique({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                },
                include: { user: true },
              })
            )?.user ?? null
          : null) ??
        (user.id
          ? await db.user.findUnique({ where: { id: user.id } })
          : null) ??
        (user.email
          ? await db.user.findUnique({ where: { email: user.email } })
          : null);

      if (!persistedUser) {
        console.error("[v0] OAuth user was not persisted before sign-in", {
          provider: account?.provider,
          providerAccountId: account?.providerAccountId,
        });
        return false;
      }
      user.id = persistedUser.id;

      // Auto-create personal workspace on first sign-in — FR-AUTH-04
      const existing = await db.workspace.findFirst({
        where: {
          members: { some: { userId: persistedUser.id } },
          isPersonal: true,
        },
      });
      if (!existing) {
        const baseName = persistedUser.name ?? "user";
        const slug = `${baseName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 24)}-${persistedUser.id.slice(0, 6)}`;

        const workspace = await db.workspace.create({
          data: {
            name: persistedUser.name ?? "My Workspace",
            slug,
            isPersonal: true,
            members: {
              create: {
                user: { connect: { id: persistedUser.id } },
                role: "OWNER",
              },
            },
          },
        });

        // Append-only audit log — DR-04
        await db.auditLogEntry.create({
          data: {
            workspaceId: workspace.id,
            actorUserId: persistedUser.id,
            action: "workspace.created",
            metadata: { isPersonal: true },
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const auth = () => getServerSession(authOptions);

