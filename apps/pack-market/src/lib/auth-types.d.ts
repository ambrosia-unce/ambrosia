import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      githubId: number;
      username: string;
      avatarUrl: string;
    } & import("next-auth").DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId: number;
    username: string;
    avatarUrl: string;
    accessToken: string;
  }
}
