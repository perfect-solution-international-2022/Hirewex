import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db"; 
import { eq } from "drizzle-orm";
import { users, userRoles } from "@/drizzle/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
        const user = result[0];

        // Fixed: passwordHash (camelCase)
        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash // Fixed: passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return user;
      }
    })
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async session({ session, user, token }) {
      const userId = user?.id || token?.sub; 

      if (session.user && userId) {
        // Fixed: userRoles.userId (camelCase)
        const userRolesData = await db.select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, userId as string));
        
        let mappedRoles = userRolesData.map((r) => r.role);

        if (mappedRoles.length === 0) {
          mappedRoles = ["buyer"]; 
        }

        // --- NEW: Fetch live KYC Status ---
        const userData = await db.select({ kycStatus: users.kycStatus })
          .from(users)
          .where(eq(users.id, userId as string))
          .limit(1);
          
        const currentKycStatus = userData[0]?.kycStatus || "unverified";

        // @ts-ignore
        session.user.roles = mappedRoles;
        // @ts-ignore
        session.user.kycStatus = currentKycStatus; // Attach it to the session
        session.user.id = userId as string; 
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt", 
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});