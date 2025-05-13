import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

// For demonstration purposes - in production, you would use a database
const users = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    // In production, passwords should be hashed, not stored in plain text
    password: "password123"
  }
];

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in our mock database
        const user = users.find(user => user.email === credentials.email);
        
        // Check password (in production, use proper password comparison)
        if (user && user.password === credentials.password) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "this-is-a-development-secret-key",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
