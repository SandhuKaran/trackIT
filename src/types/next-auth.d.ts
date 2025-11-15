// Import the default types
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

// ❶  Augment the `User` type
declare module "next-auth" {
  /**
   * This extends the `User` object returned from the `authorize` callback.
   * It ensures the `user` object passed to the `jwt` callback has your custom properties.
   */
  interface User extends DefaultUser {
    role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
    // You can add any other properties you return from `authorize` here
    // e.g., id: string; (though DefaultUser already has id)
  }

  /**
   * This extends the `Session` object.
   * Now, `session.user` will have the properties you defined.
   * Using `DefaultSession["user"] &` merges your types with the defaults.
   */
  interface Session {
    user: DefaultSession["user"] & {
      id: string; // `DefaultSession` only has name, email, image
      role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
    };
  }
}

// ❷  Augment the `JWT` type
declare module "next-auth/jwt" {
  /**
   * This extends the token object (what's stored in the JWT).
   * These properties are added in the `jwt` callback.
   */
  interface JWT {
    id: string;
    role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
  }
}
