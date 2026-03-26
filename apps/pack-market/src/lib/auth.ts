import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getOrCreateUser } from "./store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user public_repo" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId = (profile as Record<string, unknown>).id as number;
        token.username = (profile as Record<string, unknown>).login as string;
        token.avatarUrl = (profile as Record<string, unknown>)
          .avatar_url as string;
        token.accessToken = account.access_token as string;

        await getOrCreateUser({
          githubId: token.githubId as number,
          username: token.username as string,
          avatarUrl: token.avatarUrl as string,
        });
      }
      return token;
    },
    async session({ session, token }) {
      // biome-ignore lint: next-auth type augmentation requires this pattern
      (session as unknown as Record<string, unknown>).accessToken =
        token.accessToken as string;
      session.user.githubId = token.githubId as number;
      session.user.username = token.username as string;
      session.user.avatarUrl = token.avatarUrl as string;
      return session;
    },
  },
});
