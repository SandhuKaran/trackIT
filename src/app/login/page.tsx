"use client";

import { useTransition, useState } from "react"; // 1: Import useState
import { useRouter } from "next/navigation"; // 2: Import useRouter
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // 3: Get the router
  const [error, setError] = useState<string | null>(null); // 4: Add error state

  async function handle(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null); // Clear any old errors

    startTransition(async () => {
      // 5: Get the 'result' from signIn
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // 6: Tell NextAuth NOT to redirect
      });

      // 7: Check the result
      if (result && !result.ok) {
        // We got an error, show it
        setError("Sign in failed. Check the details you provided are correct.");
      } else {
        // Success! Manually redirect to the callbackUrl
        router.push("/");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        {/* 8: Render the error message */}
        {error && (
          <div className="mx-6 p-3 bg-red-900/50 text-red-100 border border-red-800 rounded-md">
            {error}
          </div>
        )}

        <form action={handle}>
          <CardContent className="grid gap-4 pt-6">
            {/* ... (rest of your form is perfect) ... */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input name="password" id="password" type="password" required />
            </div>
            <div className="pt-6" />
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
