import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, Session, User } from "next-auth";
import { Adapter, AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
  }
}

// Custom adapter that allows linking OAuth to existing accounts
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  
  // Override createUser to handle existing users
  async createUser(data: Omit<AdapterUser, "id">): Promise<AdapterUser> {
    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email! },
    });

    if (existingUser) {
      // Return existing user instead of creating new one
      return {
        id: existingUser.id,
        email: existingUser.email,
        emailVerified: existingUser.emailVerified,
        name: existingUser.name,
        image: existingUser.image,
      } as AdapterUser;
    }

    // Create new user if doesn't exist
    const user = await prisma.user.create({
      data: {
        email: data.email!,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
      },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
    } as AdapterUser;
  },

  // Override getUserByEmail to always return user if exists
  async getUserByEmail(email: string): Promise<AdapterUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
    } as AdapterUser;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking to existing accounts
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("Please sign in with Google");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in for credentials
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth, check if account already exists and link if needed
      if (account && user.email) {
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        });

        // If no linked account exists, create one
        if (!existingAccount) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Link this OAuth account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null,
              },
            });
            
            // Update user info from OAuth if not set
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerified: existingUser.emailVerified ?? new Date(),
                image: existingUser.image ?? profile?.image,
                name: existingUser.name ?? profile?.name,
              },
            });
          }
        }
      }

      return true;
    },
    async jwt({ token, user, account }): Promise<JWT> {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  debug: process.env.NODE_ENV === "development",
};
