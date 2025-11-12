// ❶  Augment Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // ✔ add whatever extras you return in authorize()
      role: "CUSTOMER" | "EMPLOYEE";
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
    role: "CUSTOMER" | "EMPLOYEE";
  }
}
