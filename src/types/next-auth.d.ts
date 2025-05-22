import NextAuth from "next-auth";

// ❶  Augment Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // ✔ add whatever extras you return in authorize()
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// ❷  Augment JWT type (if you use callbacks to persist the id)
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
