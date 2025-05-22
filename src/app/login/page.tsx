"use client";
import { signIn } from "next-auth/react";
export default function Login() {
  async function handle(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    await signIn("credentials", { email, password, callbackUrl: "/timeline" });
  }
  return (
    <form action={handle} className="max-w-sm m-auto p-4 space-y-4">
      <input name="email" placeholder="Email" className="input" required />
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="input"
        required
      />
      <button className="btn w-full">Sign in</button>
    </form>
  );
}
